const express = require('express')
const cors = require('cors')
const axios = require('axios')
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

app.post('/api/compile-latex', async (req, res) => {
  try {
    const { latexContent } = req.body;

    const response = await axios.get(`https://latexonline.cc/compile?text=${encodeURIComponent(latexContent)}`, {
      responseType: 'arraybuffer', // Ensure the response is treated as binary data
    });

    res.set('Content-Type', 'application/pdf');
    res.send(response.data);
  } catch (error) {
    console.error('Error compiling LaTeX:', error.message);
    res.status(500).json({ error: 'Failed to compile LaTeX to PDF' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
