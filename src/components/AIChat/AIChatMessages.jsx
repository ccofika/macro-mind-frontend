import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../context/AIChatContext';
import './AIChatMessages.css';

const AIChatMessages = () => {
  const { 
    currentChat, 
    isLoading, 
    isTyping, 
    editMessage, 
    deleteMessage, 
    messagesEndRef 
  } = useAIChat();

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef(null);

  // Auto-focus edit input
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingMessageId]);

  // Handle message editing
  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = (messageId) => {
    if (editContent.trim() !== '') {
      editMessage(messageId, editContent.trim());
    }
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleEditKeyPress = (e, messageId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message content with formatting
  const renderMessageContent = (content) => {
    // Simple markdown-like formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Render sources
  const renderSources = (sources) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="message-sources">
        <div className="sources-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>Card Templates Used:</span>
          <span className="sources-count">({sources.length} cards)</span>
        </div>
        <div className="sources-list">
          {sources.map((source, index) => (
            <div key={index} className="source-item">
              <div className="source-main">
                <span className="source-card-title">"{source.cardTitle || source.card}"</span>
                <span className="source-space-name">from "{source.spaceName || source.space}"</span>
              </div>
              <div className="source-details">
                {(source.relevanceScore || source.relevance) && (
                  <span className="source-relevance">
                    {Math.round((source.relevanceScore || source.relevance * 100))}% match
                  </span>
                )}
                {source.excerpt && (
                  <div className="source-excerpt">
                    <span className="excerpt-label">Content:</span>
                    <span className="excerpt-text">{source.excerpt}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentChat) {
    return (
      <div className="messages-container">
        <div className="empty-chat">
          <div className="empty-chat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 10h.01"></path>
              <path d="M12 10h.01"></path>
              <path d="M16 10h.01"></path>
            </svg>
          </div>
          <h3>Welcome to AI Chat Assistant</h3>
          <p>Start a conversation to get AI-powered assistance with your cards and workflows.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-list">
        {currentChat.messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h4>Ready to assist!</h4>
            <p>Ask me anything about your cards, spaces, or workflows. I can help you:</p>
            <ul>
              <li>Generate customer service responses (Macro mode)</li>
              <li>Improve and rephrase text</li>
              <li>Explain complex processes</li>
              <li>Search through your knowledge base</li>
              <li>And much more!</li>
            </ul>
          </div>
        ) : (
          currentChat.messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-header">
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  ) : message.type === 'ai' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="9"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                  )}
                </div>
                
                <div className="message-meta">
                  <span className="message-sender">
                    {message.type === 'user' ? 'You' : message.type === 'ai' ? 'AI Assistant' : 'System'}
                  </span>
                  <span className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {message.mode && (
                    <span className="message-mode">{message.mode}</span>
                  )}
                  {message.edited && (
                    <span className="message-edited">edited</span>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="message-actions">
                    <button
                      className="message-action-button"
                      onClick={() => handleEditMessage(message.id, message.content)}
                      title="Edit message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button
                      className="message-action-button delete"
                      onClick={() => deleteMessage(message.id)}
                      title="Delete message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="message-body">
                {editingMessageId === message.id ? (
                  <div className="message-edit-form">
                    <textarea
                      ref={editInputRef}
                      className="message-edit-input"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => handleEditKeyPress(e, message.id)}
                      placeholder="Edit your message..."
                      rows="3"
                    />
                    <div className="message-edit-actions">
                      <button
                        className="edit-save-button"
                        onClick={() => handleSaveEdit(message.id)}
                      >
                        Save
                      </button>
                      <button
                        className="edit-cancel-button"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="message-content">
                      {renderMessageContent(message.content)}
                    </div>
                    
                    {message.images && message.images.length > 0 && (
                      <div className="message-images">
                        {message.images.map((image, index) => (
                          <img key={index} src={image} alt={`Attachment ${index + 1}`} />
                        ))}
                      </div>
                    )}
                    
                    {message.sources && renderSources(message.sources)}
                    
                    {message.confidence && (
                      <div className="message-confidence">
                        <div className="confidence-header">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4"></path>
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                          <span>Response Quality:</span>
                        </div>
                        <div className="confidence-details">
                          <div className="confidence-score">
                            <span className="confidence-value">{Math.round(message.confidence)}%</span>
                            <span className="confidence-label">Confidence</span>
                          </div>
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill" 
                              style={{ width: `${Math.round(message.confidence)}%` }}
                            ></div>
                          </div>
                          {message.metadata && message.metadata.mode === 'macro' && (
                            <div className="macro-stats">
                              <span>Customer Service Response</span>
                              {message.sources && (
                                <span>• {message.sources.length} template{message.sources.length !== 1 ? 's' : ''} used</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="message ai typing">
            <div className="message-header">
              <div className="message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <div className="message-meta">
                <span className="message-sender">AI Assistant</span>
                <span className="message-timestamp">typing...</span>
              </div>
            </div>
            <div className="message-body">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AIChatMessages; 