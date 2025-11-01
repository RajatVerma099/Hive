import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateConversationModal } from './CreateConversationModal';
import { ChatListPane } from './ChatListPane';
import { DetailsPane } from './DetailsPane';
import { ChatArea } from './ChatArea';
import type { Conversation, Message } from '../types';

export const ConversationsTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation, sendMessage, onEvent, offEvent } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(new Map());
  const pendingMessageIdRef = useRef(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConversationsListCollapsed, setIsConversationsListCollapsed] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

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

  return (
    <div className="flex h-full relative">
      <ChatListPane<Conversation>
        title="Conversations"
        items={state.conversations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentItem={state.currentConversation}
        onItemSelect={handleJoinConversation}
        onEdit={handleEditConversation}
        onDelete={handleDeleteConversation}
        onShare={handleShareConversation}
        onLeave={handleLeaveConversation}
        onCreateClick={() => setShowCreateModal(true)}
        isLoading={isLoading}
        error={error}
        emptyStateTitle="No conversations yet"
        emptyStateMessage="Start a conversation or join one from the Discover tab to begin chatting."
        currentUserId={state.user?.id}
        isCollapsed={isConversationsListCollapsed}
        onToggleCollapse={() => setIsConversationsListCollapsed(!isConversationsListCollapsed)}
        menuClassName="conversation-menu"
      />

      {/* Chat area */}
      <div className={`flex-1 flex flex-col relative ${showDetailsPanel && state.currentConversation ? 'pr-80' : ''} transition-all duration-300`}>
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
    </div>
  );
};

