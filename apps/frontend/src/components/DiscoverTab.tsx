import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import type { Conversation, Fade, SearchFilters } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Users, 
  Hash,
  Star,
  TrendingUp,
  Calendar
} from 'lucide-react';

export const DiscoverTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    topics: [],
    visibility: 'ALL',
    sortBy: 'recent',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load conversations and fades in parallel
        const [conversations, fades] = await Promise.all([
          apiService.getConversations(),
          apiService.getFades()
        ]);
        
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversations as Conversation[] });
        dispatch({ type: 'SET_FADES', payload: fades as Fade[] });
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load conversations and fades');
        dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
        dispatch({ type: 'SET_FADES', payload: [] });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dispatch]);

  const handleJoinConversation = (conversation: Conversation) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
  };

  const handleJoinFade = (fade: Fade) => {
    // For now, treat fades like conversations
    const conversation: Conversation = {
      id: fade.id,
      name: fade.name,
      description: fade.description,
      topics: fade.topics,
      visibility: 'PUBLIC',
      defaultMute: false,
      createdAt: fade.createdAt,
      updatedAt: fade.updatedAt,
      creatorId: fade.creatorId,
      isActive: fade.isActive,
      participants: [],
      messages: [],
    };
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
  };

  const filteredConversations = state.conversations.filter(conv => {
    const matchesQuery = conv.name.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
                        conv.description?.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
                        conv.topics.some(topic => topic.toLowerCase().includes(searchFilters.query.toLowerCase()));
    
    const matchesVisibility = searchFilters.visibility === 'ALL' || conv.visibility === searchFilters.visibility;
    
    const matchesTopics = searchFilters.topics.length === 0 || 
                         searchFilters.topics.some(topic => conv.topics.includes(topic));
    
    return matchesQuery && matchesVisibility && matchesTopics;
  });

  const filteredFades = state.fades.filter(fade => {
    const matchesQuery = fade.name.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
                        fade.description?.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
                        fade.topics.some(topic => topic.toLowerCase().includes(searchFilters.query.toLowerCase()));
    
    const matchesTopics = searchFilters.topics.length === 0 || 
                         searchFilters.topics.some(topic => fade.topics.includes(topic));
    
    return matchesQuery && matchesTopics;
  });

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [conversations, fades] = await Promise.all([
        apiService.getConversations(),
        apiService.getFades()
      ]);
      
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations as Conversation[] });
      dispatch({ type: 'SET_FADES', payload: fades as Fade[] });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Discover Conversations</h2>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Plus size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* Search and filters */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations, topics, or descriptions..."
              value={searchFilters.query}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-primary-50 border-primary-200 text-primary-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} className="inline mr-2" />
            Filters
          </button>
        </div>

        {/* Filter options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <select
                  value={searchFilters.visibility}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, visibility: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ALL">All</option>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="UNLISTED">Unlisted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={searchFilters.sortBy}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-500">Loading conversations and fades...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Search size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error loading data
            </h3>
            <p className="text-gray-500 max-w-md mb-4">
              {error}
            </p>
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Fades section */}
            <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp size={20} className="text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Live Fades</h3>
          </div>
          {filteredFades.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No live fades</h4>
              <p className="text-gray-500">Check back later for temporary conversations about live events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFades.map((fade) => (
                <div
                  key={fade.id}
                  onClick={() => handleJoinFade(fade)}
                  className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{fade.name}</h4>
                    <div className="flex items-center space-x-1 text-xs text-orange-600">
                      <Clock size={12} />
                      <span>{getTimeRemaining(fade.expiresAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{fade.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {fade.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users size={12} />
                      <span>{fade.participants?.length || 0} active</span>
                    </div>
                    <button className="text-orange-600 hover:text-orange-700">
                      Join Fade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversations section */}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Hash size={20} className="text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
          </div>
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <Hash size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h4>
              <p className="text-gray-500">Create your first conversation to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleJoinConversation(conversation)}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{conversation.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">4.8</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{conversation.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {conversation.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Users size={12} />
                      <span>{conversation.participants?.length || 0} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{new Date(conversation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700">
                    Join
                  </button>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};
