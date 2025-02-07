import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, Select, MenuItem, TableSortLabel, TablePagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getActiveHostels, createHostel, updateHostel, deleteHostel, getConfigurableOptions } from '../services/api';
import { AuthContext, useAuth } from '../utils/AuthContext';

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
    const [batches, setBatches] = useState([]); // Define setBatches
    const [programs, setPrograms] = useState([]); // Define setPrograms
    const [classTeachers, setClassTeachers] = useState([]); // Define setClassTeachers
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('hostel_name');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteHostelId, setDeleteHostelId] = useState(null);
    const navigate = useNavigate();
    const { authState } = useAuth();

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/login');
        } else {
            fetchHostels();
            fetchConfigurableOptions();
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

    const fetchConfigurableOptions = async () => {
        try {
            const batchResponse = await getConfigurableOptions('BATCH');
            setBatches(batchResponse.data);

            const hostelResponse = await getConfigurableOptions('HOSTEL');
            setHostels(hostelResponse.data);

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
        setDeleteHostelId(id);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDeleteClose = () => {
        setDeleteHostelId(null);
        setConfirmDeleteOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteHostelId) {
            await handleDelete(deleteHostelId);
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
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'hostel_name'}
                                    direction={orderBy === 'hostel_name' ? order : 'asc'}
                                    onClick={() => handleRequestSort('hostel_name')}
                                >
                                    Hostel Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'capacity'}
                                    direction={orderBy === 'capacity' ? order : 'asc'}
                                    onClick={() => handleRequestSort('capacity')}
                                >
                                    Capacity
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'filled_count'}
                                    direction={orderBy === 'filled_count' ? order : 'asc'}
                                    onClick={() => handleRequestSort('filled_count')}
                                >
                                    Filled Count
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'vacancy'}
                                    direction={orderBy === 'vacancy' ? order : 'asc'}
                                    onClick={() => handleRequestSort('vacancy')}
                                >
                                    Vacancy
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'gender_type'}
                                    direction={orderBy === 'gender_type' ? order : 'asc'}
                                    onClick={() => handleRequestSort('gender_type')}
                                >
                                    Gender Type
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stableSort(hostels, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((hostel) => (
                                <TableRow key={hostel.id}>
                                    <TableCell>{hostel.hostel_name}</TableCell>
                                    <TableCell>{hostel.capacity}</TableCell>
                                    <TableCell>{hostel.filled_count}</TableCell>
                                    <TableCell>{hostel.vacancy}</TableCell>
                                    <TableCell>{hostel.gender_type}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" onClick={() => handleOpen(hostel)}>
                                            Edit
                                        </Button>
                                        <Button variant="outlined" color="secondary" onClick={() => handleConfirmDeleteOpen(hostel.id)}>
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
                count={hostels.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth maxWidth="md">
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

            <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose} aria-labelledby="alert-dialog-title">
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete this hostel?
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

export default HostelsPage;