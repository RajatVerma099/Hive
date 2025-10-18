import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, displayName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: 'AUTH_START' });
      // Verify token with backend
      apiService.getCurrentUser()
        .then((response: any) => {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.user, token }
          });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: any = await apiService.login(email, password);
      localStorage.setItem('token', response.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token }
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Login failed'
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, displayName?: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: any = await apiService.signup(email, password, name, displayName);
      localStorage.setItem('token', response.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token }
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Signup failed'
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
