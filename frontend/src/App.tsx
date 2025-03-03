import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Mentors from './pages/Mentors';
import ImportExport from './pages/ImportExport';
import Settings from './pages/Settings';

// Auth store
import { useAuthStore } from './store/authStore';

// Protected route component
const ProtectedRoute: React.FC<{
  element: React.ReactNode;
  adminOnly?: boolean;
}> = ({ element, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <>{element}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/students" element={<ProtectedRoute element={<Students />} />} />
        <Route path="/mentors" element={<ProtectedRoute element={<Mentors />} adminOnly />} />
        <Route path="/import-export" element={<ProtectedRoute element={<ImportExport />} adminOnly />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} adminOnly />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;