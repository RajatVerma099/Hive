import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchFades, fetchFade, fetchFadeMessages } from '../thunks/fadesThunks';
import type { Fade, FadeMessage } from '../../types';

interface FadesState {
  fades: Fade[];
  currentFade: Fade | null;
  messages: Record<string, FadeMessage[]>; // fadeId -> messages
  lastFetched: Record<string, number>; // fadeId -> timestamp
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

const initialState: FadesState = {
  fades: [],
  currentFade: null,
  messages: {},
  lastFetched: {},
  isLoading: false,
  isLoadingMessages: false,
  error: null,
};

const fadesSlice = createSlice({
  name: 'fades',
  initialState,
  reducers: {
    addFade: (state, action: PayloadAction<Fade>) => {
      if (!state.fades.find(f => f.id === action.payload.id)) {
        state.fades.push(action.payload);
      }
    },
    updateFade: (state, action: PayloadAction<Fade>) => {
      const index = state.fades.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.fades[index] = action.payload;
      }
      if (state.currentFade?.id === action.payload.id) {
        state.currentFade = action.payload;
      }
    },
    removeFade: (state, action: PayloadAction<string>) => {
      state.fades = state.fades.filter(f => f.id !== action.payload);
      if (state.currentFade?.id === action.payload) {
        state.currentFade = null;
      }
      delete state.messages[action.payload];
      delete state.lastFetched[action.payload];
    },
    setCurrentFade: (state, action: PayloadAction<Fade | null>) => {
      state.currentFade = action.payload;
    },
    addMessage: (state, action: PayloadAction<FadeMessage>) => {
      const fadeId = action.payload.fadeId;
      if (!state.messages[fadeId]) {
        state.messages[fadeId] = [];
      }
      // Check if message already exists (avoid duplicates)
      if (!state.messages[fadeId].find(m => m.id === action.payload.id)) {
        state.messages[fadeId].push(action.payload);
      }
    },
    updateMessage: (state, action: PayloadAction<FadeMessage>) => {
      const fadeId = action.payload.fadeId;
      if (state.messages[fadeId]) {
        const index = state.messages[fadeId].findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[fadeId][index] = action.payload;
        }
      }
    },
    removeMessage: (state, action: PayloadAction<{ fadeId: string; messageId: string }>) => {
      const { fadeId, messageId } = action.payload;
      if (state.messages[fadeId]) {
        state.messages[fadeId] = state.messages[fadeId].filter(m => m.id !== messageId);
      }
    },
    clearFades: (state) => {
      state.fades = [];
      state.currentFade = null;
      state.messages = {};
      state.lastFetched = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch fades
      .addCase(fetchFades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFades.fulfilled, (state, action) => {
        state.fades = action.payload;
        state.lastFetched['__all__'] = Date.now();
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchFades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single fade
      .addCase(fetchFade.fulfilled, (state, action) => {
        const existingIndex = state.fades.findIndex(f => f.id === action.payload.id);
        if (existingIndex !== -1) {
          state.fades[existingIndex] = action.payload;
        } else {
          state.fades.push(action.payload);
        }
        state.lastFetched[action.payload.id] = Date.now();
      })
      // Fetch fade messages
      .addCase(fetchFadeMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchFadeMessages.fulfilled, (state, action) => {
        state.messages[action.payload.fadeId] = action.payload.messages;
        state.lastFetched[action.payload.fadeId] = Date.now();
        state.isLoadingMessages = false;
      })
      .addCase(fetchFadeMessages.rejected, (state) => {
        state.isLoadingMessages = false;
      });
  },
});

export const {
  addFade,
  updateFade,
  removeFade,
  setCurrentFade,
  addMessage,
  updateMessage,
  removeMessage,
  clearFades,
} = fadesSlice.actions;
export default fadesSlice.reducer;

