import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Conversation, Fade } from '../types';
import { 
  MessageCircle, 
  Search, 
  BookOpen, 
  Wifi, 
  WifiOff,
  Moon
} from 'lucide-react';
import { SearchOverlay } from './SearchOverlay';
import { apiService } from '../services/api';
import { useSocket } from '../hooks/useSocket';

interface LayoutProps {
  children: React.ReactNode;
  onOpenProfile: () => void;
  onOpenNotebook: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenProfile, onOpenNotebook }) => {
  const { state, dispatch } = useApp();
  const { joinConversation, leaveConversation } = useSocket();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = async (query: string | Conversation | Fade) => {
    // If query is a conversation or fade object, navigate to it
    if (typeof query !== 'string') {
      if ('expiresAt' in query) {
        // It's a fade
        try {
          // Leave current conversation/fade if switching
          if (state.currentConversation) {
            leaveConversation(state.currentConversation.id);
            dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
          }
          if (state.currentFade) {
            leaveConversation(state.currentFade.id);
          }
          
          // Fetch fresh fade data to ensure we have latest participants
          const updatedFade = await apiService.getFade(query.id) as Fade;
          const messages = await apiService.getFadeMessages(query.id) as any[];
          dispatch({ type: 'SET_CURRENT_FADE', payload: { ...updatedFade, messages } });
          joinConversation(query.id);
        } catch (error) {
          console.error('Error loading fade:', error);
        }
      } else {
        // It's a conversation
        try {
          // Leave current conversation/fade if switching
          if (state.currentFade) {
            leaveConversation(state.currentFade.id);
            dispatch({ type: 'SET_CURRENT_FADE', payload: null });
          }
          if (state.currentConversation) {
            leaveConversation(state.currentConversation.id);
          }
          
          // Fetch fresh conversation data to ensure we have latest participants
          const updatedConversation = await apiService.getConversation(query.id) as Conversation;
          const messages = await apiService.getMessages(query.id) as any[];
          dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: { ...updatedConversation, messages } });
          joinConversation(query.id);
        } catch (error) {
          console.error('Error loading conversation:', error);
        }
      }
      setIsSearchOpen(false);
    } else {
      // It's a search query string
      console.log('Search:', query);
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-white border-gray-200 rounded-xl shadow-lg border px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Hive</h1>
            </div>
            
            {/* Center - Search Bar */}
            <div className="flex items-center space-x-1 flex-1 max-w-md mx-4">
              <div
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 w-full cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg"
                title="Search"
              >
                <Search size={18} />
                <span className="font-medium text-sm text-left flex-1">Search Hive</span>
              </div>
            </div>
            
            {/* Right side - Status and Actions */}
            <div className="flex items-center space-x-3">
              {/* Connection status */}
              <div className="flex items-center space-x-1 text-sm rounded-xl px-3 py-2 bg-gray-50">
                {state.isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-red-600">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  // Placeholder for future dark mode implementation
                }}
                className="p-2 rounded-full transition-colors text-gray-700 hover:bg-gray-50"
                title="Dark Mode"
              >
                <Moon size={20} />
              </button>
              
              {/* Notebook button */}
              <button
                onClick={onOpenNotebook}
                className="p-2 rounded-full transition-colors text-gray-700 hover:bg-gray-50"
                title="Notebook"
              >
                <BookOpen size={20} />
              </button>
              
              {/* User avatar - clickable for profile */}
              {state.user && (
                <button
                  onClick={onOpenProfile}
                  className="p-1 rounded-full transition-colors hover:bg-gray-50"
                  title="Profile"
                >
                  <img
                    src={state.user.avatar || `https://ui-avatars.com/api/?name=${state.user.name}&background=0ea5e9&color=fff`}
                    alt={state.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
      />

      {/* Main content area - Full screen with padding for floating header */}
      <main className="pt-24 px-4 h-full overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
