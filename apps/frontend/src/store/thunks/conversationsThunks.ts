import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import type { Conversation, Message } from '../../types';
import type { RootState } from '../index';

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchConversations = createAsyncThunk(
  'conversations/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.conversations.lastFetched['__all__'] || 0;
    const now = Date.now();
    
    // Return cached data if still fresh
    if (state.conversations.conversations.length > 0 && (now - lastFetched) < CACHE_DURATION) {
      return state.conversations.conversations;
    }
    
    try {
      const conversations = await apiService.getConversations() as Conversation[];
      return conversations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load conversations');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'conversations/fetchOne',
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.conversations.lastFetched[id] || 0;
    const now = Date.now();
    
    // Return cached conversation if still fresh
    const cached = state.conversations.conversations.find(c => c.id === id);
    if (cached && (now - lastFetched) < CACHE_DURATION) {
      return cached;
    }
    
    try {
      const conversation = await apiService.getConversation(id) as Conversation;
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load conversation');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'conversations/fetchMessages',
  async (conversationId: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const lastFetched = state.conversations.lastFetched[conversationId] || 0;
    const now = Date.now();
    
    // Return cached messages if still fresh
    if (state.conversations.messages[conversationId] && (now - lastFetched) < CACHE_DURATION) {
      return { conversationId, messages: state.conversations.messages[conversationId] };
    }
    
    try {
      const messages = await apiService.getMessages(conversationId) as Message[];
      return { conversationId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load messages');
    }
  }
);

