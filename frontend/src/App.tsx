import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import ImportExport from './pages/ImportExport';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Analytics from './pages/Analytics';
import UserManagement from './pages/UserManagement';

// Stores
import { useAuthStore } from './store/authStore';
import { useStudentStore } from './store/studentStore';

// Protected route component
const ProtectedRoute: React.FC<{
  element: React.ReactNode;
  adminOnly?: boolean;
}> = ({ element, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }
  
  return <>{element}</>;
};

function App() {
  const { checkAuth } = useAuthStore();
  const studentStore = useStudentStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // First check authentication
        await checkAuth();
        
        // Then initialize student store if authenticated
        if (localStorage.getItem('token')) {
          await studentStore.init();
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, [checkAuth, studentStore]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/students" element={<ProtectedRoute element={<Students />} />} />
        <Route path="/import-export" element={<ProtectedRoute element={<ImportExport />} adminOnly />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} adminOnly />} />
        <Route path="/audit-logs" element={<ProtectedRoute element={<AuditLogs />} adminOnly />} />
        <Route path="/analytics" element={<ProtectedRoute element={<Analytics />} />} />
        <Route path="/users" element={<ProtectedRoute element={<UserManagement />} adminOnly />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;