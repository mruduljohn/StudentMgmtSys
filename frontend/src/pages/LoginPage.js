import React, { useState } from 'react';
import { Typography, TextField, Button, Paper, Grid2 as Grid, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';

const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const navigate = useNavigate();
    const { loginHandler } = React.useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form Data:', formData); // Debug log
        try {
            await loginHandler(formData);
            navigate('/students');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '50px' }}>
                <Typography variant="h5" gutterBottom align="center">
                    Login
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button type="submit" fullWidth variant="contained" color="primary">
                                Login
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default LoginPage;