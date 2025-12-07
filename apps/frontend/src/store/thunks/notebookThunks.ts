import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import type { Notebook } from '../../types';
import type { RootState } from '../index';

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchNotebook = createAsyncThunk(
  'notebook/fetch',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.notebook.lastFetched;
    const now = Date.now();
    
    // Return cached data if still fresh
    if (lastFetched && state.notebook.notebook.length > 0 && (now - lastFetched) < CACHE_DURATION) {
      return state.notebook.notebook;
    }
    
    try {
      const notebook = await apiService.getNotebook() as Notebook[];
      return notebook;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load notebook');
    }
  }
);

