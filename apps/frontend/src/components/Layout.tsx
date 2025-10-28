import React from 'react';
import { useApp } from '../context/AppContext';
import type { TabType } from '../types';
import { 
  MessageCircle, 
  Search, 
  Clock,
  BookOpen, 
  User, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'chats', label: 'Chats', icon: <MessageCircle size={20} /> },
  { id: 'discover', label: 'Discover', icon: <Search size={20} /> },
  { id: 'fades', label: 'Fades', icon: <Clock size={20} /> },
  { id: 'notebook', label: 'Notebook', icon: <BookOpen size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, activeTab, setActiveTab } = useApp();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Hive</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection status */}
            <div className="flex items-center space-x-1 text-sm">
              {state.isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
            
            {/* User avatar */}
            {state.user && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <img
                  src={state.user.avatar || `https://ui-avatars.com/api/?name=${state.user.name}&background=0ea5e9&color=fff`}
                  alt={state.user.name}
                  className="w-8 h-8 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Navigation tabs */}
          <nav className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
