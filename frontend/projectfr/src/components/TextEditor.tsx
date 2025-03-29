import React, { useState, useEffect } from 'react';
import driveService from '../services/driveService';

interface TextEditorProps {
  fileId: string | null;
  onSave: (content: string) => Promise<boolean>;
  onClose: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ fileId, onSave, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Load file content when fileId changes
  useEffect(() => {
    if (!fileId) {
      setContent('');
      setOriginalContent('');
      setFileName('');
      setIsDirty(false);
      return;
    }
    
    const loadFileContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await driveService.getFileContent(fileId);
        
        if (response.success && response.data) {
          setContent(response.data.content || '');
          setOriginalContent(response.data.content || '');
          setFileName(response.data.name || 'Untitled');
          setIsDirty(false);
        } else {
          setError(response.error || 'Failed to load file content');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading file content');
      } finally {
        setLoading(false);
      }
    };
    
    loadFileContent();
    
    // Set up auto-save with local storage
    const savedContent = localStorage.getItem(`draft-${fileId}`);
    if (savedContent) {
      setContent(savedContent);
      setIsDirty(true);
    }
    
    // Clean up function
    return () => {
      // Save draft to local storage if content is dirty
      if (isDirty && content !== originalContent) {
        localStorage.setItem(`draft-${fileId}`, content);
      }
    };
  }, [fileId]);
  
  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsDirty(newContent !== originalContent);
    
    // Auto-save to local storage
    if (fileId) {
      localStorage.setItem(`draft-${fileId}`, newContent);
    }
  };
  
  // Handle save
  const handleSave = async () => {
    if (!fileId || !isDirty) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const success = await onSave(content);
      
      if (success) {
        setOriginalContent(content);
        setIsDirty(false);
        // Clear the draft from local storage
        localStorage.removeItem(`draft-${fileId}`);
      } else {
        setError('Failed to save file');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving file');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle discard changes
  const handleDiscard = () => {
    if (fileId && isDirty) {
      const confirmDiscard = window.confirm('Discard unsaved changes?');
      if (confirmDiscard) {
        setContent(originalContent);
        setIsDirty(false);
        localStorage.removeItem(`draft-${fileId}`);
      }
    } else {
      onClose();
    }
  };
  
  // Prompt user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
  
  return (
    <div className="text-editor">
      {loading ? (
        <div className="loading">Loading file content...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="editor-header">
            <h2>{fileName}</h2>
            <div className="editor-status">
              {isDirty && <span className="unsaved-indicator">Unsaved changes</span>}
              {isSaving && <span className="saving-indicator">Saving...</span>}
            </div>
          </div>
          
          <textarea
            className="editor-textarea"
            value={content}
            onChange={handleContentChange}
            disabled={loading || isSaving}
            placeholder="Enter your text here..."
            rows={20}
          />
          
          <div className="editor-actions">
            <button 
              onClick={handleSave} 
              disabled={!isDirty || isSaving || loading}
              className="save-button"
            >
              Save
            </button>
            <button 
              onClick={handleDiscard}
              className="discard-button"
            >
              {isDirty ? 'Discard Changes' : 'Close'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TextEditor;