import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Auth from './components/Auth'
import FileUpload from './components/FileUpload'
import Editor from './components/editor'

function App() {
  const [resumeContent, setResumeContent] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleResumeUpload = (content) => {
    setResumeContent(content)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  return (
    <Router>
      <Routes>
        <Route path="/upload" element={isAuthenticated ? <FileUpload onResumeUpload={handleResumeUpload} /> : <Navigate to="/" />} />
        <Route path="/" element={<Auth onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
      <Editor content={resumeContent} onUpdate={setResumeContent} />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>Tailor your resume based on the job description!</p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </Router>
  )
}

export default App
