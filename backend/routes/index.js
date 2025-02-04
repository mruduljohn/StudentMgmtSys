const express = require('express');
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const excelController = require('../controllers/excelController');

const router = express.Router();

// Authentication
router.post('/register', authController.register);
router.post('/login', authController.login);

// Student Routes
router.get('/students', studentController.verifyToken, studentController.isMentorOrAdmin, studentController.getAllStudents);
router.get('/students/:id', studentController.verifyToken, studentController.isMentorOrAdmin, studentController.getSingleStudent);
router.post('/students', studentController.verifyToken, studentController.isAdmin, studentController.createNewStudent);
router.put('/students/:id', studentController.verifyToken, studentController.isMentorOrAdmin, studentController.updateExistingStudent);
router.delete('/students/:id', studentController.verifyToken, studentController.isAdmin, studentController.deleteExistingStudent);

// Excel Routes
router.post('/upload-excel', studentController.verifyToken, studentController.isAdmin, excelController.upload.single('file'), excelController.uploadExcel);
router.get('/download-excel', studentController.verifyToken, studentController.isAdmin, excelController.downloadExcel);

module.exports = router;