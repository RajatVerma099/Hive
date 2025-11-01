import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { ConversationsTab } from './components/ConversationsTab';
import { DiscoverTab } from './components/DiscoverTab';
import { FadesTab } from './components/FadesTab';
import { NotebookTab } from './components/NotebookTab';
import { ProfileTab } from './components/ProfileTab';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'conversations':
        return <ConversationsTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'fades':
        return <FadesTab />;
      case 'notebook':
        return <NotebookTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <ConversationsTab />;
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
    <AuthProvider>
      <AppProvider>
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
