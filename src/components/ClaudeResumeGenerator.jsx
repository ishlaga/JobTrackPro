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

    const systemPrompt = `You are a professional resume writer skilled in LaTeX. You must use EXACTLY this template structure for all resumes:

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{} 
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

Key requirements:
1. Use EXACTLY these sections in order: Education, Experience, Projects, Technical Skills
2. For each experience and project:
   - Use exactly 3-4 bullet points
   - Start each bullet point with an action verb
   - Keep bullet points to one line
3. Use the predefined commands:
   - \\resumeSubheading for education and experience entries
   - \\resumeProjectHeading for project entries
   - \\resumeItem for bullet points
4. Technical Skills should use the exact format shown with Languages, Frameworks, Developer Tools, Libraries
5. Keep all content between \\begin{document} and \\end{document}
6. Ensure content fits on one page

VERY IMPORTANT: You MUST include the complete LaTeX document with \\begin{document} and \\end{document} tags. Do not omit any part of the template. Make sure your output is a complete, compilable LaTeX document.`;

    const userPrompt = `Resume Text:\n${extractedText}\n\nJob Description:\n${jobDescription}\n\nTASK:\n- Generate resume content that highlights skills and experience relevant to the job description\n- Focus on tailoring the Skills section to match job requirements\n- Each experience and project MUST have EXACTLY 3-4 bullet points\n- Each bullet point MUST be ONE LINE only\n- Use strong action verbs at the start of each bullet point\n- Keep everything concise to fit on a single page\n- Include a complete, compilable LaTeX document from \\documentclass to \\end{document}\n- The resume should have a proper header with name, contact information, and links`;

    // Create request payload
    const requestPayload = {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    };

    // Log the request details
    console.log('Request URL:', 'http://localhost:5001/api/generate-resume');
    console.log('Request Payload:', requestPayload);

    try {
      const response = await fetch('http://localhost:5001/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server Response:', data);
      
      if (data.content) {
        setClaudeOutput(data.content);
        console.log('Generated LaTeX Content:', data.content);

        // Compile LaTeX -> PDF
        const pdfResponse = await fetch('http://localhost:5001/api/compile-latex', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latexContent: data.content
          }), 
        });

        // First check if the response is JSON (error message) or PDF
        const contentType = pdfResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await pdfResponse.json();
          throw new Error(`LaTeX Compilation Error: ${errorData.details}`);
        }

        if (!pdfResponse.ok) {
          throw new Error(`PDF Compilation failed: ${pdfResponse.statusText}`);
        }

        // Ensure we got PDF
        if (!contentType || !contentType.includes('application/pdf')) {
          throw new Error(`Invalid response type: ${contentType}`);
        }

        const pdfBlob = await pdfResponse.blob();
        if (pdfBlob.size === 0) {
          throw new Error('Received empty PDF file');
        }

        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
      }
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