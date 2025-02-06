import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";

export default function FileUpload({ onResumeUpload }) {
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);

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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #ccc",
          padding: "20px",
          cursor: "pointer",
          backgroundColor: uploading ? "#f8f9fa" : "white",
        }}
      >
        <input {...getInputProps()} />
        <p>{uploading ? "Uploading..." : "Drag & drop your resume (PDF) here, or click to select a file"}</p>
      </div>

      {resumeUrl && (
        <p>
          ✅ Resume uploaded:{" "}
          <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
            View Resume
          </a>
        </p>
      )}
    </div>
  );
}
