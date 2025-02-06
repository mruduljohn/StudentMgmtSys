import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getActiveHostels, createHostel, updateHostel, deleteHostel, getConfigurableOptions } from '../services/api';
import { AuthContext } from '../utils/AuthContext';

const HostelsPage = () => {
    const [hostels, setHostels] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingHostel, setEditingHostel] = useState(null);
    const [formData, setFormData] = useState({
        hostel_name: '',
        capacity: '',
        gender_type: '',
    });
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const navigate = useNavigate();
    const { authState } = React.useContext(AuthContext);

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/login');
        } else {
            fetchHostels();
        }
    }, [authState.isAuthenticated, navigate]);

    const fetchHostels = async () => {
        try {
            const response = await getActiveHostels();
            setHostels(response.data);
        } catch (error) {
            console.error('Failed to fetch hostels:', error);
            setSnackbarMessage('Failed to fetch hostels');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpen = (hostel) => {
        setEditingHostel(hostel);
        setFormData(hostel);
        setOpen(true);
    };

    const handleClose = () => {
        setEditingHostel(null);
        setFormData({
            hostel_name: '',
            capacity: '',
            gender_type: '',
        });
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHostel) {
                await updateHostel(editingHostel.id, formData);
            } else {
                await createHostel(formData);
            }
            handleClose();
            fetchHostels();
            setSnackbarMessage(`${editingHostel ? 'Updated' : 'Added'} hostel successfully`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to submit hostel:', error);
            setSnackbarMessage('Failed to submit hostel');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteHostel(id);
            fetchHostels();
            setSnackbarMessage('Deleted hostel successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to delete hostel:', error);
            setSnackbarMessage('Failed to delete hostel');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Hostels
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpen(null)} style={{ marginBottom: '20px' }}>
                Add Hostel
            </Button>
            {loading && <CircularProgress style={{ marginLeft: '10px' }} />}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Hostel Name</TableCell>
                            <TableCell>Capacity</TableCell>
                            <TableCell>Filled Count</TableCell>
                            <TableCell>Vacancy</TableCell>
                            <TableCell>Gender Type</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {hostels.map((hostel) => (
                            <TableRow key={hostel.id}>
                                <TableCell>{hostel.id}</TableCell>
                                <TableCell>{hostel.hostel_name}</TableCell>
                                <TableCell>{hostel.capacity}</TableCell>
                                <TableCell>{hostel.filled_count}</TableCell>
                                <TableCell>{hostel.vacancy}</TableCell>
                                <TableCell>{hostel.gender_type}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" color="primary" onClick={() => handleOpen(hostel)}>
                                        Edit
                                    </Button>
                                    <Button variant="outlined" color="secondary" onClick={() => handleDelete(hostel.id)}>
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{editingHostel ? 'Edit Hostel' : 'Add Hostel'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Hostel Name"
                                    name="hostel_name"
                                    value={formData.hostel_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Capacity"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    type="number"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Gender Type"
                                    name="gender_type"
                                    value={formData.gender_type}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="BOYS">BOYS</MenuItem>
                                    <MenuItem value="GIRLS">GIRLS</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button type="submit" color="primary">
                                {editingHostel ? 'Update' : 'Add'}
                            </Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default HostelsPage;