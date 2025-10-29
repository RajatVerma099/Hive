import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateFadeModal } from './CreateFadeModal';
import type { Fade, FadeMessage } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock,
  Users,
  Hash,
  MessageCircle,
  Timer
} from 'lucide-react';

export const FadesTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentFade, setCurrentFade] = useState<Fade | null>(null);

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

  // Note: Socket events for fade messages are not yet implemented
  // Messages are currently sent/received via API only
  // TODO: Add socket support for fade messages similar to conversations

  const handleJoinFade = async (fade: Fade) => {
    if (currentFade?.id !== fade.id) {
      // Leave current conversation if switching
      if (currentFade) {
        leaveConversation(currentFade.id);
      }
      
      // Join new fade (using conversation socket for now)
      joinConversation(fade.id);
      
      // Fetch all messages for this fade
      try {
        const messages = await apiService.getFadeMessages(fade.id) as FadeMessage[];
        const fadeWithMessages = {
          ...fade,
          messages: messages
        };
        setCurrentFade(fadeWithMessages);
      } catch (error) {
        console.error('Error fetching fade messages:', error);
        // Still set the fade even if messages fail to load
        setCurrentFade(fade);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentFade || !state.user) return;

    try {
      // Send message via API
      const message = await apiService.sendFadeMessage(currentFade.id, newMessage) as FadeMessage;
      
      // Add message to current fade
      const updatedFade = {
        ...currentFade,
        messages: [...(currentFade.messages || []), message],
      };
      setCurrentFade(updatedFade);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const refreshFades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fades = await apiService.getFades() as Fade[];
      dispatch({ type: 'SET_FADES', payload: fades });
      
      // Update current fade if it exists
      if (currentFade) {
        const updatedFade = fades.find(f => f.id === currentFade.id);
        if (updatedFade) {
          const messages = currentFade.messages || [];
          setCurrentFade({ ...updatedFade, messages });
        }
      }
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

  return (
    <div className="flex h-full">
      {/* Fades list */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Fades list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500">Loading fades...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle size={48} className="text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error loading fades
              </h3>
              <p className="text-gray-500 max-w-md mb-4">
                {error}
              </p>
              <button 
                onClick={refreshFades}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredFades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No fades found' : 'No fades yet'}
              </h3>
              <p className="text-gray-500 max-w-md mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create a fade to begin chatting'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Fade</span>
                </button>
              )}
            </div>
          ) : (
            filteredFades.map((fade) => (
            <div
              key={fade.id}
              onClick={() => handleJoinFade(fade)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentFade?.id === fade.id ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Hash size={16} className="text-gray-400 flex-shrink-0" />
                    <h3 className="font-medium text-gray-900 truncate">
                      {fade.name}
                    </h3>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getExpiryColor(fade.expiresAt)}`}>
                      {getTimeRemaining(fade.expiresAt)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {fade.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Users size={12} />
                      <span>{fade.participants?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{new Date(fade.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Timer size={12} />
                      <span>Expires {new Date(fade.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>
              
              {/* Topics */}
              <div className="flex flex-wrap gap-1 mt-2">
                {fade.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {currentFade ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {currentFade.name}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-500">
                    {currentFade.participants?.length || 0} participants
                  </p>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryColor(currentFade.expiresAt)}`}>
                    {getTimeRemaining(currentFade.expiresAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentFade.messages && currentFade.messages.length > 0 ? (
                currentFade.messages.map((message) => (
                  <div key={message.id} className="message-enter">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary-700">
                          {message.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {message.user?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800 mt-1">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No messages yet
                    </h3>
                    <p className="text-gray-500">
                      Be the first to send a message in this fade
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a fade
              </h3>
              <p className="text-gray-500">
                Choose a fade from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Fade Modal */}
      <CreateFadeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onFadeCreated={async (fade: Fade) => {
          // Fetch the fade with messages and open it
          try {
            const messages = await apiService.getFadeMessages(fade.id) as FadeMessage[];
            const fadeWithMessages = {
              ...fade,
              messages: messages
            };
            setCurrentFade(fadeWithMessages);
            joinConversation(fade.id);
          } catch (error) {
            console.error('Error loading fade messages:', error);
            // Still set the fade even if messages fail to load
            setCurrentFade(fade);
            joinConversation(fade.id);
          }
        }}
      />
    </div>
  );
};
