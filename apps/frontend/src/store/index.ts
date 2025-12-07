import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationsReducer from './slices/conversationsSlice';
import fadesReducer from './slices/fadesSlice';
import notebookReducer from './slices/notebookSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationsReducer,
    fades: fadesReducer,
    notebook: notebookReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

