const express = require('express');
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const batchController = require('../controllers/batchController');
const hostelController = require('../controllers/hostelController');
const programController = require('../controllers/programController');
const configurableOptionsController = require('../controllers/configurableOptionsController');
const auditLogsController = require('../controllers/auditLogsController');
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

// Batch Routes
router.get('/batches', batchController.verifyToken, batchController.isAdmin, batchController.getAllBatches);
router.get('/batches/:id', batchController.verifyToken, batchController.isAdmin, batchController.getSingleBatch);
router.post('/batches', batchController.verifyToken, batchController.isAdmin, batchController.createNewBatch);
router.put('/batches/:id', batchController.verifyToken, batchController.isAdmin, batchController.updateExistingBatch);
router.delete('/batches/:id', batchController.verifyToken, batchController.isAdmin, batchController.deleteExistingBatch);

// Hostel Routes
router.get('/hostels', hostelController.verifyToken, hostelController.isAdmin, hostelController.getAllHostels);
router.get('/hostels/:id', hostelController.verifyToken, hostelController.isAdmin, hostelController.getSingleHostel);
router.post('/hostels', hostelController.verifyToken, hostelController.isAdmin, hostelController.createNewHostel);
router.put('/hostels/:id', hostelController.verifyToken, hostelController.isAdmin, hostelController.updateExistingHostel);
router.delete('/hostels/:id', hostelController.verifyToken, hostelController.isAdmin, hostelController.deleteExistingHostel);

// Program Routes
router.get('/programs', programController.verifyToken, programController.isAdmin, programController.getAllPrograms);
router.get('/programs/:id', programController.verifyToken, programController.isAdmin, programController.getSingleProgram);
router.post('/programs', programController.verifyToken, programController.isAdmin, programController.createNewProgram);
router.put('/programs/:id', programController.verifyToken, programController.isAdmin, programController.updateExistingProgram);
router.delete('/programs/:id', programController.verifyToken, programController.isAdmin, programController.deleteExistingProgram);

// Configurable Options Routes
router.get('/configurable-options/:category', configurableOptionsController.verifyToken, configurableOptionsController.isAdmin, configurableOptionsController.getConfigurableOptions);
router.post('/configurable-options', configurableOptionsController.verifyToken, configurableOptionsController.isAdmin, configurableOptionsController.addConfigurableOption);
router.delete('/configurable-options/:id', configurableOptionsController.verifyToken, configurableOptionsController.isAdmin, configurableOptionsController.deactivateConfigurableOption);

// Audit Logs Routes
router.get('/audit-logs', auditLogsController.verifyToken, auditLogsController.isAdmin, auditLogsController.getAllAuditLogs);

// Excel Routes
router.post('/upload-excel', studentController.verifyToken, studentController.isAdmin, studentController.upload.single('file'), excelController.uploadExcel);
router.get('/download-excel', studentController.verifyToken, studentController.isAdmin, excelController.downloadExcel);

module.exports = router;