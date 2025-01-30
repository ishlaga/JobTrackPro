// src/components/FileUpload.jsx
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import pdfParse from "pdf-parse";

export default function FileUpload({ onResumeUpload, onJobDescUpload }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const storageRef = ref(storage, `uploads/${file.name}`);
    await uploadBytes(storageRef, file);

    // Extract text from PDF
    const reader = new FileReader();
    reader.onload = async () => {
      const pdf = await pdfParse(reader.result);
      if (file.name.includes("resume")) {
        onResumeUpload(pdf.text);
      } else {
        onJobDescUpload(pdf.text);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {isDragActive ? "Drop files here..." : "Drag & drop resume/job description"}
    </div>
  );
}