import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Hash, Users, Loader2, LogIn } from 'lucide-react';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Conversation, Fade } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string | Conversation | Fade) => void;
}

interface SearchResult {
  type: 'conversation' | 'fade';
  item: Conversation | Fade;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onSearch }) => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user is a participant
  const isParticipant = (item: Conversation | Fade): boolean => {
    if (!state.user) return false;
    return item.participants?.some(p => p.userId === state.user?.id) || false;
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Reset search state when overlay opens
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Search both conversations and fades
      const [conversations, fades] = await Promise.all([
        apiService.getPublicConversations().catch(() => []),
        apiService.getPublicFades().catch(() => []),
      ]);

      const queryLower = query.toLowerCase();
      const results: SearchResult[] = [];

      // Filter conversations
      (conversations as Conversation[]).forEach((conv) => {
        const matchesName = conv.name.toLowerCase().includes(queryLower);
        const matchesDescription = conv.description?.toLowerCase().includes(queryLower);
        const matchesTopics = conv.topics.some(topic => topic.toLowerCase().includes(queryLower));
        
        if (matchesName || matchesDescription || matchesTopics) {
          results.push({ type: 'conversation', item: conv });
        }
      });

      // Filter fades
      (fades as Fade[]).forEach((fade) => {
        const matchesName = fade.name.toLowerCase().includes(queryLower);
        const matchesDescription = fade.description?.toLowerCase().includes(queryLower);
        const matchesTopics = fade.topics.some(topic => topic.toLowerCase().includes(queryLower));
        
        if (matchesName || matchesDescription || matchesTopics) {
          results.push({ type: 'fade', item: fade });
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (query: string, shouldClose: boolean = false) => {
    if (!query.trim()) return;
    
    // Add to search history (avoid duplicates)
    const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    
    // Perform the search
    await performSearch(query);
    
    // Only close if explicitly requested (e.g., clicking on history item)
    if (shouldClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Don't close modal on form submit - let user see results or continue searching
    if (searchQuery.trim()) {
      await handleSearch(searchQuery, false);
    }
  };

  // Debounced search as user types
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  const removeFromHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== query);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const handleJoin = async (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    setJoiningId(result.item.id);
    
    try {
      if (result.type === 'conversation') {
        await apiService.joinConversation(result.item.id);
        // Fetch the updated conversation and add to user's list
        const updatedConversation = await apiService.getConversation(result.item.id) as Conversation;
        dispatch({ type: 'ADD_CONVERSATION', payload: updatedConversation });
      } else {
        await apiService.joinFade(result.item.id);
        // Fetch the updated fade and add to user's list
        const updatedFade = await apiService.getFade(result.item.id) as Fade;
        dispatch({ type: 'ADD_FADE', payload: updatedFade });
      }
      
      // Refresh search results to update join status
      if (searchQuery.trim()) {
        await performSearch(searchQuery);
      }
      
      // Navigate to the item
      onSearch(result.item);
      onClose();
    } catch (error) {
      console.error('Error joining:', error);
      alert('Failed to join. Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleViewDetails = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    // If user is a participant, navigate to it
    if (isParticipant(result.item)) {
      onSearch(result.item);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Hive"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-full shadow-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-xl transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </form>
        </div>

        {/* Search Results or History */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={32} className="mx-auto mb-4 text-primary-600 animate-spin" />
              <p>Searching...</p>
            </div>
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Results ({searchResults.length})
                </div>
                {searchResults.map((result) => {
                  const isUserParticipant = isParticipant(result.item);
                  const isJoining = joiningId === result.item.id;
                  
                  return (
                    <div
                      key={`${result.type}-${result.item.id}`}
                      className="w-full flex items-start justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group mb-1"
                    >
                      <button
                        onClick={(e) => handleViewDetails(result, e)}
                        className="flex items-start space-x-3 flex-1 min-w-0 text-left"
                      >
                        {result.type === 'conversation' ? (
                          <Hash size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{result.item.name}</div>
                          {result.item.description && (
                            <div className="text-sm text-gray-500 truncate mt-0.5">{result.item.description}</div>
                          )}
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Users size={12} />
                              <span>{result.item.participants?.length || 0} participants</span>
                            </div>
                            {result.item.topics.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{result.item.topics.length} tags</span>
                              </>
                            )}
                            {isUserParticipant && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">Joined</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                      {!isUserParticipant && (
                        <button
                          onClick={(e) => handleJoin(result, e)}
                          disabled={isJoining}
                          className="ml-3 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 flex-shrink-0"
                        >
                          {isJoining ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Joining...</span>
                            </>
                          ) : (
                            <>
                              <LogIn size={14} />
                              <span>Join</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No results found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            )
          ) : searchHistory.length > 0 ? (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Recent Searches
              </div>
              {searchHistory.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(query, true)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 truncate">{query}</span>
                  </div>
                  <button
                    onClick={(e) => removeFromHistory(query, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No recent searches</p>
              <p className="text-sm mt-2">Start typing to search conversations and fades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

