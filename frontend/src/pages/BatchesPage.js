import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, Select, MenuItem, TableSortLabel, TablePagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getActiveBatches, createBatch, updateBatch, deleteBatch, getConfigurableOptions } from '../services/api';
import { useAuth } from '../utils/AuthContext';

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
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('batch_id');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteBatchId, setDeleteBatchId] = useState(null);
    const navigate = useNavigate();
    const { authState } = useAuth();

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

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };

    const descendingComparator = (a, b, orderBy) => {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }
        if (b[orderBy] > a[orderBy]) {
            return 1;
        }
        return 0;
    };

    const getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleConfirmDeleteOpen = (id) => {
        setDeleteBatchId(id);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDeleteClose = () => {
        setDeleteBatchId(null);
        setConfirmDeleteOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteBatchId) {
            await handleDelete(deleteBatchId);
        }
        handleConfirmDeleteClose();
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
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'batch_id'}
                                    direction={orderBy === 'batch_id' ? order : 'asc'}
                                    onClick={() => handleRequestSort('batch_id')}
                                >
                                    Batch ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'strength'}
                                    direction={orderBy === 'strength' ? order : 'asc'}
                                    onClick={() => handleRequestSort('strength')}
                                >
                                    Strength
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'stream'}
                                    direction={orderBy === 'stream' ? order : 'asc'}
                                    onClick={() => handleRequestSort('stream')}
                                >
                                    Stream
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'program'}
                                    direction={orderBy === 'program' ? order : 'asc'}
                                    onClick={() => handleRequestSort('program')}
                                >
                                    Program
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'class_teacher'}
                                    direction={orderBy === 'class_teacher' ? order : 'asc'}
                                    onClick={() => handleRequestSort('class_teacher')}
                                >
                                    Class Teacher
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stableSort(batches, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((batch) => (
                                <TableRow key={batch.id}>
                                    <TableCell>{batch.batch_id}</TableCell>
                                    <TableCell>{batch.strength}</TableCell>
                                    <TableCell>{batch.stream}</TableCell>
                                    <TableCell>{batch.program}</TableCell>
                                    <TableCell>{batch.class_teacher}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" onClick={() => handleOpen(batch)}>
                                            Edit
                                        </Button>
                                        <Button variant="outlined" color="secondary" onClick={() => handleConfirmDeleteOpen(batch.id)}>
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[100]}
                component="div"
                count={batches.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth maxWidth="sm">
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

            <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose} aria-labelledby="alert-dialog-title">
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete this batch?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmDeleteClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
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