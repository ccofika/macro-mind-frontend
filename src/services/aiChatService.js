import { aiApi } from './api';

// Backend API integration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * AI Chat Service - Handles all AI chat functionality
 */
export class AIChatService {
  constructor() {
    this.cache = new Map();
    this.searchCache = new Map();
    this.debounceTimers = new Map();
  }

  /**
   * Search through user's cards and spaces
   */
  async searchCards({ query, cards, spaces, connections, mode, context }) {
    const cacheKey = `search_${query}_${mode}_${context.currentSpace}`;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      if (age < 5 * 60 * 1000) { // 5 minutes cache
        return cached.data;
      }
    }

    try {
      // Perform semantic search
      const results = await this.performSemanticSearch({
        query,
        cards,
        spaces,
        connections,
        mode,
        context
      });

      // Cache results
      this.searchCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Card search error:', error);
      
      // Fallback to local text search
      return this.performLocalSearch({ query, cards, spaces, connections, mode, context });
    }
  }

  /**
   * Perform semantic search via backend
   */
  async performSemanticSearch({ query, cards, spaces, connections, mode, context }) {
    try {
      // Use new backend AI Chat API
      const params = new URLSearchParams({
        query,
        mode,
        limit: '10'
      });
      
      if (context.currentSpace) {
        params.append('spaceId', context.currentSpace);
      }

      const response = await fetch(`${API_BASE_URL}/ai-chat/search?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return this.processSearchResults(data);
    } catch (error) {
      console.error('Backend search failed, falling back to local search:', error);
      
      // Fallback to local search
      return this.performLocalSearch({ query, cards, spaces, connections, mode, context });
    }
  }

  /**
   * Fallback local search when backend is unavailable
   */
  performLocalSearch({ query, cards, spaces, connections, mode, context }) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const results = [];

    // Search through cards
    cards.forEach(card => {
      let score = 0;
      const searchText = `${card.title} ${card.content}`.toLowerCase();
      
      // Title matches get higher score
      queryWords.forEach(word => {
        if (card.title.toLowerCase().includes(word)) {
          score += 3;
        }
        if (searchText.includes(word)) {
          score += 1;
        }
      });

      if (score > 0) {
        const space = spaces.find(s => s.id === card.spaceId);
        results.push({
          card: {
            id: card.id,
            title: card.title,
            content: this.truncateContent(card.content, 200),
            spaceId: card.spaceId
          },
          space: space ? { id: space.id, name: space.name } : null,
          score,
          relevance: Math.min(score / queryWords.length, 1)
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.score - a.score);

    return {
      results: results.slice(0, 10),
      totalFound: results.length,
      searchType: 'local',
      processes: this.identifyProcesses(results.slice(0, 5), connections),
      confidence: results.length > 0 ? 0.7 : 0.1
    };
  }

  /**
   * Process search results from backend
   */
  processSearchResults(data) {
    return {
      results: data.results || [],
      totalFound: data.totalFound || 0,
      searchType: data.searchType || 'semantic',
      processes: data.processes || [],
      confidence: data.confidence || 0.5,
      suggestions: data.suggestions || []
    };
  }

  /**
   * Identify processes from connected cards
   */
  identifyProcesses(searchResults, connections) {
    const processes = [];
    const cardIds = searchResults.map(r => r.card.id);

    // Find connection chains
    const chains = this.findConnectionChains(cardIds, connections);
    
    chains.forEach(chain => {
      if (chain.length > 1) {
        processes.push({
          id: `process_${chain[0]}_${chain[chain.length - 1]}`,
          name: `Process: ${chain.length} steps`,
          steps: chain,
          confidence: Math.min(0.8, chain.length * 0.2)
        });
      }
    });

    return processes;
  }

  /**
   * Find connection chains between cards
   */
  findConnectionChains(cardIds, connections, maxDepth = 5) {
    const chains = [];
    const visited = new Set();

    const buildChain = (startId, currentPath, depth) => {
      if (depth >= maxDepth || visited.has(startId)) return;
      
      visited.add(startId);
      const nextConnections = connections.filter(conn => conn.fromCardId === startId);
      
      if (nextConnections.length === 0 && currentPath.length > 1) {
        chains.push([...currentPath]);
      } else {
        nextConnections.forEach(conn => {
          if (cardIds.includes(conn.toCardId)) {
            buildChain(conn.toCardId, [...currentPath, conn.toCardId], depth + 1);
          }
        });
      }
      
      visited.delete(startId);
    };

    cardIds.forEach(cardId => {
      visited.clear();
      buildChain(cardId, [cardId], 0);
    });

    return chains;
  }

  /**
   * Generate AI response based on mode and context
   */
  async generateResponse({ message, mode, searchResults, context }) {
    try {
      // Try backend API first
      const formData = new FormData();
      formData.append('conversationId', context.conversationId || `temp_${Date.now()}`);
      formData.append('content', message.content);
      formData.append('mode', mode);
      formData.append('context', JSON.stringify({
        spaceId: context.currentSpace?.id,
        spaceName: context.currentSpace?.name,
        activeCards: context.activeCards || [],
        recentActivity: context.recentActivity || []
      }));

      // Add images if any
      if (message.images && message.images.length > 0) {
        message.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const token = localStorage.getItem('token');
      console.log('Frontend: Sending request with token:', token ? 'Token exists' : 'No token');
      console.log('Frontend: API URL:', `${API_BASE_URL}/ai-chat/send`);
      
      const response = await fetch(`${API_BASE_URL}/ai-chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      if (!response.ok) {
        console.warn(`Backend AI failed (${response.status}), using fallback`);
        throw new Error(`AI response failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process the response to match expected format
      return {
        content: data.aiMessage?.content || 'I received your message but couldn\'t generate a proper response.',
        sources: data.aiMessage?.sources || [],
        confidence: data.aiMessage?.confidence || 50,
        metadata: data.aiMessage?.metadata || {},
        userMessage: data.userMessage
      };
      
    } catch (error) {
      console.warn('Backend AI unavailable, using fallback response:', error.message);
      return this.generateFallbackResponse({ message, mode, searchResults, context });
    }
  }

  /**
   * Build appropriate prompt based on mode
   */
  buildPrompt({ message, mode, searchResults, context }) {
    const basePrompt = `You are an AI assistant integrated with a card-based knowledge management system. The user is asking: "${message.content}"`;
    
    const modePrompts = {
      macro: `
        ${basePrompt}
        
        Mode: MACRO - Generate customer service responses using card templates
        
        Instructions:
        - Use the provided card content as templates and examples
        - Create a professional, helpful response that addresses the customer's needs
        - Merge information from multiple relevant cards if applicable
        - Maintain a consistent, professional tone
        - Include specific procedures or policies from the cards when relevant
        
        Available card information:
        ${this.formatSearchResults(searchResults)}
      `,
      
      rephrase: `
        ${basePrompt}
        
        Mode: REPHRASE - Improve and rewrite text with better tone and clarity
        
        Instructions:
        - Improve the clarity, tone, and professionalism of the text
        - Maintain the original meaning while enhancing communication
        - Use examples from similar cards to guide style and tone
        - Make the text more engaging and easier to understand
        
        Reference examples:
        ${this.formatSearchResults(searchResults)}
      `,
      
      explain: `
        ${basePrompt}
        
        Mode: EXPLAIN - Analyze and explain what the customer wants/needs
        
        Instructions:
        - Break down the customer's request or issue
        - Explain the underlying needs and concerns
        - Reference relevant policies, procedures, or information from cards
        - Provide context and background information
        
        Relevant information:
        ${this.formatSearchResults(searchResults)}
      `,
      
      summarize: `
        ${basePrompt}
        
        Mode: SUMMARIZE - Create concise summary of content
        
        Instructions:
        - Create a clear, concise summary of the key points
        - Extract the most important information
        - Use bullet points or structured format when appropriate
        - Reference source cards for detailed information
        
        Content to summarize:
        ${this.formatSearchResults(searchResults)}
      `,
      
      translate: `
        ${basePrompt}
        
        Mode: TRANSLATE - Convert text between languages
        
        Instructions:
        - Translate the text accurately while maintaining context
        - Use professional, appropriate language for customer service
        - Reference card examples for tone and style guidance
        - Maintain technical terms and specific procedures accurately
        
        Reference materials:
        ${this.formatSearchResults(searchResults)}
      `,
      
      improve: `
        ${basePrompt}
        
        Mode: IMPROVE - Enhance response quality and effectiveness
        
        Instructions:
        - Enhance the response quality, clarity, and effectiveness
        - Add relevant details, procedures, or policies from cards
        - Improve structure and organization
        - Make the response more helpful and actionable
        
        Available improvements from cards:
        ${this.formatSearchResults(searchResults)}
      `,
      
      process: `
        ${basePrompt}
        
        Mode: PROCESS - Explain workflow/process based on connected cards
        
        Instructions:
        - Explain the relevant workflow or process step by step
        - Use connected cards to show the sequence of actions
        - Include decision points and alternative paths when applicable
        - Make the process clear and actionable
        
        Process information:
        ${this.formatSearchResults(searchResults)}
        ${this.formatProcesses(searchResults.processes)}
      `,
      
      search: `
        ${basePrompt}
        
        Mode: SEARCH - Provide intelligent search results and information
        
        Instructions:
        - Present the most relevant information from the search results
        - Organize information by relevance and category
        - Provide quick access to key details
        - Suggest related topics or follow-up actions
        
        Search results:
        ${this.formatSearchResults(searchResults)}
      `
    };

    return modePrompts[mode] || modePrompts.macro;
  }

  /**
   * Format search results for prompts
   */
  formatSearchResults(searchResults) {
    if (!searchResults?.results?.length) {
      return 'No relevant cards found.';
    }

    return searchResults.results.map((result, index) => {
      const space = result.space ? ` (Space: ${result.space.name})` : '';
      return `${index + 1}. Card: "${result.card.title}"${space}
Content: ${result.card.content}
Relevance: ${Math.round(result.relevance * 100)}%`;
    }).join('\n\n');
  }

  /**
   * Format processes for prompts
   */
  formatProcesses(processes) {
    if (!processes?.length) return '';
    
    return '\n\nIdentified Processes:\n' + 
      processes.map(process => 
        `- ${process.name}: ${process.steps.length} steps (${Math.round(process.confidence * 100)}% confidence)`
      ).join('\n');
  }

  /**
   * Format conversation history
   */
  formatConversationHistory(conversation) {
    if (!conversation?.length) return [];
    
    return conversation.slice(-10).map(msg => ({
      type: msg.type,
      content: this.truncateContent(msg.content, 200),
      timestamp: msg.timestamp
    }));
  }

  /**
   * Process AI response
   */
  processAIResponse(data, searchResults) {
    return {
      content: data.content || 'I apologize, but I could not generate a response.',
      sources: this.extractSources(searchResults),
      confidence: data.confidence || searchResults.confidence || 0.5,
      process: data.process || this.extractProcess(searchResults),
      suggestions: data.suggestions || []
    };
  }

  /**
   * Extract sources from search results
   */
  extractSources(searchResults) {
    if (!searchResults?.results?.length) return [];
    
    return searchResults.results.slice(0, 5).map(result => ({
      space: result.space?.name || 'Unknown Space',
      card: result.card.title,
      cardId: result.card.id,
      spaceId: result.space?.id,
      relevance: result.relevance
    }));
  }

  /**
   * Extract process information
   */
  extractProcess(searchResults) {
    if (!searchResults?.processes?.length) return null;
    
    const mainProcess = searchResults.processes[0];
    return `${mainProcess.name} (${mainProcess.steps.length} steps)`;
  }

  /**
   * Generate fallback response when AI service fails
   */
  generateFallbackResponse({ message, mode, searchResults, context }) {
    const sources = this.extractSources(searchResults);
    let content = '';

    switch (mode) {
      case 'macro':
        content = this.generateMacroFallback(searchResults);
        break;
      case 'search':
        content = this.generateSearchFallback(searchResults);
        break;
      default:
        content = `I found ${searchResults?.results?.length || 0} relevant cards related to "${message.content}". ` +
                 'The AI service is currently unavailable, but you can review the source cards below for detailed information.';
    }

    return {
      content: content + '\n\n[Note: This is a fallback response as the AI service is currently unavailable.]',
      sources,
      confidence: 0.3,
      process: null,
      suggestions: []
    };
  }

  /**
   * Generate macro fallback response
   */
  generateMacroFallback(searchResults) {
    if (!searchResults?.results?.length) {
      return 'I apologize, but I could not find relevant information to generate a macro response. Please check your card library or try rephrasing your request.';
    }

    const topResult = searchResults.results[0];
    return `Based on the card "${topResult.card.title}", here's the relevant information:\n\n${topResult.card.content}`;
  }

  /**
   * Generate search fallback response
   */
  generateSearchFallback(searchResults) {
    if (!searchResults?.results?.length) {
      return 'No relevant cards found for your search query.';
    }

    let response = `Found ${searchResults.results.length} relevant cards:\n\n`;
    
    searchResults.results.slice(0, 5).forEach((result, index) => {
      response += `${index + 1}. **${result.card.title}** (${result.space?.name || 'Unknown Space'})\n`;
      response += `   ${this.truncateContent(result.card.content, 100)}\n\n`;
    });

    return response;
  }

  /**
   * Truncate content to specified length
   */
  truncateContent(content, maxLength) {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.cache.clear();
    this.searchCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      responseCache: this.cache.size,
      searchCache: this.searchCache.size,
      totalMemory: this.cache.size + this.searchCache.size
    };
  }

  // New backend integration methods for conversation management

  /**
   * Get all conversations
   */
  async getConversations({ page = 1, limit = 20, search = '', archived = false } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        archived: archived.toString()
      });

      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Get conversations failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  }

  /**
   * Get specific conversation
   */
  async getConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations/${conversationId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Get conversation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }

  /**
   * Create new conversation
   */
  async createConversation({ title, context = {} }) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, context })
      });

      if (!response.ok) {
        throw new Error(`Create conversation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Delete conversation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }

  /**
   * Send message to conversation
   */
  async sendMessage(conversationId, content, mode = 'macro', context = {}, images = []) {
    try {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('content', content);
      formData.append('mode', mode);
      formData.append('context', JSON.stringify(context));
      
      // Add images if any
      images.forEach((image, index) => {
        formData.append('images', image, `image_${index}`);
      });

      const response = await fetch(`${API_BASE_URL}/ai-chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Send message failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Edit message in conversation
   */
  async editMessage(conversationId, messageId, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Edit message failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }

  /**
   * Delete message from conversation
   */
  async deleteMessage(conversationId, messageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Delete message failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  /**
   * Export conversation
   */
  async exportConversation(conversationId, format = 'json') {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/conversations/${conversationId}/export?format=${format}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Export conversation failed: ${response.statusText}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Export conversation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiChatService = new AIChatService(); 