import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import AppRouter from './router/AppRouter';
import { useScheduledLaunches } from './hooks/useScheduledLaunches';

function App() {
  // Initialize scheduled launches background service
  useScheduledLaunches();
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <div className="min-h-screen bg-gray-50">
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