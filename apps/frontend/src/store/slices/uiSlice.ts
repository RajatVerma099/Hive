import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isConnected: boolean;
  typingUsers: string[];
}

const initialState: UiState = {
  isConnected: false,
  typingUsers: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setTypingUsers: (state, action: PayloadAction<string[]>) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
    },
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },
  },
});

export const {
  setConnectionStatus,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
} = uiSlice.actions;
export default uiSlice.reducer;

