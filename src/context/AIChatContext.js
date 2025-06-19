import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useCards } from './CardContext';
import AuthContext from './AuthContext';
import { useCollaboration } from './CollaborationContext';
import { AIChatService } from '../services/aiChatService';

// Create service instance
const aiChatService = new AIChatService();

const AIChatContext = createContext();

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};

// AI Chat Modes with descriptions
export const AI_MODES = {
  MACRO: {
    id: 'macro',
    name: 'Macro',
    description: 'Generate customer service responses using card templates',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    primary: true
  },
  REPHRASE: {
    id: 'rephrase',
    name: 'Rephrase',
    description: 'Improve and rewrite text with better tone and clarity',
    icon: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'
  },
  EXPLAIN: {
    id: 'explain',
    name: 'Explain',
    description: 'Analyze customer input and explain what they want/need',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
  },
  SUMMARIZE: {
    id: 'summarize',
    name: 'Summarize',
    description: 'Create concise summary of long conversations or content',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  TRANSLATE: {
    id: 'translate',
    name: 'Translate',
    description: 'Convert text between different languages',
    icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'
  },
  IMPROVE: {
    id: 'improve',
    name: 'Improve',
    description: 'Enhance response quality and effectiveness',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  PROCESS: {
    id: 'process',
    name: 'Process',
    description: 'Explain workflow/process based on connected cards',
    icon: 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5-4v4m0 0v4m0-4h4m-4 0H9'
  },
  SEARCH: {
    id: 'search',
    name: 'Search',
    description: 'Intelligent search through your cards and spaces',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
  }
};

export const AIChatProvider = ({ children }) => {
  // Core state
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [selectedMode, setSelectedMode] = useState('macro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Message composition
  const [draft, setDraft] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // References for scroll management
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Contexts
  const { cards, spaces, connections } = useCards();
  const { currentUser } = useContext(AuthContext);
  const { currentSpace } = useCollaboration();

  // Get current chat
  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Initialize default chat
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat('Welcome Chat');
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // Create new chat
  const createNewChat = useCallback((title = 'New Chat') => {
    const newChat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: selectedMode,
      context: {
        spaceId: currentSpace?.id,
        spaceName: currentSpace?.name,
        userId: currentUser?.id,
        userName: currentUser?.name
      }
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, [selectedMode, currentSpace, currentUser]);

  // Delete chat
  const deleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      if (remainingChats.length === 0) {
        createNewChat();
      }
    }
  }, [currentChatId, chats, createNewChat]);

  // Update chat title
  const updateChatTitle = useCallback((chatId, newTitle) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() }
        : chat
    ));
  }, []);

  // Get recent user activity for context
  const getRecentActivity = useCallback(() => {
    // Get recent cards, connections, and actions
    const recentCards = cards?.filter(card => card.updatedAt || card.createdAt)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 10) || [];

    return {
      recentCards: recentCards.map(card => ({
        id: card.id,
        title: card.title,
        content: card.content?.substring(0, 200),
        spaceId: card.spaceId,
        updatedAt: card.updatedAt || card.createdAt
      })),
      currentSpace: currentSpace?.id,
      activeCardCount: cards?.length || 0,
      connectionCount: connections?.length || 0
    };
  }, [cards, connections, currentSpace]);

  // Search through chat and card data
  const searchCards = useCallback(async (query, mode = 'search') => {
    try {
      setIsLoading(true);
      
      // Get user's accessible cards and spaces
      const accessibleCards = cards?.filter(card => {
        // Check if user has access to the card's space
        const cardSpace = spaces?.find(space => space.id === card.spaceId);
        return cardSpace && (
          cardSpace.ownerId === currentUser?.id || 
          cardSpace.members?.some(member => member.userId === currentUser?.id)
        );
      }) || [];

      console.log('Accessible cards:', accessibleCards.length);

      // If no cards available, create mock search results for testing
      if (accessibleCards.length === 0) {
        return {
          results: [{
            card: {
              id: 'mock_1',
              title: 'Sample Response Card',
              content: 'This is a sample response for testing the AI chat functionality.',
              spaceId: 'mock_space'
            },
            space: {
              id: 'mock_space',
              name: 'Test Space'
            },
            score: 1,
            relevance: 0.8
          }],
          totalFound: 1,
          searchType: 'mock',
          processes: [],
          confidence: 0.7
        };
      }

      // Perform semantic search through cards
      const searchResults = await aiChatService.searchCards({
        query,
        cards: accessibleCards,
        spaces: spaces || [],
        connections: connections || [],
        mode,
        context: {
          currentSpace: currentSpace?.id,
          recentActivity: getRecentActivity()
        }
      });

      return searchResults;
    } catch (err) {
      console.error('Search error:', err);
      // Return fallback results on error
      return {
        results: [],
        totalFound: 0,
        searchType: 'error',
        processes: [],
        confidence: 0.1
      };
    } finally {
      setIsLoading(false);
    }
  }, [cards, spaces, connections, currentUser, currentSpace, getRecentActivity]);

  // Generate AI response based on mode
  const generateAIResponse = useCallback(async (userMessage, mode) => {
    try {
      console.log('Generating AI response for:', userMessage.content, 'Mode:', mode);
      
      const searchResults = await searchCards(userMessage.content, mode);
      console.log('Search results:', searchResults);
      
      const response = await aiChatService.generateResponse({
        message: userMessage,
        mode,
        searchResults,
        context: {
          currentSpace,
          user: currentUser,
          recentActivity: getRecentActivity(),
          conversation: currentChat?.messages || [],
          conversationId: currentChatId
        }
      });
      
      console.log('AI response:', response);
      return response;
    } catch (error) {
      console.error('Generate AI response error:', error);
      throw error;
    }
  }, [searchCards, currentSpace, currentUser, getRecentActivity, currentChat, currentChatId]);

  // Send message
  const sendMessage = useCallback(async (content, images = []) => {
    if (!content.trim() && images.length === 0) return;
    
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createNewChat();
      if (!chatId) {
        console.error('Failed to create new chat');
        return;
      }
    }

    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: content.trim(),
      images,
      timestamp: new Date().toISOString(),
      mode: selectedMode
    };

    // Add user message to chat
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            updatedAt: new Date().toISOString(),
            title: chat.messages.length === 0 ? content.substring(0, 30) + '...' : chat.title
          }
        : chat
    ));

    // Clear draft and images
    setDraft('');
    setAttachedImages([]);

    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);

      // Get AI response based on selected mode
      const response = await generateAIResponse(userMessage, selectedMode);
      
      // Add AI response to chat
      const aiMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: response.content,
        sources: response.sources,
        confidence: response.confidence,
        process: response.process,
        timestamp: new Date().toISOString(),
        mode: selectedMode
      };

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, aiMessage],
              updatedAt: new Date().toISOString()
            }
          : chat
      ));

    } catch (err) {
      console.error('AI response error:', err);
      setError(err.message || 'Failed to get AI response');
      
      // Add error message
      const errorMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        error: err.message
      };

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, errorMessage],
              updatedAt: new Date().toISOString()
            }
          : chat
      ));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [currentChatId, selectedMode, createNewChat, generateAIResponse]);

  // Edit message
  const editMessage = useCallback((messageId, newContent) => {
    if (!currentChatId) return;

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: newContent, edited: true, editedAt: new Date().toISOString() }
                : msg
            ),
            updatedAt: new Date().toISOString()
          }
        : chat
    ));
  }, [currentChatId]);

  // Delete message
  const deleteMessage = useCallback((messageId) => {
    if (!currentChatId) return;

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? {
            ...chat,
            messages: chat.messages.filter(msg => msg.id !== messageId),
            updatedAt: new Date().toISOString()
          }
        : chat
    ));
  }, [currentChatId]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Open/Close chat
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Export chat
  const exportChat = useCallback((chatId, format = 'json') => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const exportData = {
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        sources: msg.sources,
        confidence: msg.confidence
      }))
    };

    const dataStr = format === 'json' 
      ? JSON.stringify(exportData, null, 2)
      : formatChatAsText(exportData);
    
    const filename = `chat_${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'txt'}`;
    
    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, [chats]);

  // Format chat as text
  const formatChatAsText = (chat) => {
    let text = `Chat: ${chat.title}\n`;
    text += `Created: ${new Date(chat.createdAt).toLocaleString()}\n`;
    text += `Updated: ${new Date(chat.updatedAt).toLocaleString()}\n\n`;
    
    chat.messages.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const speaker = msg.type === 'user' ? 'You' : 'AI Assistant';
      text += `[${timestamp}] ${speaker}:\n${msg.content}\n\n`;
      
      if (msg.sources && msg.sources.length > 0) {
        text += `Sources: ${msg.sources.map(s => `${s.space} - ${s.card}`).join(', ')}\n`;
        if (msg.confidence) text += `Confidence: ${msg.confidence}%\n`;
        text += '\n';
      }
    });
    
    return text;
  };

  // Context value
  const value = {
    // State
    chats,
    currentChat,
    currentChatId,
    selectedMode,
    isLoading,
    error,
    isTyping,
    
    // UI State
    isOpen,
    sidebarCollapsed,
    searchQuery,
    
    // Draft state
    draft,
    attachedImages,
    isRecording,
    
    // References
    messagesEndRef,
    inputRef,
    
    // Actions
    createNewChat,
    deleteChat,
    updateChatTitle,
    setCurrentChatId,
    setSelectedMode,
    sendMessage,
    editMessage,
    deleteMessage,
    searchCards,
    exportChat,
    
    // UI Actions
    openChat,
    closeChat,
    setSidebarCollapsed,
    setSearchQuery,
    setDraft,
    setAttachedImages,
    setIsRecording,
    scrollToBottom,
    
    // Utilities
    AI_MODES,
    clearError: () => setError(null)
  };

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
};

export default AIChatContext; 