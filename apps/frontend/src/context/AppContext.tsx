import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, User, Conversation, Fade, Notebook, TabType } from '../types';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] } // User conversations
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'SET_FADES'; payload: Fade[] } // User fades
  | { type: 'ADD_FADE'; payload: Fade }
  | { type: 'UPDATE_FADE'; payload: Fade }
  | { type: 'SET_DISCOVER_CONVERSATIONS'; payload: Conversation[] } // Discover conversations
  | { type: 'SET_DISCOVER_FADES'; payload: Fade[] } // Discover fades
  | { type: 'SET_NOTEBOOK'; payload: Notebook[] }
  | { type: 'ADD_TO_NOTEBOOK'; payload: Notebook }
  | { type: 'REMOVE_FROM_NOTEBOOK'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_TYPING_USERS'; payload: Set<string> }
  | { type: 'ADD_TYPING_USER'; payload: string }
  | { type: 'REMOVE_TYPING_USER'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType };

// Initial state
const initialState: AppState = {
  user: null,
  currentConversation: null,
  conversations: [], // User's conversations
  fades: [], // User's fades
  discoverConversations: [], // Public conversations for discovery
  discoverFades: [], // Public fades for discovery
  notebook: [],
  isConnected: false,
  typingUsers: new Set(),
  activeTab: 'chats',
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [...state.conversations, action.payload],
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      };
    
    case 'SET_FADES':
      return { ...state, fades: action.payload };
    
    case 'ADD_FADE':
      return { ...state, fades: [...state.fades, action.payload] };
    
    case 'UPDATE_FADE':
      return {
        ...state,
        fades: state.fades.map(fade =>
          fade.id === action.payload.id ? action.payload : fade
        ),
      };
    
    case 'SET_DISCOVER_CONVERSATIONS':
      return { ...state, discoverConversations: action.payload };
    
    case 'SET_DISCOVER_FADES':
      return { ...state, discoverFades: action.payload };
    
    case 'SET_NOTEBOOK':
      return { ...state, notebook: action.payload };
    
    case 'ADD_TO_NOTEBOOK':
      return { ...state, notebook: [...state.notebook, action.payload] };
    
    case 'REMOVE_FROM_NOTEBOOK':
      return {
        ...state,
        notebook: state.notebook.filter(item => item.id !== action.payload),
      };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: new Set([...state.typingUsers, action.payload]),
      };
    
    case 'REMOVE_TYPING_USER':
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.delete(action.payload);
      return { ...state, typingUsers: newTypingUsers };
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    default:
      return state;
  }
};

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { isConnected, onEvent, offEvent } = useSocket();
  const { user } = useAuth();

  const setActiveTab = (tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  // Update connection status
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected });
  }, [isConnected]);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      // Handle new message - update conversation or fade
      console.log('New message received:', message);
    };

    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.isTyping) {
        dispatch({ type: 'ADD_TYPING_USER', payload: data.userId });
      } else {
        dispatch({ type: 'REMOVE_TYPING_USER', payload: data.userId });
      }
    };

    const handleError = (error: string) => {
      console.error('Socket error:', error);
    };

    // Set up event listeners
    onEvent('new-message', handleNewMessage);
    onEvent('user-typing', handleUserTyping);
    onEvent('error', handleError);

    // Cleanup
    return () => {
      offEvent('new-message', handleNewMessage);
      offEvent('user-typing', handleUserTyping);
      offEvent('error', handleError);
    };
  }, [onEvent, offEvent]);

  // Sync user from auth context
  useEffect(() => {
    const previousUserId = state.user?.id;
    const currentUserId = user?.id;
    
    // Check if user has changed (login/logout/switching users)
    const userChanged = previousUserId !== currentUserId;
    
    dispatch({ type: 'SET_USER', payload: user });
    
    // Clear all app state when user changes or logs out
    if (!user || userChanged) {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
      dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
      dispatch({ type: 'SET_FADES', payload: [] });
      dispatch({ type: 'SET_DISCOVER_CONVERSATIONS', payload: [] });
      dispatch({ type: 'SET_DISCOVER_FADES', payload: [] });
      dispatch({ type: 'SET_NOTEBOOK', payload: [] });
      dispatch({ type: 'SET_TYPING_USERS', payload: new Set() });
    }
  }, [user, state.user]);

  return (
    <AppContext.Provider value={{ state, dispatch, activeTab: state.activeTab, setActiveTab }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
