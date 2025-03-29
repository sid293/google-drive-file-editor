import React, { useState, useEffect } from 'react';
import './TextEditor.css';

const TextEditor = ({ fileName, initialContent = '', onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Load content when fileName changes
  useEffect(() => {
    setContent(initialContent);
    setLastSaved(new Date());
  }, [fileName, initialContent]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await onSave(content);
      
      setLastSaved(new Date());
    } catch (err) {
      setError('Failed to save file. Please try again.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewFile = () => {
    // This will be implemented by the parent component
    // We'll just trigger an event that the parent can listen to
    const event = new CustomEvent('new-file-requested');
    window.dispatchEvent(event);
  };

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="text-editor">
      <div className="editor-header">
        <h2>{fileName || 'Untitled'}</h2>
        <div className="editor-actions">
          <button 
            className="new-file-btn" 
            onClick={handleNewFile}
          >
            New File
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="editor-error">
          <span>{error}</span>
          <button onClick={dismissError}>Dismiss</button>
        </div>
      )}
      
      <textarea
        className="editor-textarea"
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing..."
      />
      
      <div className="editor-status">
        {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
      </div>
    </div>
  );
};

export default TextEditor;
