import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
    const { authState, logoutHandler } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutHandler();
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" style={{ flexGrow: 1 }}>
                    Student Management System
                </Typography>
                {authState.isAuthenticated ? (
                    <>
                        <Button color="inherit" onClick={() => navigate('/')}>
                            Home
                        </Button>
                        {authState.user.role === 'ADMIN' && (
                            <>
                                <Button color="inherit" onClick={() => navigate('/students')}>
                                    Students
                                </Button>
                                <Button color="inherit" onClick={() => navigate('/batches')}>
                                    Batches
                                </Button>
                                <Button color="inherit" onClick={() => navigate('/hostels')}>
                                    Hostels
                                </Button>
                                <Button color="inherit" onClick={() => navigate('/programs')}>
                                    Programs
                                </Button>
                                <Button color="inherit" onClick={() => navigate('/teachers')}>
                                    Teachers
                                </Button>
                            </>
                        )}
                        {authState.user.role === 'USER' && (
                            <Button color="inherit" onClick={() => navigate('/')}>
                                Dashboard
                            </Button>
                        )}
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>
                    </>
                ) : (
                    <Button color="inherit" onClick={() => navigate('/login')}>
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;