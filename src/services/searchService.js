import api from './api';

export const searchService = {
  // Search cards with advanced filtering
  searchCards: async (query, options = {}) => {
    try {
      const {
        spaceId,
        searchMode = 'global',
        limit = 20
      } = options;
      
      const params = new URLSearchParams({
        query: query.trim(),
        searchMode,
        limit: limit.toString()
      });
      
      if (spaceId && searchMode === 'local') {
        params.append('spaceId', spaceId);
      }
      
      const response = await api.get(`/cards/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  },
  
  // Get search suggestions (for autocomplete - future feature)
  getSearchSuggestions: async (query, limit = 5) => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      const response = await api.get(`/cards/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      
      // Extract unique titles and content snippets for suggestions
      const suggestions = response.data.map(card => ({
        text: card.title,
        type: 'title',
        cardId: card.id,
        cardType: card.type
      }));
      
      // Add unique suggestions only
      const uniqueSuggestions = suggestions.filter((suggestion, index, arr) => 
        arr.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase()) === index
      );
      
      return uniqueSuggestions.slice(0, limit);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  },
  
  // Search within a specific card type
  searchByType: async (query, cardType, options = {}) => {
    try {
      const results = await searchService.searchCards(query, options);
      return results.filter(card => card.type === cardType);
    } catch (error) {
      console.error('Search by type failed:', error);
      throw error;
    }
  },
  
  // Get recent searches (stored in localStorage)
  getRecentSearches: () => {
    try {
      const recent = localStorage.getItem('recentSearches');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  },
  
  // Save search to recent searches
  saveRecentSearch: (query, resultCount = 0) => {
    try {
      if (!query || query.trim().length < 2) return;
      
      const recent = searchService.getRecentSearches();
      const searchEntry = {
        query: query.trim(),
        timestamp: Date.now(),
        resultCount
      };
      
      // Remove duplicate if exists
      const filtered = recent.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase()
      );
      
      // Add to beginning and limit to 10 recent searches
      const updated = [searchEntry, ...filtered].slice(0, 10);
      
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  },
  
  // Clear recent searches
  clearRecentSearches: () => {
    try {
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  },
  
  // Get popular search terms (mock implementation)
  getPopularSearches: async () => {
    try {
      // In a real implementation, this would come from analytics
      // For now, return some common search terms based on card types
      return [
        { term: 'category', count: 45 },
        { term: 'project', count: 32 },
        { term: 'task', count: 28 },
        { term: 'meeting', count: 24 },
        { term: 'deadline', count: 19 }
      ];
    } catch (error) {
      console.error('Failed to get popular searches:', error);
      return [];
    }
  }
}; 