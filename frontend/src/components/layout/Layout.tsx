import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { observer } from 'mobx-react-lite';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = observer(() => {
  const location = useLocation();
  const { user, loading } = useAuthStore();

  // Wait for auth check to complete
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
      
      {/* Global Toast Notification */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#333333',
            boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
            padding: '16px',
            borderRadius: '8px',
          },
          success: {
            icon: '✅',
            style: {
              border: '1px solid #10B981',
              borderLeft: '5px solid #10B981'
            }
          },
          error: {
            icon: '❌',
            style: {
              border: '1px solid #EF4444',
              borderLeft: '5px solid #EF4444'
            }
          },
          loading: {
            icon: '🔄',
            style: {
              border: '1px solid #3B82F6',
              borderLeft: '5px solid #3B82F6'
            }
          }
        }}
      />
    </div>
  );
});

export default Layout;