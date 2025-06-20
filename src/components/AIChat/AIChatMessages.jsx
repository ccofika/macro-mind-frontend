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
    e.stopPropagation(); // Prevent keyboard shortcuts while editing
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
  const renderMessageContent = (content, messageMode) => {
    // Check if this is a process mode response with structured format
    if (messageMode === 'process' && content.includes('• **SITUATION**:')) {
      return renderProcessModeContent(content);
    }

    // Simple markdown-like formatting for regular messages
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Render process mode content with special formatting
  const renderProcessModeContent = (content) => {
    const sections = content.split('• **').filter(section => section.trim());
    
    return (
      <div className="process-mode-content">
        {sections.map((section, index) => {
          if (!section.includes('**:')) return null;
          
          const [titlePart, ...contentParts] = section.split('**:');
          const title = titlePart.trim();
          const sectionContent = contentParts.join('**:').trim();
          
          // Parse bullet points
          const bullets = sectionContent
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim());
          
          const nonBulletContent = sectionContent
            .split('\n')
            .filter(line => !line.trim().startsWith('-') && line.trim())
            .join(' ').trim();
          
          return (
            <div key={index} className={`process-section process-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="process-section-header">
                <div className="process-section-icon">
                  {getSectionIcon(title)}
                </div>
                <h4 className="process-section-title">{title}</h4>
              </div>
              <div className="process-section-content">
                {nonBulletContent && (
                  <p className="process-description">{nonBulletContent}</p>
                )}
                {bullets.length > 0 && (
                  <ul className="process-bullets">
                    {bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="process-bullet">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Get appropriate icon for each process section
  const getSectionIcon = (sectionTitle) => {
    switch (sectionTitle.toLowerCase()) {
      case 'situation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        );
      case 'key facts':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5"></path>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"></path>
          </svg>
        );
      case 'actions':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="m21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.11 0 2.18.2 3.17.57"></path>
          </svg>
        );
      case 'decision points':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m5 0h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2m-5-4v4m0 0v4m0-4h4m-4 0H9"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8"></path>
            <path d="M8 12h8"></path>
          </svg>
        );
    }
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
        <div className="sources-tabs">
          {sources.map((source, index) => (
            <div key={index} className={`source-tab ${source.isConnectedCard ? 'connected-card' : ''} ${source.cardType === 'category' ? 'category-card' : ''}`}>
              <span className="source-tab-title">"{source.cardTitle || source.card}"</span>
              {source.cardType === 'category' && (
                <span className="source-tab-badge">Category</span>
              )}
              {source.isConnectedCard && (
                <span className="source-tab-badge connected">Connected</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render process flow information
  const renderProcessFlow = (processMetadata, processFlow) => {
    if (!processMetadata && !processFlow) return null;

    return (
      <div className="message-process-flow">
        <div className="process-flow-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5-4v4m0 0v4m0-4h4m-4 0H9"></path>
          </svg>
          <span>Process Analysis Results:</span>
        </div>
        
        {processMetadata && (
          <div className="process-metadata">
            <div className="process-stats">
              <div className="process-stat">
                <span className="stat-value">{processMetadata.totalBranches}</span>
                <span className="stat-label">Process Branches</span>
              </div>
              <div className="process-stat">
                <span className="stat-value">{processMetadata.totalSteps}</span>
                <span className="stat-label">Total Steps</span>
              </div>
              <div className="process-stat">
                <span className="stat-value">{processMetadata.usedCards?.length || 0}</span>
                <span className="stat-label">Cards Analyzed</span>
              </div>
              <div className="process-stat">
                <span className={`stat-value complexity-${processMetadata.complexity}`}>
                  {processMetadata.complexity?.toUpperCase()}
                </span>
                <span className="stat-label">Complexity</span>
              </div>
            </div>
            
            {processMetadata.alternativePaths > 0 && (
              <div className="process-alternatives">
                <span className="alternatives-icon">🔀</span>
                <span>{processMetadata.alternativePaths} alternative path{processMetadata.alternativePaths !== 1 ? 's' : ''} identified</span>
              </div>
            )}
            
            {processMetadata.usedCards?.length > 0 && (
              <div className="process-used-cards">
                <div className="used-cards-header">Cards Used in Analysis:</div>
                <div className="used-cards-list">
                  {processMetadata.usedCards.slice(0, 10).map((cardId, index) => (
                    <span key={cardId} className="used-card-id">
                      Card-{index + 1}
                    </span>
                  ))}
                  {processMetadata.usedCards.length > 10 && (
                    <span className="used-cards-more">
                      +{processMetadata.usedCards.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {processFlow?.branches?.length > 0 && (
          <div className="process-branches">
            <div className="branches-header">Process Flow Branches:</div>
            {processFlow.branches.slice(0, 3).map((branch, index) => (
              <div key={index} className="process-branch">
                <div className="branch-header">
                  <span className="branch-icon">📋</span>
                  <span className="branch-title">
                    {branch.rootCard?.title || `Branch ${index + 1}`}
                  </span>
                  <span className="branch-type">
                    ({branch.rootCard?.type || 'process'})
                  </span>
                </div>
                {branch.steps?.length > 0 && (
                  <div className="branch-steps-summary">
                    {branch.steps.length} step{branch.steps.length !== 1 ? 's' : ''} in workflow
                    {branch.alternatives?.length > 0 && (
                      <span className="branch-alternatives">
                        • {branch.alternatives.length} alternative{branch.alternatives.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {processFlow.branches.length > 3 && (
              <div className="process-branches-more">
                +{processFlow.branches.length - 3} more branches discovered
              </div>
            )}
          </div>
        )}
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
                      {renderMessageContent(message.content, message.mode)}
                    </div>
                    
                    {message.images && message.images.length > 0 && (
                      <div className="message-images">
                        {message.images.map((image, index) => (
                          <img key={index} src={image} alt={`Attachment ${index + 1}`} />
                        ))}
                      </div>
                    )}
                    
                    {message.sources && renderSources(message.sources)}
                    
                    {(message.processMetadata || message.processFlow) && 
                      renderProcessFlow(message.processMetadata, message.processFlow)}
                    
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