// src/components/FileUpload.jsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firbase";
import { PDFDocument } from "pdf-lib";
import { rgb } from "pdf-lib";

export default function FileUpload({ onResumeUpload, onJobDescUpload }) {
  const [pdfData, setPdfData] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Example: Modify the PDF (e.g., add a text)
    const page = pdfDoc.getPages()[0]; // Get the first page
    page.drawText('Tailored Content Here', {
      x: 50,
      y: 700,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfData(url); // Set the modified PDF URL for preview
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} style={{ border: '2px dashed #cccccc', padding: '20px', textAlign: 'center' }}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop your resume PDF here, or click to select one</p>
      {pdfData && (
        <iframe
          src={pdfData}
          style={{ width: '100%', height: '500px', border: 'none' }}
          title="PDF Preview"
        />
      )}
    </div>
  );
}