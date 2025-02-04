import React, { createContext, useState, useEffect } from 'react';
import { login, setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        if (token && userString) {
            try {
                const user = JSON.parse(userString);
                setAuthToken(token);
                setAuthState({ isAuthenticated: true, user });
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setAuthToken(null);
                setAuthState({ isAuthenticated: false, user: null });
            }
        }
    }, []);

    const loginHandler = async (userData) => {
        try {
            console.log('Logging in with data:', userData); // Debug log
            const response = await login(userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setAuthToken(token);
            setAuthState({ isAuthenticated: true, user });
        } catch (error) {
            console.error('Login failed:', error.response ? error.response.data : error.message);
        }
    };

    const logoutHandler = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthToken(null);
        setAuthState({ isAuthenticated: false, user: null });
    };

    return (
        <AuthContext.Provider value={{ authState, loginHandler, logoutHandler }}>
            {children}
        </AuthContext.Provider>
    );
};