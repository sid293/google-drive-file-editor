import React, { useState, useEffect } from 'react';
import driveService from '../services/driveService';
import './FileExplorer.css';

interface FileExplorerProps {
  onFileSelect: (fileId: string) => void;
  onCreateFile: () => void;
}

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, onCreateFile }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load files when component mounts
  useEffect(() => {
    loadFiles();
  }, []);
  
  // Load files from Google Drive
  const loadFiles = async () => {
    // if (!driveService.isAuthenticated()) {
    //   setError('Not authenticated. Please sign in first.');
    //   return;
    // }
    
    setLoading(true);
    setError(null);
    
    try {
      const filesList = await driveService.listFiles();
      setFiles(filesList);
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection
  const handleFileClick = (fileId: string) => {
    onFileSelect(fileId);
  };
  
  // Handle file creation
  const handleCreateFile = () => {
    onCreateFile();
  };
  
  // Render file icon based on mime type
  const renderFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) {
      return '📁';
    } else if (mimeType.includes('text')) {
      return '📄';
    } else if (mimeType.includes('image')) {
      return '🖼️';
    } else if (mimeType.includes('audio')) {
      return '🎵';
    } else if (mimeType.includes('video')) {
      return '🎬';
    } else {
      return '📎';
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h2>My Files</h2>
        <button 
          className="refresh-button" 
          onClick={loadFiles} 
          disabled={loading}
        >
          🔄 Refresh
        </button>
        <button 
          className="create-file-button" 
          onClick={handleCreateFile}
        >
          ➕ New File
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading files...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <p>No files found. Create a new file to get started.</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="file-item" 
              onClick={() => handleFileClick(file.id)}
            >
              <span className="file-icon">{renderFileIcon(file.mimeType)}</span>
              <span className="file-name">{file.name}</span>
              <span className="file-modified">{formatDate(file.modifiedTime)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;