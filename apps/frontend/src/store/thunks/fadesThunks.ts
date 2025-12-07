import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import type { Fade, FadeMessage } from '../../types';
import type { RootState } from '../index';

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchFades = createAsyncThunk(
  'fades/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.fades.lastFetched['__all__'] || 0;
    const now = Date.now();
    
    // Return cached data if still fresh
    if (state.fades.fades.length > 0 && (now - lastFetched) < CACHE_DURATION) {
      return state.fades.fades;
    }
    
    try {
      const fades = await apiService.getFades() as Fade[];
      return fades;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load fades');
    }
  }
);

export const fetchFade = createAsyncThunk(
  'fades/fetchOne',
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.fades.lastFetched[id] || 0;
    const now = Date.now();
    
    // Return cached fade if still fresh
    const cached = state.fades.fades.find(f => f.id === id);
    if (cached && (now - lastFetched) < CACHE_DURATION) {
      return cached;
    }
    
    try {
      const fade = await apiService.getFade(id) as Fade;
      return fade;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load fade');
    }
  }
);

export const fetchFadeMessages = createAsyncThunk(
  'fades/fetchMessages',
  async (fadeId: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.fades.lastFetched[fadeId] || 0;
    const now = Date.now();
    
    // Return cached messages if still fresh
    if (state.fades.messages[fadeId] && (now - lastFetched) < CACHE_DURATION) {
      return { fadeId, messages: state.fades.messages[fadeId] };
    }
    
    try {
      const messages = await apiService.getFadeMessages(fadeId) as FadeMessage[];
      return { fadeId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load fade messages');
    }
  }
);

