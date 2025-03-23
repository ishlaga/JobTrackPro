const express = require('express')
const cors = require('cors')
const axios = require('axios')
const FormData = require('form-data')
require('dotenv').config()

const app = express()
const port = 5001

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key', 'Anthropic-Version', 'Accept'],
  credentials: true
}));

app.use(express.json());

// Ensure preflight requests are handled correctly
app.options('*', cors());

app.post('/api/generate-resume', async (req, res) => {
  try {
    console.log('Incoming request body:', JSON.stringify(req.body, null, 2))

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 3000,
        system: req.body.messages[0].content,
        messages: [
          {
            role: 'user',
            content: req.body.messages[1].content
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
      }
    )

    console.log('Claude API Response:', JSON.stringify(response.data, null, 2))
    
    // Extract the content from Claude's response
    const content = response.data.content[0].text
    console.log('Generated LaTeX:', content)

    res.json({ content }) // Send just the content
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

app.post('/api/compile-latex', async (req, res) => {
  try {
    let { latexContent } = req.body;
    
    // Clean up the content
    latexContent = latexContent.replace('Here is the generated resume in LaTeX format:', '').trim();
    latexContent = latexContent.replace('Here is the complete LaTeX resume tailored to the job description:', '').trim();
    
    // Create form data with correct TeXLive.net parameters
    const formData = new FormData();
    formData.append('filecontents[]', latexContent);  // Content of the file
    formData.append('filename[]', 'document.tex');    // Must be named document.tex
    formData.append('engine', 'pdflatex');           // Specify engine
    formData.append('return', 'pdf');                // Request direct PDF return
    
    console.log('Sending request to TeXLive.net...');
    const texResponse = await axios.post(
      'https://texlive.net/cgi-bin/latexcgi',       // Correct endpoint
      formData, 
      { 
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/pdf'
        },
        timeout: 30000
      }
    );

    // Check response
    console.log('Response status:', texResponse.status);
    console.log('Response headers:', texResponse.headers);

    // Set proper headers for PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': texResponse.data.length,
      'Content-Disposition': 'inline; filename="resume.pdf"'
    });
    
    res.send(texResponse.data);

  } catch (error) {
    console.error('Error compiling LaTeX:', error);
    res.status(500).json({ 
      error: 'Failed to compile LaTeX to PDF', 
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})