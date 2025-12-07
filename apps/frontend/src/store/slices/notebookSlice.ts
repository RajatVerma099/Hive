import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchNotebook } from '../thunks/notebookThunks';
import type { Notebook } from '../../types';

interface NotebookState {
  notebook: Notebook[];
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotebookState = {
  notebook: [],
  lastFetched: null,
  isLoading: false,
  error: null,
};

const notebookSlice = createSlice({
  name: 'notebook',
  initialState,
  reducers: {
    addToNotebook: (state, action: PayloadAction<Notebook>) => {
      if (!state.notebook.find(n => n.id === action.payload.id)) {
        state.notebook.push(action.payload);
      }
    },
    removeFromNotebook: (state, action: PayloadAction<string>) => {
      state.notebook = state.notebook.filter(n => n.id !== action.payload);
    },
    clearNotebook: (state) => {
      state.notebook = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotebook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotebook.fulfilled, (state, action) => {
        state.notebook = action.payload;
        state.lastFetched = Date.now();
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchNotebook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addToNotebook,
  removeFromNotebook,
  clearNotebook,
} = notebookSlice.actions;
export default notebookSlice.reducer;

