import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, TableSortLabel, TablePagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStudents, updateStudent, getConfigurableOptions} from '../services/api';
import { useAuth } from '../utils/AuthContext';

const TeacherDashboard = () => {
    const [students, setStudents] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [batches, setBatches] = useState([]);
    const [classTeachers, setClassTeachers] = useState([]);
    const [programs, setPrograms] = useState([]);    
    const [hostels, setHostels] = useState([]);
            
    const [formData, setFormData] = useState({
        remarks: '',
        remarks1: '',
        remarks2: '',
        remarks3: '',
        remarks4: '',
    });
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('sl_no');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const navigate = useNavigate();
    const { authState } = useAuth();

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/login');
        } else if (authState.user.role !== 'USER') {
            navigate('/students'); // Redirect to StudentsPage if not a USER (TEACHER)
        } else {
            fetchStudents();
            fetchConfigurableOptions();
        }
    }, [authState.isAuthenticated, authState.user.role, navigate]);

    const fetchStudents = async () => {
        try {
            const response = await getStudents();
            const filteredStudents = response.data.filter(student => student.class_teacher === authState.user.username);
            setStudents(filteredStudents);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            setSnackbarMessage('Failed to fetch students');
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
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleOpen = (student) => {
        setEditingStudent(student);
        setFormData({
            remarks: student.remarks,
            remarks1: student.remarks1,
            remarks2: student.remarks2,
            remarks3: student.remarks3,
            remarks4: student.remarks4,
        });
        setOpen(true);
    };

    const handleClose = () => {
        setEditingStudent(null);
        setFormData({
            remarks: '',
            remarks1: '',
            remarks2: '',
            remarks3: '',
            remarks4: '',
        });
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedStudent = {
                ...editingStudent,
                remarks: formData.remarks,
                remarks1: formData.remarks1,
                remarks2: formData.remarks2,
                remarks3: formData.remarks3,
                remarks4: formData.remarks4,
            };
            await updateStudent(editingStudent.id, updatedStudent);
            handleClose();
            fetchStudents();
            setSnackbarMessage('Updated student successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to update student:', error);
            setSnackbarMessage('Failed to update student');
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

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Teacher Dashboard
            </Typography>
            {loading && <CircularProgress style={{ marginLeft: '10px' }} />}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'sl_no'}
                                    direction={orderBy === 'sl_no' ? order : 'asc'}
                                    onClick={() => handleRequestSort('sl_no')}
                                >
                                    Sl No
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleRequestSort('name')}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'student_id'}
                                    direction={orderBy === 'student_id' ? order : 'asc'}
                                    onClick={() => handleRequestSort('student_id')}
                                >
                                    Student ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'phone_number'}
                                    direction={orderBy === 'phone_number' ? order : 'asc'}
                                    onClick={() => handleRequestSort('phone_number')}
                                >
                                    Phone Number
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'gender'}
                                    direction={orderBy === 'gender' ? order : 'asc'}
                                    onClick={() => handleRequestSort('gender')}
                                >
                                    Gender
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
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'hostel'}
                                    direction={orderBy === 'hostel' ? order : 'asc'}
                                    onClick={() => handleRequestSort('hostel')}
                                >
                                    Hostel
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
                            <TableCell>Remarks</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stableSort(students, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.sl_no}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.student_id}</TableCell>
                                    <TableCell>{student.phone_number}</TableCell>
                                    <TableCell>{student.gender}</TableCell>
                                    <TableCell>{student.batch}</TableCell>
                                    <TableCell>{student.hostel}</TableCell>
                                    <TableCell>{student.stream}</TableCell>
                                    <TableCell>{student.program}</TableCell>
                                    <TableCell>
                                        <TextField
                                            variant="outlined"
                                            fullWidth
                                            label="Remarks"
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            multiline
                                            rows={2}
                                            disabled={!open || editingStudent?.id !== student.id}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" onClick={() => handleOpen(student)}>
                                            Edit Remarks
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
                count={students.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth maxWidth="md">
                <DialogTitle id="form-dialog-title">Edit Remarks</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Student ID"
                                    name="student_id"
                                    value={editingStudent?.student_id}
                                    onChange={handleChange}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={editingStudent?.name}
                                    onChange={handleChange}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Batch"
                                    name="batch"
                                    value={editingStudent?.batch}
                                    onChange={handleChange}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Remarks"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Remarks 1"
                                    name="remarks1"
                                    value={formData.remarks1}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Remarks 2"
                                    name="remarks2"
                                    value={formData.remarks2}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Remarks 3"
                                    name="remarks3"
                                    value={formData.remarks3}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Remarks 4"
                                    name="remarks4"
                                    value={formData.remarks4}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button type="submit" color="primary">
                                Update Remarks
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

export default TeacherDashboard;