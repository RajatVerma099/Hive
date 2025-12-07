import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeConversation, setCurrentConversation } from '../store/slices/conversationsSlice';
import { useSocket } from './useSocket';
import { apiService } from '../services/api';
import type { Conversation } from '../types';

export const useConversationActions = () => {
  const dispatch = useAppDispatch();
  const currentConversation = useAppSelector((state) => state.conversations.currentConversation);
  const { leaveConversation } = useSocket();

  const deleteConversation = useCallback(async (conversation: Conversation) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteConversation(conversation.id);
      dispatch(removeConversation(conversation.id));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }, [dispatch]);

  const leaveConversationAction = useCallback(async (conversation: Conversation) => {
    try {
      await apiService.leaveConversation(conversation.id);
      dispatch(removeConversation(conversation.id));
      
      // Clear current conversation if it's the one we're leaving
      if (currentConversation?.id === conversation.id) {
        dispatch(setCurrentConversation(null));
        leaveConversation(conversation.id);
      }
    } catch (error) {
      console.error('Error leaving conversation:', error);
      throw error;
    }
  }, [dispatch, currentConversation, leaveConversation]);

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

