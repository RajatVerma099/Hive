import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateConversationModal } from './CreateConversationModal';
import { MessageBubble } from './MessageBubble';
import type { Conversation, Message } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock,
  Users,
  Hash,
  MessageCircle,
  Edit,
  Trash2,
  LogOut,
  Share2
} from 'lucide-react';

export const ChatsTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation, sendMessage, onEvent, offEvent } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  // const [isTyping, setIsTyping] = useState(false); // TODO: Implement typing indicator
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(new Map());
  const pendingMessageIdRef = useRef(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (state.currentConversation?.messages) {
      scrollToBottom();
    }
  }, [state.currentConversation?.messages?.length]);

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
    
    // Scroll to bottom after sending
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const refreshConversations = async () => {
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

  const filteredConversations = state.conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any menu
      if (!target.closest('.conversation-menu')) {
        setMenuOpenId(null);
      }
    };

    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpenId]);

  const handleEditConversation = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setEditingConversation(conversation);
    setShowCreateModal(true);
  };

  const handleDeleteConversation = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    
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
    setMenuOpenId(null);
    
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
    setMenuOpenId(null);
    // Placeholder for future share functionality
    console.log('Share conversation:', conversation.id);
    // TODO: Implement share functionality
  };

  return (
    <div className="flex h-full">
      {/* Conversations list */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
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
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle size={48} className="text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error loading conversations
              </h3>
              <p className="text-gray-500 max-w-md mb-4">
                {error}
              </p>
              <button 
                onClick={refreshConversations}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-500 max-w-md">
                Start a conversation or join one from the Discover tab to begin chatting.
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleJoinConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                state.currentConversation?.id === conversation.id ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Hash size={16} className="text-gray-400 flex-shrink-0" />
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {conversation.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Users size={12} />
                      <span>{conversation.participants?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="relative conversation-menu">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                  {menuOpenId === conversation.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 conversation-menu">
                      {state.user?.id === conversation.creatorId && (
                        <>
                          <button
                            onClick={(e) => handleEditConversation(conversation, e)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Edit size={16} />
                            <span>Edit Conversation</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(conversation, e)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            <span>Delete Conversation</span>
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                        </>
                      )}
                      <button
                        onClick={(e) => handleShareConversation(conversation, e)}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Share2 size={16} />
                        <span>Share Conversation</span>
                      </button>
                      {state.user?.id !== conversation.creatorId && (
                        <button
                          onClick={(e) => handleLeaveConversation(conversation, e)}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Leave Conversation</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Topics */}
              <div className="flex flex-wrap gap-1 mt-2">
                {conversation.topics.slice(0, 3).map((topic) => (
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
        {state.currentConversation ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {state.currentConversation.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {state.currentConversation.participants?.length || 0} participants
                </p>
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
              ) : state.currentConversation.messages && state.currentConversation.messages.length > 0 ? (
                <>
                  {state.currentConversation.messages.map((message) => {
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
                  
                  {/* Typing indicator */}
                  {state.typingUsers.size > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 pt-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span>Someone is typing...</span>
                    </div>
                  )}
                  
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
                      Be the first to send a message in this conversation
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
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
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
          // Refresh conversations list
          refreshConversations();
        }}
      />
    </div>
  );
};
