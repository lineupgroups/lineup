import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import AppRouter from './router/AppRouter';
import { useScheduledLaunches } from './hooks/useScheduledLaunches';
import NetworkErrorPage from './components/common/NetworkErrorPage';

function App() {
  // Initialize scheduled launches background service
  useScheduledLaunches();
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <div className="min-h-screen bg-gray-50">
            {isOffline && <NetworkErrorPage />}
            <AppRouter />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                },
                error: {
                  duration: 5000,
                },
              }}
            />
          </div>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;