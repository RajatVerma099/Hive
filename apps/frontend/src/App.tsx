import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { ChatsView } from './components/ChatsView';
import { NotebookTab } from './components/NotebookTab';
import { ProfileTab } from './components/ProfileTab';

const AppContent: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  return (
    <>
      <Layout 
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotebook={() => setIsNotebookOpen(true)}
      >
        <ChatsView />
      </Layout>
      <ProfileTab 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      <NotebookTab 
        isOpen={isNotebookOpen} 
        onClose={() => setIsNotebookOpen(false)} 
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
