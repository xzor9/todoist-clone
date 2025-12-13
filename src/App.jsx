import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './components/Dashboard';

function App() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');

  if (!currentUser) {
    return <Login />;
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Dashboard activeTab={activeTab} />
    </MainLayout>
  );
}

export default App;
