import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateConversationModal } from './CreateConversationModal';
import type { Conversation, Message } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock,
  Users,
  Hash,
  MessageCircle
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

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === state.currentConversation?.id) {
        // Add message to current conversation
        const updatedConversation = {
          ...state.currentConversation,
          messages: [...(state.currentConversation.messages || []), message],
        };
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: updatedConversation });
      }
    };

    onEvent('new-message', handleNewMessage);
    return () => offEvent('new-message', handleNewMessage);
  }, [state.currentConversation, onEvent, offEvent, dispatch]);

  const handleJoinConversation = async (conversation: Conversation) => {
    if (state.currentConversation?.id !== conversation.id) {
      // Leave current conversation
      if (state.currentConversation) {
        leaveConversation(state.currentConversation.id);
      }
      
      // Clear current fade since we're switching to a conversation
      if (state.currentFade) {
        dispatch({ type: 'SET_CURRENT_FADE', payload: null });
      }
      
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
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !state.currentConversation || !state.user) return;

    sendMessage({
      conversationId: state.currentConversation.id,
      content: newMessage,
      userId: state.user.id,
    });

    setNewMessage('');
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
                <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {state.currentConversation.messages && state.currentConversation.messages.length > 0 ? (
                state.currentConversation.messages.map((message) => (
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
                      Be the first to send a message in this conversation
                    </p>
                  </div>
                </div>
              )}
              
              {/* Typing indicator */}
              {state.typingUsers.size > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span>Someone is typing...</span>
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
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
