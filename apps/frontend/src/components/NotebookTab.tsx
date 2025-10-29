import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import type { Message } from '../types';
import { 
  Search, 
  BookOpen, 
  Star, 
  MessageCircle, 
  Trash2,
  ExternalLink
} from 'lucide-react';

export const NotebookTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notebook from API
  useEffect(() => {
    const loadNotebook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const notebook: any = await apiService.getNotebook();
        dispatch({ type: 'SET_NOTEBOOK', payload: notebook });
      } catch (error) {
        console.error('Error loading notebook:', error);
        setError('Failed to load saved messages');
        dispatch({ type: 'SET_NOTEBOOK', payload: [] });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotebook();
  }, [dispatch]);

  const handleRemoveFromNotebook = async (notebookId: string) => {
    try {
      await apiService.removeFromNotebook(notebookId);
      dispatch({ type: 'REMOVE_FROM_NOTEBOOK', payload: notebookId });
    } catch (error) {
      console.error('Error removing from notebook:', error);
      setError('Failed to remove from notebook');
    }
  };

  const handleViewOriginal = (message: Message) => {
    // Find the conversation and navigate to it
    const conversation = state.conversations.find(conv => conv.id === message.conversationId);
    if (conversation) {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
    }
  };

  const refreshNotebook = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const notebook: any = await apiService.getNotebook();
      dispatch({ type: 'SET_NOTEBOOK', payload: notebook });
    } catch (error) {
      console.error('Error refreshing notebook:', error);
      setError('Failed to refresh saved messages');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotebook = state.notebook.filter(item => {
    const matchesQuery = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.message?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.message?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => 
                         item.message?.content?.toLowerCase().includes(tag.toLowerCase())
                       );
    
    return matchesQuery && matchesTags;
  });

  // Extract unique tags from all messages
  const allTags = Array.from(new Set(
    state.notebook.flatMap(item => 
      item.message?.content
        ?.toLowerCase()
        .match(/\b\w+\b/g) || []
    )
  )).slice(0, 20); // Limit to 20 most common tags

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen size={24} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">My Notebook</h2>
            <span className="bg-primary-100 text-primary-700 text-sm px-2 py-1 rounded-full">
              {state.notebook.length} saved
            </span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-500">Loading saved messages...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error loading notebook
            </h3>
            <p className="text-gray-500 max-w-md mb-4">
              {error}
            </p>
            <button 
              onClick={refreshNotebook}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredNotebook.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {state.notebook.length === 0 ? 'No saved messages yet' : 'No messages match your search'}
            </h3>
            <p className="text-gray-500 max-w-md">
              {state.notebook.length === 0 
                ? 'Start saving interesting messages from conversations to build your personal knowledge base.'
                : 'Try adjusting your search terms or filters to find what you\'re looking for.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotebook.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {item.title || 'Untitled'}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>by {item.message?.user?.name || 'Unknown User'}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewOriginal(item.message!)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                      title="View original message"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveFromNotebook(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove from notebook"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-gray-800">{item.message?.content || 'No content available'}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      From conversation: {state.conversations.find(c => c.id === item.message?.conversationId)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-500" />
                    <span className="text-sm text-gray-500">Saved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
