import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response: any = await apiService.login(email, password);
      return { user: response.user, token: response.token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (
    { email, password, name, displayName }: { email: string; password: string; name: string; displayName?: string },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await apiService.signup(email, password, name, displayName);
      return { user: response.user, token: response.token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    try {
      const response: any = await apiService.getCurrentUser();
      return response.user;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Session expired');
    }
  }
);

