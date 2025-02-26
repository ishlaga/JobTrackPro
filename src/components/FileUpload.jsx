import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import './FileUpload.css'; // Import a CSS file for styling

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

export default function FileUpload({ onResumeUpload }) {
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [error, setError] = useState(null); // State for error messages
  const [file, setFile] = useState(null); // State to hold the dropped file
  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();

  const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes

  // Set the workerSrc for pdfjs
  GlobalWorkerOptions.workerSrc = pdfWorker;

  const onDrop = (acceptedFiles) => {
    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    // Check file size
    if (droppedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds 500 KB. Please upload a smaller file.");
      return;
    }

    setFile(droppedFile); // Store the dropped file
    setError(null); // Reset error state
  };

  const handleSave = async () => {
    if (!file) {
      setError("No file selected for upload.");
      return;
    }

    setUploading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("🚨 User not logged in! Upload canceled.");
        setUploading(false);
        return;
      }

      // Extract text from the PDF first
      const extractedText = await extractTextFromPdf(file);
      console.log("✅ Text extracted from PDF");

      // Upload file to Firebase Storage (if you still want to store the file)
      const safeFileName = file.name.replace(/\s+/g, "_").replace(/[()]/g, "");
      const storageRef = ref(storage, `resumes/${user.uid}/${safeFileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Store metadata in Firestore
      await addDoc(collection(db, "resumes"), {
        userId: user.uid,
        fileName: safeFileName,
        url: downloadURL,
        uploadedAt: new Date(),
      });

      setResumeUrl(downloadURL);
      // Pass the extracted text to the parent component instead of the URL
      onResumeUpload(extractedText);

    } catch (error) {
      console.error("🚨 Upload failed:", error);
      setError("Upload failed: " + error.message);
    }

    setUploading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('No file selected.');
      return;
    }

    // Extract text from the PDF
    const text = await extractTextFromPdf(file);
    if (text) {
      // Call the onResumeUpload function with the extracted text
      onResumeUpload(text);
    }

    // Upload the file to Firebase Storage
    const storageRef = ref(storage, `resumes/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('File available at', downloadURL);
  };

  const extractTextFromPdf = async (file) => {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async () => {
        const typedArray = new Uint8Array(fileReader.result);
        const pdf = await getDocument(typedArray).promise;
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          extractedText += pageText + '\n';
        }

        // Clean the extracted text
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();
        resolve(cleanText);
      };

      fileReader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="file-upload-container">
      <div {...getRootProps()} className={`dropzone ${uploading ? 'uploading' : ''}`}>
        <input {...getInputProps()} />
        <p>{uploading ? "Uploading..." : "Drag & drop your resume (PDF) here, or click to select a file"}</p>
      </div>
      {error && <p className="error-message">{error}</p>}
      {resumeUrl && (
        <p>
          ✅ Resume uploaded:{" "}
          <a href={resumeUrl} target="_blank" rel="noopener noreferrer">View Resume</a>
        </p>
      )}
      <button onClick={handleSave} disabled={uploading || !file} className="save-button">
        Save
      </button>
    </div>
  );
}
