import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateFadeModal } from './CreateFadeModal';
import { MessageBubble } from './MessageBubble';
import type { Fade, FadeMessage } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock,
  Users,
  Hash,
  MessageCircle,
  Timer,
  Edit,
  Trash2,
  LogOut,
  Share2
} from 'lucide-react';

export const FadesTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFade, setEditingFade] = useState<Fade | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Map<string, FadeMessage>>(new Map());
  const pendingMessageIdRef = useRef(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
    if (state.currentFade?.id !== fade.id) {
      // Clear pending messages when switching fades
      setPendingMessages(new Map());
      
      // Leave current fade if switching
      if (state.currentFade) {
        leaveConversation(state.currentFade.id);
      }
      
      // Clear current conversation since we're switching to a fade
      if (state.currentConversation) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
      }
      
      // Set loading state BEFORE setting fade
      setIsLoadingMessages(true);
      
      // Set fade with empty messages to show loading state
      dispatch({ type: 'SET_CURRENT_FADE', payload: { ...fade, messages: [] } });
      
      // Join new fade (using conversation socket for now)
      joinConversation(fade.id);
      
      // Fetch all messages for this fade
      try {
        const messages = await apiService.getFadeMessages(fade.id) as FadeMessage[];
        const fadeWithMessages = {
          ...fade,
          messages: messages
        };
        dispatch({ type: 'SET_CURRENT_FADE', payload: fadeWithMessages });
      } catch (error) {
        console.error('Error fetching fade messages:', error);
        // Still set the fade even if messages fail to load
        dispatch({ type: 'SET_CURRENT_FADE', payload: { ...fade, messages: [] } });
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (state.currentFade?.messages) {
      scrollToBottom();
    }
  }, [state.currentFade?.messages?.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !state.currentFade || !state.user) return;

    const messageContent = newMessage.trim();
    
    // Create optimistic message
    const tempId = `pending-${Date.now()}-${pendingMessageIdRef.current++}`;
    const optimisticMessage: FadeMessage = {
      id: tempId,
      content: messageContent,
      fadeId: state.currentFade.id,
      userId: state.user.id,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: state.user,
    };

    // Add to pending messages
    setPendingMessages(prev => new Map(prev).set(tempId, optimisticMessage));

    // Add optimistic message to fade
    const updatedFade = {
      ...state.currentFade,
      messages: [...(state.currentFade.messages || []), optimisticMessage],
    };
    dispatch({ type: 'SET_CURRENT_FADE', payload: updatedFade });

    const fadeIdAtSend = state.currentFade.id;
    
    // Store the updated fade reference to use after API call
    const fadeWithOptimistic = updatedFade;
    
    try {
      // Send message via API
      const message = await apiService.sendFadeMessage(fadeIdAtSend, messageContent) as FadeMessage;
      
      // Remove from pending
      setPendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      
      // Replace optimistic message with confirmed one
      // Check if we're still in the same fade
      if (state.currentFade?.id === fadeIdAtSend) {
        // Use fadeWithOptimistic.messages which definitely contains the optimistic message
        // This ensures we're replacing the correct message even if state hasn't updated yet
        const finalMessages = fadeWithOptimistic.messages.map((m: FadeMessage) => 
          m.id === tempId ? message : m
        );
        
        const finalFade = {
          ...state.currentFade,
          messages: finalMessages,
        };
        dispatch({ type: 'SET_CURRENT_FADE', payload: finalFade });
      }
      
      setNewMessage('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message from UI
      setPendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      
      // Remove failed message if we're still in the same fade
      if (state.currentFade?.id === fadeIdAtSend) {
        const currentFadeMessages = state.currentFade.messages || fadeWithOptimistic.messages;
        const failedMessages = currentFadeMessages.filter((m: FadeMessage) => m.id !== tempId);
        
        const failedFade = {
          ...state.currentFade,
          messages: failedMessages,
        };
        dispatch({ type: 'SET_CURRENT_FADE', payload: failedFade });
      }
    }
  };

  const refreshFades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fades = await apiService.getFades() as Fade[];
      dispatch({ type: 'SET_FADES', payload: fades });
      
      // Update current fade if it exists
      if (state.currentFade) {
        const updatedFade = fades.find(f => f.id === state.currentFade?.id);
        if (updatedFade) {
          const messages = state.currentFade.messages || [];
          dispatch({ type: 'SET_CURRENT_FADE', payload: { ...updatedFade, messages } });
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any menu
      if (!target.closest('.fade-menu')) {
        setMenuOpenId(null);
      }
    };

    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpenId]);

  const handleEditFade = (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setEditingFade(fade);
    setShowCreateModal(true);
  };

  const handleDeleteFade = async (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    
    if (!window.confirm('Are you sure you want to delete this fade? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteFade(fade.id);
      dispatch({ type: 'REMOVE_FADE', payload: fade.id });
    } catch (error) {
      console.error('Error deleting fade:', error);
    }
  };

  const handleLeaveFade = async (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    
    try {
      await apiService.leaveFade(fade.id);
      dispatch({ type: 'REMOVE_FADE', payload: fade.id });
      // Clear current fade if it's the one we're leaving
      if (state.currentFade?.id === fade.id) {
        dispatch({ type: 'SET_CURRENT_FADE', payload: null });
        leaveConversation(fade.id);
      }
    } catch (error) {
      console.error('Error leaving fade:', error);
    }
  };

  const handleShareFade = (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    // Placeholder for future share functionality
    console.log('Share fade:', fade.id);
    // TODO: Implement share functionality
  };

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
                state.currentFade?.id === fade.id ? 'bg-primary-50 border-primary-200' : ''
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
                <div className="relative fade-menu">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === fade.id ? null : fade.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                  {menuOpenId === fade.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 fade-menu">
                      {state.user?.id === fade.creatorId && (
                        <>
                          <button
                            onClick={(e) => handleEditFade(fade, e)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Edit size={16} />
                            <span>Edit Fade</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteFade(fade, e)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            <span>Delete Fade</span>
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                        </>
                      )}
                      <button
                        onClick={(e) => handleShareFade(fade, e)}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Share2 size={16} />
                        <span>Share Fade</span>
                      </button>
                      {state.user?.id !== fade.creatorId && (
                        <button
                          onClick={(e) => handleLeaveFade(fade, e)}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Leave Fade</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
        {state.currentFade ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {state.currentFade.name}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-500">
                    {state.currentFade.participants?.length || 0} participants
                  </p>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryColor(state.currentFade.expiresAt)}`}>
                    {getTimeRemaining(state.currentFade.expiresAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : state.currentFade.messages && state.currentFade.messages.length > 0 ? (
                <>
                  {state.currentFade.messages.map((message) => {
                    const isSent = message.userId === state.user?.id;
                    const isPending = pendingMessages.has(message.id);
                    
                    return (
                      <div key={message.id} className="message-enter mb-0">
                        <MessageBubble
                          content={message.content}
                          timestamp={message.createdAt}
                          isSent={isSent}
                          isPending={isPending}
                          senderName={message.user?.name}
                          senderAvatar={message.user?.avatar}
                          showSenderInfo={!isSent}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </>
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
        onClose={() => {
          setShowCreateModal(false);
          setEditingFade(null);
        }}
        fade={editingFade}
        onFadeCreated={async (fade: Fade) => {
          // Only auto-open if creating new fade, not editing
          if (!editingFade) {
            // Fetch the fade with messages and open it
            try {
              const messages = await apiService.getFadeMessages(fade.id) as FadeMessage[];
              const fadeWithMessages = {
                ...fade,
                messages: messages
              };
              dispatch({ type: 'SET_CURRENT_FADE', payload: fadeWithMessages });
              joinConversation(fade.id);
            } catch (error) {
              console.error('Error loading fade messages:', error);
              // Still set the fade even if messages fail to load
              dispatch({ type: 'SET_CURRENT_FADE', payload: fade });
              joinConversation(fade.id);
            }
          }
        }}
        onDeleted={() => {
          // Refresh fades list
          refreshFades();
        }}
      />
    </div>
  );
};
