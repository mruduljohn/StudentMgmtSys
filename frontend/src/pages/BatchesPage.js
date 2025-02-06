import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getActiveBatches, createBatch, updateBatch, deleteBatch, getConfigurableOptions } from '../services/api';
import { AuthContext } from '../utils/AuthContext';

const BatchesPage = () => {
    const [batches, setBatches] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [formData, setFormData] = useState({
        batch_id: '',
        strength: '',
        stream: '',
        program: '',
        class_teacher: '',
    });
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [programs, setPrograms] = useState([]);
    const [classTeachers, setClassTeachers] = useState([]);
    const navigate = useNavigate();
    const { authState } = React.useContext(AuthContext);

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/login');
        } else {
            fetchBatches();
            fetchConfigurableOptions();
        }
    }, [authState.isAuthenticated, navigate]);

    const fetchBatches = async () => {
        try {
            const response = await getActiveBatches();
            setBatches(response.data);
        } catch (error) {
            console.error('Failed to fetch batches:', error);
            setSnackbarMessage('Failed to fetch batches');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const fetchConfigurableOptions = async () => {
        try {
            const programResponse = await getConfigurableOptions('PROGRAM');
            setPrograms(programResponse.data);

            const classTeacherResponse = await getConfigurableOptions('CLASS_TEACHER');
            setClassTeachers(classTeacherResponse.data);
        } catch (error) {
            console.error('Failed to fetch configurable options:', error);
            setSnackbarMessage('Failed to fetch configurable options');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpen = (batch) => {
        setEditingBatch(batch);
        setFormData(batch);
        setOpen(true);
    };

    const handleClose = () => {
        setEditingBatch(null);
        setFormData({
            batch_id: '',
            strength: '',
            stream: '',
            program: '',
            class_teacher: '',
        });
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatch) {
                await updateBatch(editingBatch.id, formData);
            } else {
                await createBatch(formData);
            }
            handleClose();
            fetchBatches();
            setSnackbarMessage(`${editingBatch ? 'Updated' : 'Added'} batch successfully`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to submit batch:', error);
            setSnackbarMessage('Failed to submit batch');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteBatch(id);
            fetchBatches();
            setSnackbarMessage('Deleted batch successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to delete batch:', error);
            setSnackbarMessage('Failed to delete batch');
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
                Batches
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpen(null)} style={{ marginBottom: '20px' }}>
                Add Batch
            </Button>
            {loading && <CircularProgress style={{ marginLeft: '10px' }} />}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Batch ID</TableCell>
                            <TableCell>Strength</TableCell>
                            <TableCell>Stream</TableCell>
                            <TableCell>Program</TableCell>
                            <TableCell>Class Teacher</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {batches.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell>{batch.id}</TableCell>
                                <TableCell>{batch.batch_id}</TableCell>
                                <TableCell>{batch.strength}</TableCell>
                                <TableCell>{batch.stream}</TableCell>
                                <TableCell>{batch.program}</TableCell>
                                <TableCell>{batch.class_teacher}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" color="primary" onClick={() => handleOpen(batch)}>
                                        Edit
                                    </Button>
                                    <Button variant="outlined" color="secondary" onClick={() => handleDelete(batch.id)}>
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{editingBatch ? 'Edit Batch' : 'Add Batch'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Batch ID"
                                    name="batch_id"
                                    value={formData.batch_id}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Strength"
                                    name="strength"
                                    value={formData.strength}
                                    onChange={handleChange}
                                    type="number"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Stream"
                                    name="stream"
                                    value={formData.stream}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="MEDICAL">MEDICAL</MenuItem>
                                    <MenuItem value="ENGINEERING">ENGINEERING</MenuItem>
                                    <MenuItem value="FOUNDATION">FOUNDATION</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Program"
                                    name="program"
                                    value={formData.program}
                                    onChange={handleChange}
                                    select
                                >
                                    {programs.map((program) => (
                                        <MenuItem key={program.id} value={program.value}>
                                            {program.value}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Class Teacher"
                                    name="class_teacher"
                                    value={formData.class_teacher}
                                    onChange={handleChange}
                                    select
                                >
                                    {classTeachers.map((teacher) => (
                                        <MenuItem key={teacher.id} value={teacher.value}>
                                            {teacher.value}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button type="submit" color="primary">
                                {editingBatch ? 'Update' : 'Add'}
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

export default BatchesPage;