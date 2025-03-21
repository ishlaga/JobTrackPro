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
      max_tokens: 15000,
      system: `You are a skilled resume content writer. Your task is to generate content for a LaTeX resume based on the user's original resume and a job description.

IMPORTANT: DO NOT include any LaTeX preamble, document class, or package definitions. Only provide the content that goes INSIDE the document environment.

For each section, follow these rules:
1. For PERSONAL INFO:
   - Include name, address, email, phone, LinkedIn, and GitHub

2. For EDUCATION:
   - Format: Institution name, Location, Degree, GPA, Graduation date

3. For EXPERIENCE:
   - Format: Company name, Location, Position, Dates
   - Each position MUST have EXACTLY 3-4 bullet points
   - Each bullet point MUST be one line only
   - Use action verbs at the start of each bullet

4. For PROJECTS:
   - Format: Project name, Technologies used, Dates
   - Each project MUST have EXACTLY 3-4 bullet points
   - Each bullet point MUST be one line only
   - Focus on technical achievements

5. For SKILLS:
   - Organize by categories (Languages, Frameworks, Tools, etc.)
   - Prioritize skills mentioned in the job description

Return ONLY the content using these LaTeX commands:
- \\name{Your Name}
- \\address{Location · Phone · Email}
- \\basicInfo{Email, Phone, LinkedIn, GitHub}
- \\section{Section Title}
- \\datedsubsection{Company/University}{Date}
- \\role{Position Title}{}
- \\resumeItem{Bullet point content}
- \\resumeSubItem{Category}{List of skills}

NO DOCUMENT CLASS, NO PACKAGES, NO \\begin{document}, NO \\end{document}. Just the content.`,
      messages: [
        {
          role: 'user',
          content: `
Resume Text:
${extractedText}  

Job Description:
${jobDescription}

TASK:
- Generate resume content that highlights skills and experience relevant to the job description
- Focus on tailoring the Skills section to match job requirements
- Each experience and project MUST have EXACTLY 3-4 bullet points
- Each bullet point MUST be ONE LINE only
- Use strong action verbs at the start of each bullet point
- Keep everything concise to fit on a single page

Return ONLY the LaTeX content using the commands I specified. NO preamble, NO document class, NO begin/end document tags.
`,
        },
      ],
    };

    console.log('Request Payload:', requestPayload);

    try {
      // 1) Get improved LaTeX from Anthropic
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
      const resumeContent = data.content[0].text;
      setClaudeOutput(resumeContent);
      console.log('Claude Response:', resumeContent);

      // 2) Compile LaTeX -> PDF via your updated server route (which now calls TeXLive.net)
      const pdfResponse = await fetch('http://localhost:5001/api/compile-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latexContent: resumeContent,
          useTemplate: true
        }), 
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to compile LaTeX to PDF');
      }

      // Convert PDF to a blob and display
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
