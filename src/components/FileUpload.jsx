import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import './FileUpload.css'; // Import a CSS file for styling

export default function FileUpload({ onResumeUpload }) {
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [error, setError] = useState(null); // State for error messages
  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();

  const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 500 KB. Please upload a smaller file.");
      return;
    }

    setUploading(true);
    setError(null); // Reset error state

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("🚨 User not logged in! Upload canceled.");
        setUploading(false);
        return;
      }

      console.log("✅ Uploading file for user:", user.uid);

      // 🔥 Ensure Safe File Name (Removes spaces & special characters)
      const safeFileName = file.name.replace(/\s+/g, "_").replace(/[()]/g, "");

      // ✅ Correct Firebase Storage Reference (NO MANUAL URL CONSTRUCTION)
      const storageRef = ref(storage, `resumes/${user.uid}/${safeFileName}`);

      // ✅ Upload File to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);
      console.log("✅ File uploaded:", snapshot.metadata.fullPath);

      // ✅ Get the Correct Download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("✅ Download URL:", downloadURL);

      // ✅ Store metadata in Firestore
      await addDoc(collection(db, "resumes"), {
        userId: user.uid,
        fileName: safeFileName,
        url: downloadURL,
        uploadedAt: new Date(),
      });

      setResumeUrl(downloadURL);
      onResumeUpload(downloadURL);
    } catch (error) {
      console.error("🚨 Upload failed:", error);
    }

    setUploading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
    </div>
  );
}
