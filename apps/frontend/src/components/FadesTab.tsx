import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { CreateFadeModal } from './CreateFadeModal';
import type { Fade } from '../types';
import { 
  Plus, 
  Search, 
  Clock, 
  Users, 
  Hash,
  Timer
} from 'lucide-react';

export const FadesTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load fades from API
  useEffect(() => {
    const loadFades = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fades = await apiService.getFades() as Fade[];
        dispatch({ type: 'SET_FADES', payload: fades });
      } catch (error) {
        console.error('Error loading fades:', error);
        setError('Failed to load fades');
        dispatch({ type: 'SET_FADES', payload: [] });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFades();
  }, [dispatch]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getExpiryColor = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'text-red-600 bg-red-100';
    if (hours < 6) return 'text-orange-600 bg-orange-100';
    if (hours < 24) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const refreshFades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fades = await apiService.getFades() as Fade[];
      dispatch({ type: 'SET_FADES', payload: fades });
    } catch (error) {
      console.error('Error refreshing fades:', error);
      setError('Failed to refresh fades');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFades = state.fades.filter(fade =>
    fade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fade.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fade.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Fades</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Plus size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search fades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading fades...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading fades</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={refreshFades}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredFades.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No fades found' : 'No fades yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create a fade or join one from the Discover tab to begin'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Fade</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFades.map((fade) => (
              <div
                key={fade.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {fade.name}
                  </h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryColor(fade.expiresAt)}`}>
                    {getTimeRemaining(fade.expiresAt)}
                  </div>
                </div>

                {fade.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {fade.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-4">
                  {fade.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {topic}
                    </span>
                  ))}
                  {fade.topics.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{fade.topics.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{fade.participants?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(fade.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Timer className="w-4 h-4" />
                    <span>Expires {new Date(fade.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors">
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Fade Modal */}
      <CreateFadeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};


