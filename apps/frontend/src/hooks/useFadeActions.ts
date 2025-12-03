import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from './useSocket';
import { apiService } from '../services/api';
import type { Fade } from '../types';

export const useFadeActions = () => {
  const { state, dispatch } = useApp();
  const { leaveConversation } = useSocket();

  const deleteFade = useCallback(async (fade: Fade) => {
    if (!window.confirm('Are you sure you want to delete this fade? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteFade(fade.id);
      dispatch({ type: 'REMOVE_FADE', payload: fade.id });
    } catch (error) {
      console.error('Error deleting fade:', error);
      throw error;
    }
  }, [dispatch]);

  const leaveFade = useCallback(async (fade: Fade) => {
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
      throw error;
    }
  }, [dispatch, state.currentFade, leaveConversation]);

  const shareFade = useCallback((fade: Fade) => {
    console.log('Share fade:', fade.id);
    // TODO: Implement share functionality
  }, []);

  return {
    deleteFade,
    leaveFade,
    shareFade
  };
};

