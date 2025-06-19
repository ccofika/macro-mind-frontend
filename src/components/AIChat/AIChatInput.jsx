import React, { useState, useRef, useCallback } from 'react';
import { useAIChat } from '../../context/AIChatContext';
import './AIChatInput.css';

const AIChatInput = () => {
  const {
    sendMessage,
    isLoading,
    isTyping,
    draft,
    setDraft,
    attachedImages,
    setAttachedImages,
    inputRef
  } = useAIChat();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setDraft(value);
    
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle sending message
  const handleSend = useCallback(() => {
    if ((draft.trim() || attachedImages.length > 0) && !isLoading) {
      sendMessage(draft, attachedImages);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [draft, attachedImages, isLoading, sendMessage]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  // Handle file processing
  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isImage && isValidSize;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          url: e.target.result,
          name: file.name,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Remove attached image
  const removeImage = (imageId) => {
    setAttachedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`ai-chat-input ${isDragOver ? 'drag-over' : ''}`}>
      {/* Input Container */}
      <div className="input-container">
        {/* Drag and Drop Overlay */}
        {isDragOver && (
          <div className="drag-overlay">
            <div className="drag-content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Drop images here to attach</p>
            </div>
          </div>
        )}

        {/* Attached Images Row */}
        {attachedImages.length > 0 && (
          <div className="attached-images-row">
            {attachedImages.map((image) => (
              <div key={image.id} className="attached-image-thumbnail">
                <div className="thumbnail-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <button
                  className="remove-thumbnail-button"
                  onClick={() => removeImage(image.id)}
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input with Integrated Buttons */}
        <div className="text-input-wrapper">
          <textarea
            ref={textareaRef}
            className="text-input"
            placeholder="Ask me anything..."
            value={draft}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={isLoading}
            rows={1}
          />
          
          {/* Integrated Action Buttons */}
          <div className="integrated-actions">
            {/* File Upload Button */}
            <button
              className="integrated-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>

            {/* Send Button */}
            <button
              className={`integrated-button send-button ${(draft.trim() || attachedImages.length > 0) ? 'enabled' : ''}`}
              onClick={handleSend}
              disabled={isLoading || (!draft.trim() && attachedImages.length === 0)}
              title="Send message"
            >
              {isLoading || isTyping ? (
                <div className="loading-spinner">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AIChatInput; 