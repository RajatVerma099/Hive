import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, User, Conversation, Fade, Notebook, TabType } from '../types';
import { useSocket } from '../hooks/useSocket';

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'SET_FADES'; payload: Fade[] }
  | { type: 'ADD_FADE'; payload: Fade }
  | { type: 'UPDATE_FADE'; payload: Fade }
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
  conversations: [],
  fades: [],
  notebook: [],
  isConnected: false,
  typingUsers: new Set(),
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
  const [activeTab, setActiveTab] = React.useState<TabType>('chats');
  const { isConnected, onEvent, offEvent } = useSocket();

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

  // Mock user for development
  useEffect(() => {
    const mockUser: User = {
      id: '1',
      email: 'user@example.com',
      name: 'John Doe',
      displayName: 'John',
      avatar: 'https://via.placeholder.com/40',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_USER', payload: mockUser });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, activeTab, setActiveTab }}>
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
