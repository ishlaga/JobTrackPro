import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Auth from './components/Auth'
import FileUpload from './components/FileUpload'
import Editor from './components/Editor'
import ClaudeResumeGenerator from './components/ClaudeResumeGenerator'

function App() {
  const [resumeContent, setResumeContent] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [savedJobDescription, setSavedJobDescription] = useState('')

  const handleResumeUpload = (content) => {
    setResumeContent(content)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleSaveJobDescription = () => {
    setSavedJobDescription(jobDescription)
    // You can add additional logic here, like showing a success message
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Auth onLoginSuccess={handleLoginSuccess} />} />
          <Route 
            path="/upload" 
            element={
              isAuthenticated ? (
                <div className="dashboard-container">
                  <nav className="dashboard-nav">
                    <h1 className="dashboard-title">JobTrackPro</h1>
                  </nav>
                  <div className="content-wrapper">
                    <div className="left-panel">
                      <div className="panel-section upload-section">
                        <h2>Upload Resume</h2>
                        <FileUpload onResumeUpload={handleResumeUpload} />
                      </div>
                      <div className="panel-section job-description-section">
                        <h2>Job Description</h2>
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste job description here..."
                          rows={6}
                          className="job-description-textarea"
                        />
                        <button 
                          onClick={handleSaveJobDescription}
                          className="save-button"
                        >
                          Save 
                        </button>
                      </div>
                    </div>
                    <div className="right-panel">
                      <div className="panel-section editor-section">
                        <h2>Resume Editor</h2>
                        {resumeContent && savedJobDescription && (
                          <ClaudeResumeGenerator 
                            extractedText={resumeContent}
                            jobDescription={savedJobDescription}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Navigate to="/" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
