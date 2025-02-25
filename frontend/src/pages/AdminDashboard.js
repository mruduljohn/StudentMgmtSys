import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress, Snackbar, Alert, Select, MenuItem, TableSortLabel, TablePagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStudents, getConfigurableOptions, updateStudent,createStudent,deleteStudent } from '../services/api';
import { useAuth } from '../utils/AuthContext';

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        student_id: '',
        phone_number: '',
        gender: '',
        batch: '',
        class_teacher: '',
        hostel: '',
        stream: '',
        program: '',
        study_material: '',
        uniform: '',
        id_card: '',
        tab: '',
        joined_status: '',
        syllabus: '',
        plus_two_percentage: '',
        neet_score: '',
        remarks: '',
        remarks1: '',
        remarks2: '',
        remarks3: '',
        remarks4: '',
        fee_due: '',
        flag1: false,
        flag2: false,
        flag3: false,
        flag4: false,
    });
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [batches, setBatches] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [classTeachers, setClassTeachers] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('sl_no');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteStudentId, setDeleteStudentId] = useState(null);
    const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
    const [updateStudentId, setUpdateStudentId] = useState(null);
    const navigate = useNavigate();
    const { authState } = useAuth();

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/login');
        } else {
            fetchStudents();
            fetchConfigurableOptions();
        }
    }, [authState.isAuthenticated, navigate]);

    const fetchStudents = async () => {
        try {
            const response = await getStudents();
            setStudents(response.data);
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
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleOpen = (student) => {
        setEditingStudent(student);
        setFormData(student);
        setOpen(true);
    };

    const handleClose = () => {
        setEditingStudent(null);
        setFormData({
            name: '',
            student_id: '',
            phone_number: '',
            gender: '',
            batch: '',
            class_teacher: '',
            hostel: '',
            stream: '',
            program: '',
            study_material: '',
            uniform: '',
            id_card: '',
            tab: '',
            joined_status: '',
            syllabus: '',
            plus_two_percentage: '',
            neet_score: '',
            remarks: '',
            remarks1: '',
            remarks2: '',
            remarks3: '',
            remarks4: '',
            fee_due: '',
            flag1: false,
            flag2: false,
            flag3: false,
            flag4: false,
        });
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                await updateStudent(editingStudent.id, formData);
            } else {
                await createStudent(formData);
            }
            handleClose();
            fetchStudents();
            setSnackbarMessage(`${editingStudent ? 'Updated' : 'Added'} student successfully`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to submit student:', error);
            setSnackbarMessage('Failed to submit student');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteStudent(id);
            fetchStudents();
            setSnackbarMessage('Deleted student successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to delete student:', error);
            setSnackbarMessage('Failed to delete student');
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
        setDeleteStudentId(id);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDeleteClose = () => {
        setDeleteStudentId(null);
        setConfirmDeleteOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteStudentId) {
            await handleDelete(deleteStudentId);
        }
        handleConfirmDeleteClose();
    };

    const handleConfirmUpdateOpen = (id) => {
        setUpdateStudentId(id);
        setConfirmUpdateOpen(true);
    };

    const handleConfirmUpdateClose = () => {
        setUpdateStudentId(null);
        setConfirmUpdateOpen(false);
    };

    const handleConfirmUpdate = async () => {
        if (updateStudentId) {
            await updateStudent(updateStudentId, formData);
        }
        handleConfirmUpdateClose();
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
                Admin Dashboard
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpen(null)} style={{ marginBottom: '20px' }}>
                Add Student
            </Button>
            <Button variant="contained" color="success" onClick={() => navigate('/batches')} style={{ marginBottom: '20px', marginLeft: '10px' }}>
                Manage Batches
            </Button>
            <Button variant="contained" color="info" onClick={() => navigate('/hostels')} style={{ marginBottom: '20px', marginLeft: '10px' }}>
                Manage Hostels
            </Button>
            <Button variant="contained" color="warning" onClick={() => navigate('/programs')} style={{ marginBottom: '20px', marginLeft: '10px' }}>
                Manage Programs
            </Button>
            <Button variant="contained" color="error" onClick={() => navigate('/teachers')} style={{ marginBottom: '20px', marginLeft: '10px' }}>
                Manage Teachers
            </Button>
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
                                    active={orderBy === 'class_teacher'}
                                    direction={orderBy === 'class_teacher' ? order : 'asc'}
                                    onClick={() => handleRequestSort('class_teacher')}
                                >
                                    Class Teacher
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
                                    <TableCell>{student.class_teacher}</TableCell>
                                    <TableCell>{student.hostel}</TableCell>
                                    <TableCell>{student.stream}</TableCell>
                                    <TableCell>{student.program}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" onClick={() => handleOpen(student)}>
                                            Edit
                                        </Button>
                                        <Button variant="outlined" color="secondary" onClick={() => handleConfirmDeleteOpen(student.id)}>
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
                count={students.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth maxWidth="md">
                <DialogTitle id="form-dialog-title">{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Student ID"
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Phone Number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="MALE">MALE</MenuItem>
                                    <MenuItem value="FEMALE">FEMALE</MenuItem>
                                    <MenuItem value="DIFFERENT">DIFFERENT</MenuItem>
                                </TextField>
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
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Hostel"
                                    name="hostel"
                                    value={formData.hostel}
                                    onChange={handleChange}
                                    select
                                >
                                    {hostels.map((hostel) => (
                                        <MenuItem key={hostel.id} value={hostel.value}>
                                            {hostel.value}
                                        </MenuItem>
                                    ))}
                                </TextField>
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
                                    fullWidth
                                    label="Study Material"
                                    name="study_material"
                                    value={formData.study_material}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Uniform"
                                    name="uniform"
                                    value={formData.uniform}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="ID Card"
                                    name="id_card"
                                    value={formData.id_card}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Tab"
                                    name="tab"
                                    value={formData.tab}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Joined Status"
                                    name="joined_status"
                                    value={formData.joined_status}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="ALLOTED">ALLOTED</MenuItem>
                                    <MenuItem value="JOINING SOON">JOINING SOON</MenuItem>
                                    <MenuItem value="JOINED">JOINED</MenuItem>
                                    <MenuItem value="NOT JOINING">NOT JOINING</MenuItem>
                                    <MenuItem value="VACATED">VACATED</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Syllabus"
                                    name="syllabus"
                                    value={formData.syllabus}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="STATE">STATE</MenuItem>
                                    <MenuItem value="CBSE">CBSE</MenuItem>
                                    <MenuItem value="ICSC">ICSC</MenuItem>
                                    <MenuItem value="OTHERS">OTHERS</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Percentage of +2 Marks"
                                    name="plus_two_percentage"
                                    value={formData.plus_two_percentage}
                                    onChange={handleChange}
                                    type="number"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        min: 0,
                                        max: 100,
                                        step: 0.01,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="NEET/JEE Score"
                                    name="neet_score"
                                    value={formData.neet_score}
                                    onChange={handleChange}
                                    type="number"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        min: 0,
                                        max: 720,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 1"
                                    name="remarks1"
                                    value={formData.remarks1}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 2"
                                    name="remarks2"
                                    value={formData.remarks2}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 3"
                                    name="remarks3"
                                    value={formData.remarks3}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 4"
                                    name="remarks4"
                                    value={formData.remarks4}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Fee Due"
                                    name="fee_due"
                                    value={formData.fee_due}
                                    onChange={handleChange}
                                    type="number"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        min: 0,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag 1"
                                    name="flag1"
                                    checked={formData.flag1}
                                    onChange={handleChange}
                                    type="checkbox"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag 2"
                                    name="flag2"
                                    checked={formData.flag2}
                                    onChange={handleChange}
                                    type="checkbox"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag 3"
                                    name="flag3"
                                    checked={formData.flag3}
                                    onChange={handleChange}
                                    type="checkbox"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag 4"
                                    name="flag4"
                                    checked={formData.flag4}
                                    onChange={handleChange}
                                    type="checkbox"
                                />
                            </Grid>
                        </Grid>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button type="submit" color="primary">
                                {editingStudent ? 'Update' : 'Add'}
                            </Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose} aria-labelledby="alert-dialog-title">
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete this student?
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

export default AdminDashboard;