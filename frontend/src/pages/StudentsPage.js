import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid2 as Grid, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStudents, createStudent, updateStudent, deleteStudent, uploadExcel, downloadExcel } from '../services/api';
import { AuthContext } from '../utils/AuthContext';

const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        sl_no: '',
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
        joined: '',
        syllabus: '',
        percentage_of_2_marks: '',
        neet_score: '',
        remarks: '',
        remarks_1: '',
        remarks_2: '',
        remarks_3: '',
        remarks_4: '',
        fee_due: '',
        flag1: '',
        flag2: '',
        flag3: '',
        flag4: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { authState } = React.useContext(AuthContext);

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/login');
        } else {
            fetchStudents();
        }
    }, [authState.isAuthenticated, navigate]);

    const fetchStudents = async () => {
        try {
            const response = await getStudents();
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpen = (student) => {
        setEditingStudent(student);
        setFormData(student);
        setOpen(true);
    };

    const handleClose = () => {
        setEditingStudent(null);
        setFormData({
            sl_no: '',
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
            joined: '',
            syllabus: '',
            percentage_of_2_marks: '',
            neet_score: '',
            remarks: '',
            remarks_1: '',
            remarks_2: '',
            remarks_3: '',
            remarks_4: '',
            fee_due: '',
            flag1: '',
            flag2: '',
            flag3: '',
            flag4: '',
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
        } catch (error) {
            console.error('Failed to submit student:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteStudent(id);
            fetchStudents();
        } catch (error) {
            console.error('Failed to delete student:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            handleUploadExcel(formData);
        }
    };

    const handleUploadExcel = async (formData) => {
        try {
            setLoading(true);
            await uploadExcel(formData);
            fetchStudents();
        } catch (error) {
            console.error('Failed to upload Excel file:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            setLoading(true);
            const response = await downloadExcel();
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Failed to download Excel file:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Students
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpen(null)} style={{ marginBottom: '20px' }}>
                Add Student
            </Button>
            <Button variant="contained" color="success" onClick={handleDownloadExcel} style={{ marginBottom: '20px', marginLeft: '10px' }}>
                Download Excel
            </Button>
            <input
                accept=".xlsx"
                style={{ display: 'none' }}
                id="contained-button-file"
                type="file"
                onChange={handleFileChange}
            />
            <label htmlFor="contained-button-file">
                <Button variant="contained" color="info" component="span" style={{ marginBottom: '20px', marginLeft: '10px' }}>
                    Upload Excel
                </Button>
            </label>
            {loading && <CircularProgress style={{ marginLeft: '10px' }} />}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Phone Number</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.id}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.student_id}</TableCell>
                                <TableCell>{student.phone_number}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" color="primary" onClick={() => handleOpen(student)}>
                                        Edit
                                    </Button>
                                    <Button variant="outlined" color="secondary" onClick={() => handleDelete(student.id)}>
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Sl No"
                                    name="sl_no"
                                    value={formData.sl_no}
                                    onChange={handleChange}
                                />
                            </Grid>
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
                                />
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
                                />
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
                                />
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
                                />
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
                                    label="Joined"
                                    name="joined"
                                    value={formData.joined}
                                    onChange={handleChange}
                                />
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
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="Percentage of +2 Marks"
                                    name="percentage_of_2_marks"
                                    type="number"
                                    value={formData.percentage_of_2_marks}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    required
                                    fullWidth
                                    label="NEET Score"
                                    name="neet_score"
                                    type="number"
                                    value={formData.neet_score}
                                    onChange={handleChange}
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
                                    name="remarks_1"
                                    value={formData.remarks_1}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 2"
                                    name="remarks_2"
                                    value={formData.remarks_2}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 3"
                                    name="remarks_3"
                                    value={formData.remarks_3}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Remarks 4"
                                    name="remarks_4"
                                    value={formData.remarks_4}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Fee Due"
                                    name="fee_due"
                                    type="number"
                                    value={formData.fee_due}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag1"
                                    name="flag1"
                                    value={formData.flag1}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag2"
                                    name="flag2"
                                    value={formData.flag2}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag3"
                                    name="flag3"
                                    value={formData.flag3}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    label="Flag4"
                                    name="flag4"
                                    value={formData.flag4}
                                    onChange={handleChange}
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
        </Container>
    );
};

export default StudentsPage;