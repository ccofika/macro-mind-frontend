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
    description: '🤖 Generate complete customer service responses using your card templates. Perfect for creating professional, personalized responses that combine information from multiple cards.',
    fullDescription: 'Input: Customer query/complaint/request. Process: Semantic search through all user cards for relevant templates, analyze card connections to understand process flow, identify customer intent (refund, complaint, inquiry, etc.), merge multiple card templates into cohesive response, apply appropriate tone (professional, empathetic, solution-focused), include specific details (order numbers, policies, next steps). Output: Complete, ready-to-send customer response with sources showing used cards with spaces and confidence score.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    primary: true,
    examples: [
      'Customer wants refund for damaged item',
      'Complaint about late delivery',
      'Question about return policy',
      'Technical support request'
    ]
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

  // Load chats from MongoDB on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const response = await aiChatService.getConversations({ limit: 50 });
        
        if (response.conversations && response.conversations.length > 0) {
          // Transform MongoDB data to local format (without messages initially)
          const transformedChats = response.conversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            messages: [], // Start with empty messages, load them when chat is selected
            messagesLoaded: false, // Flag to track if messages are loaded
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            context: conv.context || {},
            stats: conv.stats || {}
          }));
          
          setChats(transformedChats);
          
          // Set current chat to first one or saved preference
          const savedCurrentChatId = localStorage.getItem('aiCurrentChatId');
          if (savedCurrentChatId && transformedChats.find(chat => chat.id === savedCurrentChatId)) {
            setCurrentChatId(savedCurrentChatId);
          } else {
            setCurrentChatId(transformedChats[0].id);
          }
        } else {
          // Create initial welcome chat if none exist
          await createNewChat('Welcome Chat');
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        // Fallback to creating a new chat
        await createNewChat('Welcome Chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Load when user changes

  // Save current chat ID to localStorage for quick access
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('aiCurrentChatId', currentChatId);
    }
  }, [currentChatId]);

  // Function to load conversation messages
  const loadConversationMessages = useCallback(async (chatId) => {
    if (!chatId || !currentUser) {
      console.log('Skipping message load - no chatId or user:', { chatId, currentUser: !!currentUser });
      return;
    }
    
    console.log('Loading messages for chat:', chatId);
    
    try {
      setIsLoading(true);
      
      // Get full conversation with messages from backend
      const fullConversation = await aiChatService.getConversation(chatId);
      console.log('Loaded conversation:', fullConversation);
      
      // Update the specific chat in local state with full messages
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? {
              ...chat,
              messages: fullConversation.messages || [],
              messagesLoaded: true,
              context: fullConversation.context || chat.context,
              stats: fullConversation.stats || chat.stats
            }
          : chat
      ));
      
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setError('Failed to load conversation messages');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Removed chats dependency to avoid cycles

  // Load messages when chat is selected
  useEffect(() => {
    if (currentChatId && chats.length > 0) {
      loadConversationMessages(currentChatId);
    }
  }, [currentChatId, loadConversationMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // Create new chat
  const createNewChat = useCallback(async (title = 'New Chat') => {
    try {
      setIsLoading(true);
      
      const response = await aiChatService.createConversation({
        title,
        context: {
          spaceId: currentSpace?.id,
          spaceName: currentSpace?.name,
          userId: currentUser?.id,
          userName: currentUser?.name
        }
      });

      // Add to local state
      const newChat = {
        id: response.id,
        title: response.title,
        messages: [],
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
        context: response.context || {},
        stats: { messageCount: 0, totalTokensUsed: 0 }
      };

      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      return newChat.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create new conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedMode, currentSpace, currentUser]);

  // Delete chat
  const deleteChat = useCallback(async (chatId) => {
    try {
      setIsLoading(true);
      
      // Delete from MongoDB
      await aiChatService.deleteConversation(chatId);
      
      // Update local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          setCurrentChatId(null);
          // Create new chat if none remain
          await createNewChat('Welcome Chat');
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, chats, createNewChat]);

  // Update chat title
  const updateChatTitle = useCallback(async (chatId, newTitle) => {
    try {
      setIsLoading(true);
      
      // Update title on backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ai-chat/conversations/${chatId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation title');
      }
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() }
          : chat
      ));
    } catch (error) {
      console.error('Error updating chat title:', error);
      setError('Failed to update conversation title');
    } finally {
      setIsLoading(false);
    }
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
    console.log('\n🔍 === MACRO SEARCH PROCESS START ===');
    console.log('📝 Query:', query);
    console.log('🎯 Mode:', mode);
    console.log('👤 Current User ID:', currentUser?.id);
    console.log('🏠 Current Space:', currentSpace?.name || 'None');
    
    try {
      setIsLoading(true);
      
      // Get user's accessible cards and spaces
      console.log('\n📊 Analyzing user access...');
      console.log('📚 Total cards in context:', cards?.length || 0);
      console.log('🏢 Total spaces in context:', spaces?.length || 0);
      
      const accessibleCards = cards?.filter(card => {
        // Check if user has access to the card's space
        const cardSpace = spaces?.find(space => space.id === card.spaceId);
        const hasAccess = cardSpace && (
          cardSpace.ownerId === currentUser?.id || 
          cardSpace.members?.some(member => member.userId === currentUser?.id)
        );
        
        if (hasAccess && cards?.length <= 10) { // Log details only for small datasets
          console.log(`  ✅ Card: "${card.title}" in space "${cardSpace.name}"`);
        }
        
        return hasAccess;
      }) || [];

      console.log(`\n🎯 Accessible cards found: ${accessibleCards.length}`);

      // If no cards available, create mock search results for testing
      if (accessibleCards.length === 0) {
        console.log('⚠️ No accessible cards found - returning mock data for testing');
        const mockResult = {
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
        console.log('🔍 === MACRO SEARCH PROCESS END (MOCK) ===\n');
        return mockResult;
      }

      // Perform semantic search through cards
      console.log('\n🔍 Performing semantic search...');
      console.log('📦 Search context:', {
        currentSpaceId: currentSpace?.id,
        recentActivity: getRecentActivity()
      });
      
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

      console.log('\n📊 Search results received:');
      console.log('🎯 Total results:', searchResults?.results?.length || 0);
      console.log('💯 Search confidence:', searchResults?.confidence || 'Unknown');
      console.log('🔍 === MACRO SEARCH PROCESS END ===\n');
      
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
    console.log('\n🤖 === AI RESPONSE GENERATION START ===');
    console.log('💬 User message:', userMessage.content);
    console.log('⚙️ Mode:', mode);
    console.log('🕐 Timestamp:', new Date().toISOString());
    
    try {
      // Step 1: Search for relevant cards
      console.log('\n📡 Step 1: Searching for relevant cards...');
      const searchResults = await searchCards(userMessage.content, mode);
      
      if (searchResults?.results?.length > 0) {
        console.log('✅ Found relevant cards:');
        searchResults.results.slice(0, 3).forEach((result, index) => {
          console.log(`  ${index + 1}. "${result.card?.title}" (relevance: ${result.relevance || result.score})`);
        });
      } else {
        console.log('❌ No relevant cards found');
      }
      
      // Step 2: Generate AI response
      console.log('\n🧠 Step 2: Generating AI response...');
      const aiContext = {
        currentSpace,
        user: currentUser,
        recentActivity: getRecentActivity(),
        conversation: currentChat?.messages || [],
        conversationId: currentChatId
      };
      
      console.log('📋 AI Context:', {
        currentSpaceName: currentSpace?.name,
        userName: currentUser?.name,
        conversationLength: currentChat?.messages?.length || 0,
        conversationId: currentChatId
      });
      
      const response = await aiChatService.generateResponse({
        message: userMessage,
        mode,
        searchResults,
        context: aiContext
      });
      
      console.log('\n✅ AI Response generated:');
      console.log('📝 Content length:', response?.content?.length || 0);
      console.log('📚 Sources count:', response?.sources?.length || 0);
      console.log('💯 Confidence:', response?.confidence || 'Unknown');
      console.log('🤖 === AI RESPONSE GENERATION END ===\n');
      
      return response;
    } catch (error) {
      console.error('❌ AI Response generation error:', error);
      console.log('🤖 === AI RESPONSE GENERATION END (ERROR) ===\n');
      throw error;
    }
  }, [searchCards, currentSpace, currentUser, getRecentActivity, currentChat, currentChatId]);

  // Send message
  const sendMessage = useCallback(async (content, images = []) => {
    console.log('\n💌 === SEND MESSAGE START ===');
    console.log('📝 Message content:', content);
    console.log('🖼️ Images count:', images.length);
    console.log('🎯 Selected mode:', selectedMode);
    console.log('💬 Current chat ID:', currentChatId);
    
    if (!content.trim() && images.length === 0) {
      console.log('❌ Empty message - aborting');
      return;
    }
    
    let chatId = currentChatId;
    if (!chatId) {
      console.log('🆕 Creating new chat...');
      chatId = await createNewChat();
      if (!chatId) {
        console.error('❌ Failed to create new chat');
        return;
      }
      console.log('✅ New chat created:', chatId);
    }

    // Clear draft and images
    setDraft('');
    setAttachedImages([]);

    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);
      
      console.log('\n🚀 Sending message to backend...');

      // Send message to backend
      const response = await aiChatService.sendMessage(
        chatId,
        content.trim(),
        selectedMode,
        {
          spaceId: currentSpace?.id,
          spaceName: currentSpace?.name,
          userId: currentUser?.id,
          userName: currentUser?.name,
          activeCards: [],
          recentActivity: []
        },
        images
      );

      // Update local state with both user and AI messages
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, response.userMessage, response.aiMessage],
              updatedAt: new Date().toISOString(),
              title: chat.messages.length === 0 ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : chat.title
            }
          : chat
      ));
      
      console.log('\n✅ Message successfully processed!');
      console.log('📊 Final result:', {
        userMessageId: response.userMessage?.id,
        aiMessageId: response.aiMessage?.id,
        aiContentLength: response.aiMessage?.content?.length,
        sourcesCount: response.aiMessage?.sources?.length,
        confidence: response.aiMessage?.confidence
      });
      console.log('💌 === SEND MESSAGE END ===\n');

    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message || 'Failed to send message');
      
      // Add error message to local state
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
  }, [currentChatId, selectedMode, createNewChat, currentSpace, currentUser]);

  // Edit message
  const editMessage = useCallback(async (messageId, newContent) => {
    if (!currentChatId) return;

    try {
      setIsLoading(true);
      
      // Update message on backend
      await aiChatService.editMessage(currentChatId, messageId, newContent);
      
      // Update local state
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
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    if (!currentChatId) return;

    try {
      setIsLoading(true);
      
      // Delete message on backend
      await aiChatService.deleteMessage(currentChatId, messageId);
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.filter(msg => msg.id !== messageId),
              updatedAt: new Date().toISOString()
            }
          : chat
      ));
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    } finally {
      setIsLoading(false);
    }
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
    loadConversationMessages,
    
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