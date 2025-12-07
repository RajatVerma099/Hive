import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeFade, setCurrentFade } from '../store/slices/fadesSlice';
import { useSocket } from './useSocket';
import { apiService } from '../services/api';
import type { Fade } from '../types';

export const useFadeActions = () => {
  const dispatch = useAppDispatch();
  const currentFade = useAppSelector(state => state.fades.currentFade);
  const { leaveConversation } = useSocket();

  const deleteFade = useCallback(async (fade: Fade) => {
    if (!window.confirm('Are you sure you want to delete this fade? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteFade(fade.id);
      dispatch(removeFade(fade.id));
    } catch (error) {
      console.error('Error deleting fade:', error);
      throw error;
    }
  }, [dispatch]);

  const leaveFade = useCallback(async (fade: Fade) => {
    try {
      await apiService.leaveFade(fade.id);
      dispatch(removeFade(fade.id));
      
      // Clear current fade if it's the one we're leaving
      if (currentFade?.id === fade.id) {
        dispatch(setCurrentFade(null));
        leaveConversation(fade.id);
      }
    } catch (error) {
      console.error('Error leaving fade:', error);
      throw error;
    }
  }, [dispatch, currentFade, leaveConversation]);

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

