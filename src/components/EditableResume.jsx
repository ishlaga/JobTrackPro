import { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';

export default function EditableResume({ initialLatex }) {
  const [latexCode, setLatexCode] = useState(initialLatex || '');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState('');
  const debounceTimerRef = useRef(null);
  
  // Function to compile LaTeX and generate PDF preview
  const compileLatex = async (latex) => {
    setIsCompiling(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5001/api/compile-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexContent: latex }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to compile LaTeX');
      }
      
      const pdfBlob = await response.blob();
      
      // Revoke previous URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error compiling LaTeX:', error);
      setError(error.message || 'Failed to compile LaTeX');
    } finally {
      setIsCompiling(false);
    }
  };
  
  // Debounced compilation when code changes
  const debouncedCompile = (latex) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      compileLatex(latex);
    }, 1500); // 1.5 second delay
  };
  
  // Handle code changes
  const handleCodeChange = (value) => {
    setLatexCode(value);
    debouncedCompile(value);
  };
  
  // Manual compilation
  const handleManualCompile = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    compileLatex(latexCode);
  };
  
  // Compile on initial load
  useEffect(() => {
    if (initialLatex) {
      compileLatex(initialLatex);
    }
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [initialLatex]);
  
  // Download functions
  const downloadLatex = () => {
    const blob = new Blob([latexCode], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const downloadPdf = () => {
    if (!previewUrl) return;
    
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="editable-resume" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="editor-actions" style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleManualCompile}
          disabled={isCompiling}
          className="save-button"
        >
          {isCompiling ? 'Compiling...' : 'Update Preview'}
        </button>
        
        <button 
          onClick={downloadLatex}
          className="save-button"
        >
          Download LaTeX
        </button>
        
        <button 
          onClick={downloadPdf}
          disabled={!previewUrl}
          className="save-button"
          style={{ opacity: !previewUrl ? 0.5 : 1 }}
        >
          Download PDF
        </button>
      </div>
      
      {error && (
        <div className="error-message" style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          color: 'white', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
        {/* Editor Panel */}
        <div className="editor-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', marginBottom: '10px' }}>Edit LaTeX Code</h3>
          <div style={{ flex: 1, border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
            <CodeMirror
              value={latexCode}
              height="100%"
              extensions={[StreamLanguage.define(stex)]}
              onChange={handleCodeChange}
              theme="dark"
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>
        
        {/* Preview Panel */}
        <div className="preview-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', marginBottom: '10px' }}>Preview</h3>
          <div style={{ 
            flex: 1, 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            borderRadius: '8px', 
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {isCompiling ? (
              <div className="loading-indicator" style={{ textAlign: 'center', color: '#764ba2' }}>
                <p>Compiling LaTeX...</p>
                <div className="spinner" style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid rgba(118, 75, 162, 0.3)',
                  borderTop: '4px solid #764ba2',
                  borderRadius: '50%',
                  margin: '20px auto',
                  animation: 'spin 2s linear infinite'
                }}></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Resume Preview"
              />
            ) : (
              <div className="empty-preview" style={{ color: '#764ba2', textAlign: 'center' }}>
                <p>Click "Update Preview" to see your resume</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
