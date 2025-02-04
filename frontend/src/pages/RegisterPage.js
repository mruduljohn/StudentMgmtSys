import React, { useState } from 'react';
import { Typography, TextField, Button, Paper,Grid2 as Grid, Container } from '@mui/material';
// import { Grid } from '@mui/material/Grid2';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'admin' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '50px' }}>
                <Typography variant="h5" gutterBottom align="center">
                    Register
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid   xs={12}>
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
                        <Grid   xs={12}>
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
                        <Grid   xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                label="Role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid   xs={12}>
                            <Button type="submit" fullWidth variant="contained" color="primary">
                                Register
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default RegisterPage;