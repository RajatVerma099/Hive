import React from 'react';
import { useApp } from '../context/AppContext';
import type { TabType } from '../types';
import { 
  MessageCircle, 
  Search, 
  Clock,
  BookOpen, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const floatingTabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'chats', label: 'Chats', icon: <MessageCircle size={24} /> },
  { id: 'discover', label: 'Discover', icon: <Search size={24} /> },
  { id: 'fades', label: 'Fades', icon: <Clock size={24} /> },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, activeTab, setActiveTab } = useApp();

  return (
    <div className="h-screen bg-gray-50">
      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Hive</h1>
            </div>
            
            {/* Center - Navigation Tabs */}
            <div className="flex items-center space-x-1">
              {floatingTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={tab.label}
                >
                  {tab.icon}
                  <span className="font-medium text-sm hidden sm:block">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Right side - Status and Actions */}
            <div className="flex items-center space-x-3">
              {/* Connection status */}
              <div className="flex items-center space-x-1 text-sm bg-gray-50 rounded-xl px-3 py-2">
                {state.isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* Notebook button */}
              <button
                onClick={() => setActiveTab('notebook')}
                className={`p-2 rounded-full transition-colors ${
                  activeTab === 'notebook'
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Notebook"
              >
                <BookOpen size={20} />
              </button>
              
              {/* User avatar - clickable for profile */}
              {state.user && (
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`p-1 rounded-full transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary-50 border-2 border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
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

      {/* Main content area - Full screen with padding for floating header */}
      <main className="pt-24 px-4 h-full overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
