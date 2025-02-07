import React, { createContext, useContext, useState, useEffect } from 'react';
import { login } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthState({ isAuthenticated: true, user: JSON.parse(localStorage.getItem('user')) });
        }
    }, []);

    const loginHandler = async (userData) => {
        try {
            const response = await login(userData);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setAuthState({ isAuthenticated: true, user: response.data.user });
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const logoutHandler = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({ isAuthenticated: false, user: null });
    };

    return (
        <AuthContext.Provider value={{ authState, loginHandler, logoutHandler }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);