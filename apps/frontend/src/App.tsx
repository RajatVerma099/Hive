import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { checkAuth } from './store/thunks/authThunks';
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
  useEffect(() => {
    // Check authentication on app load
    store.dispatch(checkAuth());
  }, []);

  return (
    <Provider store={store}>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </Provider>
  );
}

export default App;
