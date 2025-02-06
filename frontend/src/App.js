import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/batches" element={<BatchesPage />} />
                    <Route path="/hostels" element={<HostelsPage />} />
                    <Route path="/programs" element={<ProgramsPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;