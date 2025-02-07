import React from 'react';
import { Typography, Button, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Box mt={2}>
                <Button variant="contained" color="primary" onClick={() => navigate('/students')} style={{ marginRight: '10px' }}>
                    Manage Students
                </Button>
                <Button variant="contained" color="secondary" onClick={() => navigate('/batches')} style={{ marginRight: '10px' }}>
                    Manage Batches
                </Button>
                <Button variant="contained" color="success" onClick={() => navigate('/hostels')} style={{ marginRight: '10px' }}>
                    Manage Hostels
                </Button>
                <Button variant="contained" color="warning" onClick={() => navigate('/programs')}>
                    Manage Programs
                </Button>
            </Box>
        </Container>
    );
};

export default DashboardPage;