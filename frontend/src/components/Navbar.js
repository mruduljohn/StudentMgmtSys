import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';

const Navbar = () => {
    const history = useNavigate();
    const { authState, logoutHandler } = React.useContext(AuthContext);

    const handleLogout = () => {
        logoutHandler();
        history.push('/');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu">
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" component={Link} to="/" style={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
                    Student Management System
                </Typography>
                {authState.isAuthenticated ? (
                    <Button color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                ) : (
                    <>
                        <Button color="inherit" component={Link} to="/login">
                            Login
                        </Button>
                        <Button color="inherit" component={Link} to="/register">
                            Register
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;