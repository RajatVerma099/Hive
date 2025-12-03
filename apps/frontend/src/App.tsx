import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { ChatsView } from './components/ChatsView';
import { NotebookTab } from './components/NotebookTab';
import { ProfileTab } from './components/ProfileTab';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chats':
        return <ChatsView />;
      case 'notebook':
        return <NotebookTab />;
      default:
        return <ChatsView />;
    }
  };

  return (
    <>
      <Layout onOpenProfile={() => setIsProfileOpen(true)}>
        {renderActiveTab()}
      </Layout>
      <ProfileTab 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
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
