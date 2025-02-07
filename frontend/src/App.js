import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext'; // Ensure useAuth is imported
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage'; // New Dashboard Page
import StudentsPage from './pages/StudentsPage';
import BatchesPage from './pages/BatchesPage';
import HostelsPage from './pages/HostelsPage';
import ProgramsPage from './pages/ProgramsPage';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/students" element={<PrivateRoute><StudentsPage /></PrivateRoute>} />
                    <Route path="/batches" element={<PrivateRoute><BatchesPage /></PrivateRoute>} />
                    <Route path="/hostels" element={<PrivateRoute><HostelsPage /></PrivateRoute>} />
                    <Route path="/programs" element={<PrivateRoute><ProgramsPage /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" />} /> {/* Redirect to Dashboard for unknown routes */}
                </Routes>
            </Router>
        </AuthProvider>
    );
};

const PrivateRoute = ({ children }) => {
    const { authState } = useAuth(); // Ensure useAuth is used
    return authState.isAuthenticated ? children : <Navigate to="/login" />;
};

export default App;