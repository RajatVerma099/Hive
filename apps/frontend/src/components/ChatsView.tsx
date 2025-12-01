import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateConversationModal } from './CreateConversationModal';
import { CreateFadeModal } from './CreateFadeModal';
import { DetailsPane } from './DetailsPane';
import { ChatArea } from './ChatArea';
import { Hash, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';
import type { Conversation, Message, Fade, FadeMessage } from '../types';

export const ChatsView: React.FC = () => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation, sendMessage, onEvent, offEvent } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [fadeSearchQuery, setFadeSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFades, setIsLoadingFades] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeError, setFadeError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateFadeModal, setShowCreateFadeModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [editingFade, setEditingFade] = useState<Fade | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(new Map());
  const pendingMessageIdRef = useRef(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConversationsListCollapsed, setIsConversationsListCollapsed] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [isFadesSectionCollapsed, setIsFadesSectionCollapsed] = useState(false);
  const [isConversationsSectionCollapsed, setIsConversationsSectionCollapsed] = useState(false);

  // Load conversations from API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const conversations = await apiService.getConversations() as Conversation[];
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
      } catch (error) {
        console.error('Error loading conversations:', error);
        setError('Failed to load conversations');
        // Set empty array on error to show proper empty state
        dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, [dispatch]);

  // Load fades from API
  useEffect(() => {
    const loadFades = async () => {
      try {
        setIsLoadingFades(true);
        setFadeError(null);
        const fades = await apiService.getFades() as Fade[];
        dispatch({ type: 'SET_FADES', payload: fades });
      } catch (error) {
        console.error('Error loading fades:', error);
        setFadeError('Failed to load fades');
        dispatch({ type: 'SET_FADES', payload: [] });
      } finally {
        setIsLoadingFades(false);
      }
    };
    
    loadFades();
  }, [dispatch]);

  // Use refs to access latest state in socket handler
  const conversationRef = useRef(state.currentConversation);
  const userRef = useRef(state.user);
  
  useEffect(() => {
    conversationRef.current = state.currentConversation;
    userRef.current = state.user;
  }, [state.currentConversation, state.user]);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      const currentConversation = conversationRef.current;
      const currentUser = userRef.current;
      
      if (message.conversationId === currentConversation?.id) {
        // Use functional update to get latest pending messages
        setPendingMessages(currentPending => {
          // Check if this is a confirmed version of a pending message
          if (message.userId === currentUser?.id && currentPending.size > 0) {
            // Find matching pending message by content (trimmed for comparison)
            const pendingEntry = Array.from(currentPending.entries()).find(
              ([_, pendingMsg]) => 
                pendingMsg.content.trim() === message.content.trim() && 
                pendingMsg.userId === message.userId &&
                // Also check if sent recently (within last 10 seconds)
                Math.abs(new Date(message.createdAt).getTime() - new Date(pendingMsg.createdAt).getTime()) < 10000
            );
            
            if (pendingEntry) {
              const tempId = pendingEntry[0];
              
              // Replace pending message in conversation with confirmed one
              // Access current conversation from ref to ensure we have latest
              const conversationToUpdate = conversationRef.current;
              if (conversationToUpdate && conversationToUpdate.id === message.conversationId) {
                const updatedMessages = (conversationToUpdate.messages || []).map((m: Message) => 
                  m.id === tempId ? message : m
                );
                
                const updatedConversation = {
                  ...conversationToUpdate,
                  messages: updatedMessages,
                };
                dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: updatedConversation });
              }
              
              // Remove from pending
              const newMap = new Map(currentPending);
              newMap.delete(tempId);
              return newMap;
            }
          }

          // Not a pending message - add it normally
          const conversationToUpdate = conversationRef.current;
          if (conversationToUpdate && conversationToUpdate.id === message.conversationId) {
            // Check if message already exists (to avoid duplicates)
            const existingMessage = conversationToUpdate.messages?.find((m: Message) => m.id === message.id);
            if (!existingMessage) {
              const updatedConversation = {
                ...conversationToUpdate,
                messages: [...(conversationToUpdate.messages || []), message],
              };
              dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: updatedConversation });
            }
          }
          
          return currentPending;
        });
      }
    };

    onEvent('new-message', handleNewMessage);
    return () => offEvent('new-message', handleNewMessage);
  }, [onEvent, offEvent, dispatch]);

  const handleJoinConversation = async (conversation: Conversation) => {
    if (state.currentConversation?.id !== conversation.id) {
      // Clear pending messages when switching conversations
      setPendingMessages(new Map());
      setShowDetailsPanel(false);
      
      // Leave current conversation
      if (state.currentConversation) {
        leaveConversation(state.currentConversation.id);
      }
      
      // Clear current fade since we're switching to a conversation
      if (state.currentFade) {
        dispatch({ type: 'SET_CURRENT_FADE', payload: null });
      }
      
      // Set loading state BEFORE setting conversation
      setIsLoadingMessages(true);
      
      // Set conversation with empty messages to show loading state
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: { ...conversation, messages: [] } });
      
      // Join new conversation
      joinConversation(conversation.id);
      
      // Fetch all messages for this conversation
      try {
        const messages = await apiService.getMessages(conversation.id) as Message[];
        const conversationWithMessages = {
          ...conversation,
          messages: messages
        };
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationWithMessages });
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Still set the conversation even if messages fail to load
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: { ...conversation, messages: [] } });
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };
  

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !state.currentConversation || !state.user) return;

    const messageContent = newMessage.trim();
    
    // Create optimistic message
    const tempId = `pending-${Date.now()}-${pendingMessageIdRef.current++}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      conversationId: state.currentConversation.id,
      userId: state.user.id,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: state.user,
    };

    // Add to pending messages
    setPendingMessages(prev => new Map(prev).set(tempId, optimisticMessage));

    // Add optimistic message to conversation
    const updatedConversation = {
      ...state.currentConversation,
      messages: [...(state.currentConversation.messages || []), optimisticMessage],
    };
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: updatedConversation });
    
    // Update ref immediately so socket handler has latest state
    conversationRef.current = updatedConversation;

    // Send message via socket
    sendMessage({
      conversationId: state.currentConversation.id,
      content: messageContent,
      userId: state.user.id,
    });

    setNewMessage('');
  };



  const handleEditConversation = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversation(conversation);
    setShowCreateModal(true);
  };

  const handleDeleteConversation = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteConversation(conversation.id);
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversation.id });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleLeaveConversation = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await apiService.leaveConversation(conversation.id);
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversation.id });
      // Clear current conversation if it's the one we're leaving
      if (state.currentConversation?.id === conversation.id) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
        leaveConversation(conversation.id);
      }
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  };

  const handleShareConversation = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for future share functionality
    console.log('Share conversation:', conversation.id);
    // TODO: Implement share functionality
  };

  const handleJoinFade = async (fade: Fade) => {
    if (state.currentFade?.id !== fade.id) {
      // Clear pending messages when switching fades
      setPendingMessages(new Map());
      setShowDetailsPanel(false);
      
      // Leave current fade if switching
      if (state.currentFade) {
        leaveConversation(state.currentFade.id);
      }
      
      // Clear current conversation since we're switching to a fade
      if (state.currentConversation) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
        leaveConversation(state.currentConversation.id);
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

  const handleEditFade = (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFade(fade);
    setShowCreateFadeModal(true);
  };

  const handleDeleteFade = async (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    
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
    console.log('Share fade:', fade.id);
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

  const filteredConversations = state.conversations.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFades = state.fades.filter(item =>
    item.name.toLowerCase().includes(fadeSearchQuery.toLowerCase()) ||
    (item.description?.toLowerCase().includes(fadeSearchQuery.toLowerCase())) ||
    item.topics.some(topic => topic.toLowerCase().includes(fadeSearchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-full relative">
      {/* Custom Sidebar with Conversations and Fades */}
      <div 
        className={`bg-white flex flex-col h-full transition-all duration-300 ease-in-out relative ${
          isConversationsListCollapsed 
            ? 'w-1.5 bg-white/70 shadow-sm z-20' 
            : 'w-80 border-r border-gray-200 rounded-r-xl'
        }`}
      >
        {!isConversationsListCollapsed && (
          <>
            {/* Fades Section - Always visible, shown first */}
            <div className="flex flex-col flex-shrink-0">
              <div className="px-3 py-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setIsFadesSectionCollapsed(!isFadesSectionCollapsed)}
                    className="flex items-center space-x-1.5 hover:bg-gray-50 rounded px-1 py-0.5 -ml-1 transition-colors group"
                  >
                    {isFadesSectionCollapsed ? (
                      <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-700 transition-transform duration-300" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500 group-hover:text-gray-700 transition-transform duration-300" />
                    )}
                    <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Fades ({state.fades.length})</h2>
                  </button>
                  <button 
                    onClick={() => setShowCreateFadeModal(true)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus size={16} className="text-gray-600" />
                  </button>
                </div>
                
                {/* Search */}
                <div 
                  className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
                    isFadesSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
                  }`}
                >
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Search fades..."
                      value={fadeSearchQuery}
                      onChange={(e) => setFadeSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-gray-200 rounded-full shadow-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-lg transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Fades List */}
              <div 
                className={`flex-1 overflow-y-auto min-h-0 transition-all duration-300 ease-in-out ${
                  isFadesSectionCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[40vh] opacity-100'
                }`}
              >
                {isLoadingFades ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500">Loading fades...</p>
                  </div>
                ) : fadeError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-gray-500">{fadeError}</p>
                  </div>
                ) : filteredFades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-gray-500 text-sm">No fades yet</p>
                  </div>
                ) : (
                  filteredFades.map((item) => {
                    const maxVisibleTags = 2;
                    const visibleTags = item.topics.slice(0, maxVisibleTags);
                    const remainingTagsCount = item.topics.length - maxVisibleTags;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleJoinFade(item)}
                        className={`p-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          state.currentFade?.id === item.id ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 mb-0.5">
                              <Hash size={14} className="text-gray-400 flex-shrink-0" />
                              <h3 className="font-medium text-gray-900 truncate text-sm">
                                {item.name}
                              </h3>
                              <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getExpiryColor(item.expiresAt)}`}>
                                {getTimeRemaining(item.expiresAt)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Users size={11} />
                                <span>{item.participants?.length || 0}</span>
                              </div>
                              {item.topics.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <span>•</span>
                                  <span>{item.topics.length} tags</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Topics */}
                        {item.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {visibleTags.map((topic) => (
                              <span
                                key={topic}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                            {remainingTagsCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{remainingTagsCount} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Conversations Section */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-3 py-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setIsConversationsSectionCollapsed(!isConversationsSectionCollapsed)}
                    className="flex items-center space-x-1.5 hover:bg-gray-50 rounded px-1 py-0.5 -ml-1 transition-colors group"
                  >
                    {isConversationsSectionCollapsed ? (
                      <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-700 transition-transform duration-300" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500 group-hover:text-gray-700 transition-transform duration-300" />
                    )}
                    <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Conversations ({state.conversations.length})</h2>
                  </button>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus size={16} className="text-gray-600" />
                  </button>
                </div>
                
                {/* Search */}
                <div 
                  className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
                    isConversationsSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
                  }`}
                >
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-gray-200 rounded-full shadow-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-lg transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Conversations List */}
              <div 
                className={`flex-1 overflow-y-auto min-h-0 transition-all duration-300 ease-in-out ${
                  isConversationsSectionCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100'
                }`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500">Loading conversations...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-gray-500">{error}</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((item) => {
                    const maxVisibleTags = 2;
                    const visibleTags = item.topics.slice(0, maxVisibleTags);
                    const remainingTagsCount = item.topics.length - maxVisibleTags;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleJoinConversation(item)}
                        className={`p-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          state.currentConversation?.id === item.id ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <Hash size={14} className="text-gray-400 flex-shrink-0" />
                              <h3 className="font-medium text-gray-900 truncate text-sm">
                                {item.name}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Users size={11} />
                                <span>{item.participants?.length || 0}</span>
                              </div>
                              {item.topics.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <span>•</span>
                                  <span>{item.topics.length} tags</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Topics */}
                        {item.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {visibleTags.map((topic) => (
                              <span
                                key={topic}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                            {remainingTagsCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{remainingTagsCount} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsConversationsListCollapsed(!isConversationsListCollapsed)}
        className={`absolute top-[104px] z-30 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-all duration-300 ${
          isConversationsListCollapsed 
            ? 'left-1.5 -translate-x-1/2' 
            : 'left-80 -translate-x-1/2'
        }`}
        title={isConversationsListCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isConversationsListCollapsed ? (
          <ChevronRight size={16} className="text-gray-600" />
        ) : (
          <ChevronLeft size={16} className="text-gray-600" />
        )}
      </button>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col relative ${showDetailsPanel && (state.currentConversation || state.currentFade) ? 'pr-80' : ''} transition-all duration-300`}>
        {state.currentConversation ? (
          <>
            <ChatArea
              item={state.currentConversation}
              messages={state.currentConversation?.messages || []}
              currentUser={state.user}
              isLoadingMessages={isLoadingMessages}
              pendingMessages={new Set(Array.from(pendingMessages.keys()))}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onInfoClick={() => setShowDetailsPanel(!showDetailsPanel)}
              itemType="conversation"
              typingUsers={state.typingUsers}
            />
            
            <DetailsPane<Conversation>
              item={state.currentConversation}
              isOpen={showDetailsPanel}
              onClose={() => setShowDetailsPanel(false)}
              onEdit={handleEditConversation}
              onDelete={handleDeleteConversation}
              onShare={handleShareConversation}
              onLeave={handleLeaveConversation}
              currentUserId={state.user?.id}
              itemType="conversation"
            />
          </>
        ) : state.currentFade ? (
          <>
            <ChatArea
              item={state.currentFade}
              messages={state.currentFade?.messages || []}
              currentUser={state.user}
              isLoadingMessages={isLoadingMessages}
              pendingMessages={new Set()}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={async (e) => {
                e.preventDefault();
                if (!newMessage.trim() || !state.currentFade || !state.user) return;

                const messageContent = newMessage.trim();
                try {
                  const message = await apiService.sendFadeMessage(state.currentFade.id, messageContent) as FadeMessage;
                  const fadeWithMessages = {
                    ...state.currentFade,
                    messages: [...(state.currentFade.messages || []), message],
                  };
                  dispatch({ type: 'SET_CURRENT_FADE', payload: fadeWithMessages });
                  setNewMessage('');
                } catch (error) {
                  console.error('Error sending fade message:', error);
                }
              }}
              onInfoClick={() => setShowDetailsPanel(!showDetailsPanel)}
              itemType="fade"
              showExpiryBadge={true}
              getExpiryBadge={() => {
                if (!state.currentFade) return null;
                return (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryColor(state.currentFade.expiresAt)}`}>
                    {getTimeRemaining(state.currentFade.expiresAt)}
                  </div>
                );
              }}
            />
            
            <DetailsPane<Fade>
              item={state.currentFade}
              isOpen={showDetailsPanel}
              onClose={() => setShowDetailsPanel(false)}
              onEdit={handleEditFade}
              onDelete={handleDeleteFade}
              onShare={handleShareFade}
              onLeave={handleLeaveFade}
              currentUserId={state.user?.id}
              itemType="fade"
              showExpiry={true}
            />
          </>
        ) : null}
      </div>

      {/* Create Conversation Modal */}
      <CreateConversationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingConversation(null);
        }}
        conversation={editingConversation}
        onDeleted={() => {
          // Reload conversations
          const loadConversations = async () => {
            try {
              setIsLoading(true);
              setError(null);
              const conversations = await apiService.getConversations() as Conversation[];
              dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
            } catch (error) {
              console.error('Error refreshing conversations:', error);
              setError('Failed to refresh conversations');
            } finally {
              setIsLoading(false);
            }
          };
          loadConversations();
        }}
      />

      {/* Create Fade Modal */}
      <CreateFadeModal
        isOpen={showCreateFadeModal}
        onClose={() => {
          setShowCreateFadeModal(false);
          setEditingFade(null);
        }}
        fade={editingFade}
        onFadeCreated={async (fade: Fade) => {
          if (!editingFade) {
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
              dispatch({ type: 'SET_CURRENT_FADE', payload: fade });
              joinConversation(fade.id);
            }
          }
        }}
        onDeleted={() => {
          const loadFades = async () => {
            try {
              setIsLoadingFades(true);
              setFadeError(null);
              const fades = await apiService.getFades() as Fade[];
              dispatch({ type: 'SET_FADES', payload: fades });
            } catch (error) {
              console.error('Error refreshing fades:', error);
              setFadeError('Failed to refresh fades');
            } finally {
              setIsLoadingFades(false);
            }
          };
          loadFades();
        }}
      />
    </div>
  );
};

