import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/api';
import { CreateFadeModal } from './CreateFadeModal';
import { ChatListPane } from './ChatListPane';
import { DetailsPane } from './DetailsPane';
import { ChatArea } from './ChatArea';
import type { Fade, FadeMessage } from '../types';

export const FadesTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFade, setEditingFade] = useState<Fade | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Map<string, FadeMessage>>(new Map());
  const pendingMessageIdRef = useRef(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isFadesListCollapsed, setIsFadesListCollapsed] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

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
      setShowDetailsPanel(false);
      
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



  const handleEditFade = (fade: Fade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFade(fade);
    setShowCreateModal(true);
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

  const getExpiryBadge = (fade: Fade) => (
    <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getExpiryColor(fade.expiresAt)}`}>
      {getTimeRemaining(fade.expiresAt)}
    </div>
  );

  const getExpiryBadgeForHeader = () => {
    if (!state.currentFade) return null;
    return (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryColor(state.currentFade.expiresAt)}`}>
        {getTimeRemaining(state.currentFade.expiresAt)}
      </div>
    );
  };

  return (
    <div className="flex h-full relative">
      <ChatListPane<Fade>
        title="Fades"
        items={state.fades}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentItem={state.currentFade}
        onItemSelect={handleJoinFade}
        onEdit={handleEditFade}
        onDelete={handleDeleteFade}
        onShare={handleShareFade}
        onLeave={handleLeaveFade}
        onCreateClick={() => setShowCreateModal(true)}
        isLoading={isLoading}
        error={error}
        emptyStateTitle={searchQuery ? 'No fades found' : 'No fades yet'}
        emptyStateMessage={searchQuery 
          ? 'Try adjusting your search terms'
          : 'Create a fade to begin chatting'
        }
        currentUserId={state.user?.id}
        isCollapsed={isFadesListCollapsed}
        onToggleCollapse={() => setIsFadesListCollapsed(!isFadesListCollapsed)}
        getExpiryBadge={getExpiryBadge}
        menuClassName="fade-menu"
      />

      {/* Chat area */}
      <div className={`flex-1 flex flex-col relative ${showDetailsPanel && state.currentFade ? 'pr-80' : ''} transition-all duration-300`}>
        <ChatArea
          item={state.currentFade}
          messages={state.currentFade?.messages || []}
          currentUser={state.user}
          isLoadingMessages={isLoadingMessages}
          pendingMessages={new Set(Array.from(pendingMessages.keys()))}
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onInfoClick={() => setShowDetailsPanel(!showDetailsPanel)}
          showExpiryBadge={true}
          getExpiryBadge={getExpiryBadgeForHeader}
          itemType="fade"
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
          showExpiry={true}
          itemType="fade"
        />
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
          // Reload fades
          const loadFades = async () => {
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
          loadFades();
        }}
      />
    </div>
  );
};
