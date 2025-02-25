import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, Select, MenuItem, TableSortLabel, TablePagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getConfigurableOptions, addConfigurableOption, deactivateConfigurableOption, updateConfigurableOption } from '../services/api';
import { useAuth } from '../utils/AuthContext';

const TeachersPage = () => {
    const [teachers, setTeachers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        teacher_name: '',
        batch: '',
    });
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [batches, setBatches] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('teacher_name');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTeacherId, setDeleteTeacherId] = useState(null);
    const navigate = useNavigate();
    const { authState } = useAuth();

    useEffect(() => {
        if (!authState.isAuthenticated || authState.user.role !== 'ADMIN') {
            navigate('/login');
        } else {
            fetchTeachers();
            fetchConfigurableOptions();
        }
    }, [authState.isAuthenticated, authState.user.role, navigate]);

    const fetchTeachers = async () => {
        try {
            const response = await getConfigurableOptions('CLASS_TEACHER');
            setTeachers(response.data);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
            setSnackbarMessage('Failed to fetch teachers');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const fetchConfigurableOptions = async () => {
        try {
            const batchResponse = await getConfigurableOptions('BATCH');
            setBatches(batchResponse.data);
        } catch (error) {
            console.error('Failed to fetch configurable options:', error);
            setSnackbarMessage('Failed to fetch configurable options');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleOpen = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            teacher_name: teacher?.value || '',
            batch: teacher?.batch || '',
        });
        setOpen(true);
    };

    const handleClose = () => {
        setEditingTeacher(null);
        setFormData({
            teacher_name: '',
            batch: '',
        });
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTeacher) {
                await updateConfigurableOption(editingTeacher.id, formData);
            } else {
                await addConfigurableOption('CLASS_TEACHER', formData.teacher_name, formData.batch);
            }
            handleClose();
            fetchTeachers();
            setSnackbarMessage(`${editingTeacher ? 'Updated' : 'Added'} teacher successfully`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to submit teacher:', error);
            setSnackbarMessage('Failed to submit teacher');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deactivateConfigurableOption(id);
            fetchTeachers();
            setSnackbarMessage('Deactivated teacher successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to deactivate teacher:', error);
            setSnackbarMessage('Failed to deactivate teacher');
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
        setDeleteTeacherId(id);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDeleteClose = () => {
        setDeleteTeacherId(null);
        setConfirmDeleteOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteTeacherId) {
            await handleDelete(deleteTeacherId);
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
                Teachers
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpen(null)} style={{ marginBottom: '20px' }}>
                Add Teacher
            </Button>
            {loading && <CircularProgress style={{ marginLeft: '10px' }} />}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'teacher_name'}
                                    direction={orderBy === 'teacher_name' ? order : 'asc'}
                                    onClick={() => handleRequestSort('teacher_name')}
                                >
                                    Teacher Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'batch'}
                                    direction={orderBy === 'batch' ? order : 'asc'}
                                    onClick={() => handleRequestSort('batch')}
                                >
                                    Batch
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stableSort(teachers, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell>{teacher.value}</TableCell>
                                    <TableCell>{teacher.batch}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" onClick={() => handleOpen(teacher)}>
                                            Edit
                                        </Button>
                                        <Button variant="outlined" color="secondary" onClick={() => handleConfirmDeleteOpen(teacher.id)}>
                                            Deactivate
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
                count={teachers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth maxWidth="sm">
                <DialogTitle id="form-dialog-title">{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Teacher Name"
                                    name="teacher_name"
                                    value={formData.teacher_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Batch"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleChange}
                                    select
                                >
                                    {batches.map((batch) => (
                                        <MenuItem key={batch.id} value={batch.value}>
                                            {batch.value}
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
                                {editingTeacher ? 'Update' : 'Add'}
                            </Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose} aria-labelledby="alert-dialog-title">
                <DialogTitle id="alert-dialog-title">{"Confirm Deactivation"}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to deactivate this teacher?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmDeleteClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
                        Deactivate
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

export default TeachersPage;