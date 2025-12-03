import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from './useSocket';
import { apiService } from '../services/api';
import type { Conversation } from '../types';

export const useConversationActions = () => {
  const { state, dispatch } = useApp();
  const { leaveConversation } = useSocket();

  const deleteConversation = useCallback(async (conversation: Conversation) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteConversation(conversation.id);
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversation.id });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }, [dispatch]);

  const leaveConversationAction = useCallback(async (conversation: Conversation) => {
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
      throw error;
    }
  }, [dispatch, state.currentConversation, leaveConversation]);

  const shareConversation = useCallback((conversation: Conversation) => {
    // Placeholder for future share functionality
    console.log('Share conversation:', conversation.id);
    // TODO: Implement share functionality
  }, []);

  return {
    deleteConversation,
    leaveConversationAction,
    shareConversation
  };
};

