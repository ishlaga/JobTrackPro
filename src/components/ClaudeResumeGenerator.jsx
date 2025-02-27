import { useState } from 'react';

export default function ClaudeResumeGenerator({ extractedText, jobDescription }) {
  const [claudeOutput, setClaudeOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const handleGenerateResume = async () => {
    setLoading(true);
    setError('');
    setClaudeOutput('');
    setPdfUrl('');

    // Create request payload
    const requestPayload = {
        model: 'claude-3-opus-20240229',
        max_tokens: 5000,
        system: `
    You are a professional resume writer skilled in LaTeX. You MUST follow Jake Gutierrez's LaTeX resume template EXACTLY.
    
    STRICT RULES:
    - Generate a COMPLETE LaTeX document that includes ALL necessary preamble commands and document structure
    - Start with \\documentclass and end with \\end{document}
    - Include ALL required package imports and custom commands from the template
    - Only make minimal, strategic adjustments to highlight relevant experience
    - Rephrase existing bullet points to incorporate job keywords, but do not remove original content
    - DO NOT remove or significantly alter original projects and experiences
    - DO NOT generate a CV or add new sections
    - DO NOT remove works experience or projects mentioned in the request.
    - name should be centered and highlighted in the resume.
    -  the outline should match Education, Experinces, Projects, Technical Skills, Achivements(optional, only if mentioned in the request)
    - DO NOT include explanations or comments
    - Ensure the LaTeX code compiles correctly into one full page
    - Keep all content ATS-friendly and structured correctly
    - Maintain original dates and formatting consistency
    - Preserve all original LaTeX formatting commands and structure
    
    The response MUST be a complete, compilable LaTeX document that includes ALL necessary components from the template.
    `,
        messages: [
          {
            role: 'user',
            content: `
      Resume Text:
      ${extractedText}  
      
      Job Description:
      ${jobDescription}
      
      TASK:
      - Update the resume to match the job description.
      - DO NOT generate a CV. 
      - DO NOT modify the format; keep it STRICTLY as per Jake Gutierrez's LaTeX resume.
      - DO NOT remove works experience or projects mentioned in the request.
      
      Return ONLY LaTeX. NO explanations, NO comments, NO additional sections.
      `,
          },
        ],
      };
      

    // Log the request details
    console.log('Request URL:', 'http://localhost:5001/api/generate-resume');
    console.log('Request Payload:', requestPayload);

    try {
      const response = await fetch('http://localhost:5001/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const latexContent = data.content[0].text;
      setClaudeOutput(latexContent);
      console.log('LaTeX Content:', latexContent);

      // Compile LaTeX to PDF via server
      const pdfResponse = await fetch('http://localhost:5001/api/compile-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexContent }),
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to compile LaTeX to PDF');
      }

      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateResume} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Resume'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {pdfUrl && (
        <div>
          <h3>Generated PDF Resume:</h3>
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '500px', border: 'none' }}
            title="PDF Resume"
          ></iframe> 
        </div>
      )}
    </div>
  );
}
