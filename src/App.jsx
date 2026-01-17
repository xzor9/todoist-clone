import React, { useState, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProjectsProvider from './contexts/ProjectsContext';
const Login = React.lazy(() => import('./components/Login'));
const MainLayout = React.lazy(() => import('./components/MainLayout'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));

const Loading = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>Loading...</div>;

function App() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  if (!currentUser) {
    return (
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <ThemeProvider>
        <ProjectsProvider>
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            <Dashboard activeTab={activeTab} />
          </MainLayout>
        </ProjectsProvider>
      </ThemeProvider>
    </Suspense>
  );
}

export default App;
