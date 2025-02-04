const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../models/student');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied: Admin Only' });
    next();
};

const isMentorOrAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'mentor') return res.status(403).json({ message: 'Access Denied: Admin or Mentor Only' });
    next();
};

const getAllStudents = async (req, res) => {
    try {
        const students = await getStudents();
        res.json(students.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: error.message });
    }
};

const getSingleStudent = async (req, res) => {
    try {
        const student = await getStudentById(req.params.id);
        if (student.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student.rows[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: error.message });
    }
};

const createNewStudent = async (req, res) => {
    try {
        const studentData = req.body;
        const student = await createStudent(studentData);
        res.status(201).json(student.rows[0]);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateExistingStudent = async (req, res) => {
    try {
        const studentData = req.body;
        const student = await updateStudent(req.params.id, studentData);
        if (student.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student.rows[0]);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteExistingStudent = async (req, res) => {
    try {
        const student = await deleteStudent(req.params.id);
        if (student.rowCount === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllStudents, getSingleStudent, createNewStudent, updateExistingStudent, deleteExistingStudent, verifyToken, isAdmin, isMentorOrAdmin, upload };