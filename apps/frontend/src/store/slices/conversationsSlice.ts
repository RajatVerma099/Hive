import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchConversations, fetchConversation, fetchMessages } from '../thunks/conversationsThunks';
import type { Conversation, Message } from '../../types';

interface ConversationsState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  lastFetched: Record<string, number>; // conversationId -> timestamp
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

const initialState: ConversationsState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  lastFetched: {},
  isLoading: false,
  isLoadingMessages: false,
  error: null,
};

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    addConversation: (state, action: PayloadAction<Conversation>) => {
      if (!state.conversations.find(c => c.id === action.payload.id)) {
        state.conversations.push(action.payload);
      }
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = action.payload;
      }
      if (state.currentConversation?.id === action.payload.id) {
        state.currentConversation = action.payload;
      }
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      if (state.currentConversation?.id === action.payload) {
        state.currentConversation = null;
      }
      delete state.messages[action.payload];
      delete state.lastFetched[action.payload];
    },
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const conversationId = action.payload.conversationId;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      // Check if message already exists (avoid duplicates)
      if (!state.messages[conversationId].find(m => m.id === action.payload.id)) {
        state.messages[conversationId].push(action.payload);
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const conversationId = action.payload.conversationId;
      if (state.messages[conversationId]) {
        const index = state.messages[conversationId].findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[conversationId][index] = action.payload;
        }
      }
    },
    removeMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const { conversationId, messageId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(m => m.id !== messageId);
      }
    },
    clearConversations: (state) => {
      state.conversations = [];
      state.currentConversation = null;
      state.messages = {};
      state.lastFetched = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.lastFetched['__all__'] = Date.now();
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single conversation
      .addCase(fetchConversation.fulfilled, (state, action) => {
        const existingIndex = state.conversations.findIndex(c => c.id === action.payload.id);
        if (existingIndex !== -1) {
          state.conversations[existingIndex] = action.payload;
        } else {
          state.conversations.push(action.payload);
        }
        state.lastFetched[action.payload.id] = Date.now();
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.conversationId] = action.payload.messages;
        state.lastFetched[action.payload.conversationId] = Date.now();
        state.isLoadingMessages = false;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.isLoadingMessages = false;
      });
  },
});

export const {
  addConversation,
  updateConversation,
  removeConversation,
  setCurrentConversation,
  addMessage,
  updateMessage,
  removeMessage,
  clearConversations,
} = conversationsSlice.actions;
export default conversationsSlice.reducer;

