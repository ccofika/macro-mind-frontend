import React, { useState, useRef } from 'react';
import { useAIChat } from '../../context/AIChatContext';
import './AIChatSidebar.css';

const AIChatSidebar = () => {
  const {
    chats,
    currentChatId,
    createNewChat,
    deleteChat,
    updateChatTitle,
    setCurrentChatId,
    sidebarCollapsed,
    setSidebarCollapsed,
    searchQuery,
    setSearchQuery,
    exportChat
  } = useAIChat();

  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef(null);

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle creating new chat
  const handleNewChat = () => {
    createNewChat('New Conversation');
  };

  // Handle chat selection
  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    setEditingChatId(null);
  };

  // Handle title editing
  const handleEditTitle = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  // Save title edit
  const handleSaveTitle = (chatId) => {
    if (editTitle.trim() && editTitle !== chats.find(c => c.id === chatId)?.title) {
      updateChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  // Cancel title edit
  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  // Handle key press in edit input
  const handleEditKeyPress = (e, chatId) => {
    if (e.key === 'Enter') {
      handleSaveTitle(chatId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle chat deletion
  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteChat(chatId);
    }
  };

  // Handle chat export
  const handleExportChat = (chatId, format, e) => {
    e.stopPropagation();
    exportChat(chatId, format);
  };

  // Format chat preview
  const getChatPreview = (chat) => {
    if (chat.messages.length === 0) return 'New conversation';
    const lastMessage = chat.messages[chat.messages.length - 1];
    const preview = lastMessage.type === 'user' ? 'You: ' : 'AI: ';
    return preview + (lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''));
  };

  // Format chat timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`ai-chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-main">
          <button 
            className="collapse-button glass-button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <polyline points="9 18 15 12 9 6"></polyline>
              ) : (
                <polyline points="15 18 9 12 15 6"></polyline>
              )}
            </svg>
          </button>
          
          {!sidebarCollapsed && (
            <>
              <h3 className="sidebar-title">Conversations</h3>
              <button 
                className="new-chat-button glass-button"
                onClick={handleNewChat}
                title="New conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <polyline points="21 21 16.5 16.5"></polyline>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search-button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="chat-list">
        {sidebarCollapsed ? (
          // Collapsed view - show only chat indicators
          filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item-collapsed ${chat.id === currentChatId ? 'active' : ''}`}
              onClick={() => handleSelectChat(chat.id)}
              title={chat.title}
            >
              <div className="chat-indicator">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {chat.messages.length > 0 && (
                  <div className="message-count">{chat.messages.length}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          // Full view - show complete chat items
          filteredChats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <path d="M8 10h.01"></path>
                  <path d="M12 10h.01"></path>
                  <path d="M16 10h.01"></path>
                </svg>
              </div>
              <p>No conversations found</p>
              <button className="glass-button" onClick={handleNewChat}>
                Start a new conversation
              </button>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="chat-item-main">
                  <div className="chat-header">
                    {editingChatId === chat.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        className="chat-title-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(chat.id)}
                        onKeyDown={(e) => handleEditKeyPress(e, chat.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h4 className="chat-title">{chat.title}</h4>
                    )}
                    <div className="chat-actions">
                      <button
                        className="chat-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTitle(chat.id, chat.title);
                        }}
                        title="Rename conversation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      
                      <div className="chat-menu">
                        <button
                          className="chat-action-button menu-trigger"
                          title="More options"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </button>
                        
                        <div className="chat-menu-dropdown">
                          <button
                            className="menu-item"
                            onClick={(e) => handleExportChat(chat.id, 'json', e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export as JSON
                          </button>
                          
                          <button
                            className="menu-item"
                            onClick={(e) => handleExportChat(chat.id, 'txt', e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Export as Text
                          </button>
                          
                          <div className="menu-divider"></div>
                          
                          <button
                            className="menu-item delete"
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="chat-preview">
                    {getChatPreview(chat)}
                  </div>
                  
                  <div className="chat-meta">
                    <span className="chat-timestamp">
                      {formatTimestamp(chat.updatedAt)}
                    </span>
                    {chat.messages.length > 0 && (
                      <span className="message-count-badge">
                        {chat.messages.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default AIChatSidebar; 