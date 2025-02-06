import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getActivePrograms, createProgram, updateProgram, deleteProgram } from '../services/api';
import { AuthContext } from '../utils/AuthContext';

const ProgramsPage = () => {
    const [programs, setPrograms] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [formData, setFormData] = useState({
        program_name: '',
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
            fetchPrograms();
        }
    }, [authState.isAuthenticated, navigate]);

    const fetchPrograms = async () => {
        try {
            const response = await getActivePrograms();
            setPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            setSnackbarMessage('Failed to fetch programs');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpen = (program) => {
        setEditingProgram(program);
        setFormData(program);
        setOpen(true);
    };

    const handleClose = () => {
        setEditingProgram(null);
        setFormData({
            program_name: '',
        });
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProgram) {
                await updateProgram(editingProgram.id, formData);
            } else {
                await createProgram(formData);
            }
            handleClose();
            fetchPrograms();
            setSnackbarMessage(`${editingProgram ? 'Updated' : 'Added'} program successfully`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to submit program:', error);
            setSnackbarMessage('Failed to submit program');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProgram(id);
            fetchPrograms();
            setSnackbarMessage('Deleted program successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to delete program:', error);
            setSnackbarMessage('Failed to delete program');
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
                Programs
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpen(null)} style={{ marginBottom: '20px' }}>
                Add Program
            </Button>
            {loading && <CircularProgress style={{ marginLeft: '10px' }} />}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Program Name</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {programs.map((program) => (
                            <TableRow key={program.id}>
                                <TableCell>{program.id}</TableCell>
                                <TableCell>{program.value}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" color="primary" onClick={() => handleOpen(program)}>
                                        Edit
                                    </Button>
                                    <Button variant="outlined" color="secondary" onClick={() => handleDelete(program.id)}>
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{editingProgram ? 'Edit Program' : 'Add Program'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Program Name"
                                    name="program_name"
                                    value={formData.program_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button type="submit" color="primary">
                                {editingProgram ? 'Update' : 'Add'}
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

export default ProgramsPage;