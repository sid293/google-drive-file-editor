import { useState, useEffect } from 'react'
import './App.css'
import FileExplorer from './components/FileExplorer'
import driveService from './services/driveService'

interface User {
  id: string
  name: string
  email: string
}

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedFileId, setSelectedFileId] = useState('')

  useEffect(() => {
    // Check authentication status when component mounts
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/status', {
          credentials: 'include'
        })
        const data = await response.json()
        // console.log('ser is authenticated: ', data.isAuthenticated)
        setIsSignedIn(data.isAuthenticated)
        if (data.isAuthenticated) {
          console.log('User is authenticated')
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
      }
    }
    checkAuth()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      console.log("handleGoogleSignIn")
      let URL = "http://localhost:5000"+"/auth/google/url"
      let oauthUrlResponse = await fetch(URL);
      let oauthUrl = await oauthUrlResponse.json()
      console.log("oauthUrl: ",oauthUrl.url)
      window.location.href = oauthUrl.url
      // window.location.href = 'http://localhost:3000/auth/google'
    } catch (error) {
      console.error('Google Sign-in failed:', error)
    }
  }

  const handleFileSelect = async (fileId: string) => {
    try {
      const response = await driveService.getFileContent(fileId)
      setFileContent(response.content)
      setFileName(response.name)
      setSelectedFileId(fileId)
    } catch (error) {
      console.error('Error loading file:', error)
      alert('Failed to load file')
    }
  }

  const handleCreateFile = () => {
    setFileContent('')
    setFileName('')
    setSelectedFileId('')
  }

  const handleSaveFile = async () => {
    if (!fileName || !fileContent) {
      alert('Please provide both file name and content')
      return
    }

    try {
      await driveService.createTextFile(fileName, fileContent)
      alert('File saved successfully!')
    } catch (error) {
      console.error('Error saving file:', error)
      alert('Failed to save file')
    }
  }

  return (
    <div className="app-container">
      {!isSignedIn ? (
        <div className="google-signin-container">
          <h1>Welcome to Google Drive Editor</h1>
          <button className="google-signin-button" onClick={handleGoogleSignIn}>
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="editor-container">
          <div className="user-info">
            {user && <p>Welcome, {user.name}!</p>}
          </div>
          <FileExplorer
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
          />
          <div className="file-editor">
            <input
              type="text"
              placeholder="Enter file name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="file-name-input"
            />
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Enter your content here..."
              className="file-content-input"
            />
            <button onClick={handleSaveFile} className="save-button">
              Save to Google Drive
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App