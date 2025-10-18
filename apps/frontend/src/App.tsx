import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ChatsTab } from './components/ChatsTab';
import { DiscoverTab } from './components/DiscoverTab';
import { NotebookTab } from './components/NotebookTab';
import { ProfileTab } from './components/ProfileTab';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chats':
        return <ChatsTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'notebook':
        return <NotebookTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <ChatsTab />;
    }
  };

  return (
    <Layout>
      {renderActiveTab()}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
