const express = require('express')
const cors = require('cors')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const FormData = require('form-data') // For sending form data to TeXLive.net
require('dotenv').config()

const app = express()
const port = 5001

// Move this above `express.json()`
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key', 'Anthropic-Version', 'Accept'],
  credentials: true
}));

app.use(express.json());

// Ensure preflight requests are handled correctly
app.options('*', cors());

// Middleware to set CORS headers manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Api-Key, Anthropic-Version');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
      
// LaTeX template
const resumeTemplate = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome}
\\usepackage{multicol}
\\usepackage{geometry}
\\geometry{left=0.4in,top=0.4in,right=0.4in,bottom=0.4in}

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

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
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

\\newcommand{\\name}[1]{\\centerline{\\Huge \\scshape #1}\\vspace{1.25ex}}
\\newcommand{\\address}[1]{\\centerline{#1}\\vspace{-7pt}}
\\newcommand{\\basicInfo}[1]{\\centerline{\\small#1}\\vspace{-7pt}}

\\begin{document}
CONTENT_PLACEHOLDER
\\end{document}`;

app.post('/api/generate-resume', async (req, res) => {
  try {
    console.log('Incoming request body:', req.body)

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        ...req.body,  // Use the model and other parameters from the request body
        max_tokens: 3000,
        system: 'You are a professional resume writer skilled in LaTeX. Improve resumes based on job descriptions and return LaTeX output.',
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
      }
    )

    console.log('Anthropic API response:', response.data)

    res.json(response.data)
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate resume',
      details: error.response?.data || error.message
    })
  }
})

/**
 * Modified endpoint to send LaTeX code to the TeXLive.net server instead of using local pdflatex.
 */
app.post('/api/compile-latex', async (req, res) => {
  try {
    const { latexContent, useTemplate } = req.body;
    
    // If useTemplate is true, merge user content into the template
    const finalContent = useTemplate
      ? resumeTemplate.replace('CONTENT_PLACEHOLDER', latexContent)
      : latexContent;

    // Prepare form data according to TeXLive.net server's expected parameters
    // (Assuming the parameter name is "snip" for the LaTeX snippet; adjust if needed.)
    const formData = new FormData();
    formData.append('snip', finalContent);

    // Make a POST request to TeXLive.net server
    // Some TeXLive.net installs use "responseType: 'arraybuffer'" to get binary PDF data
    const texResponse = await axios.post(
      'https://texlive.net/cgi-bin/latexcgi', 
      formData, 
      { responseType: 'arraybuffer' }
    );

    // On success, TeXLive.net should return PDF binary data
    // Send that directly back to the client
    res.set('Content-Type', 'application/pdf');
    res.send(texResponse.data);

  } catch (error) {
    console.error('Error compiling LaTeX via TeXLive.net:', error.message);
    // If TeXLive.net returns an error log, you could forward it to the user
    res.status(500).json({ error: 'Failed to compile LaTeX to PDF', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
