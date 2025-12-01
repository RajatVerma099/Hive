import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { ChatsView } from './components/ChatsView';
import { NotebookTab } from './components/NotebookTab';
import { ProfileTab } from './components/ProfileTab';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chats':
        return <ChatsView />;
      case 'notebook':
        return <NotebookTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <ChatsView />;
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
