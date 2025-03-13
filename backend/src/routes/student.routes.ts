import express from "express";
import multer from "multer";
import {
  getAllStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  uploadCSV,
  getStudentStats,
  uploadNewStudentsCSV,
  uploadUpdateStudentsCSV
} from "../controllers/student.controller";
import { authMiddleware, adminOnly, mentorOrAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student Management API
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students with pagination and filtering
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, ID, or phone
 *     responses:
 *       200:
 *         description: List of students
 *       401:
 *         description: Unauthorized
 */
router.get("/students", authMiddleware, getAllStudents);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get("/students/:id", authMiddleware, getStudentById);

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Add new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Invalid data
 */
router.post("/students", authMiddleware, mentorOrAdmin, addStudent);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put("/students/:id", authMiddleware, mentorOrAdmin, updateStudent);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete("/students/:id", authMiddleware, adminOnly, deleteStudent);

/**
 * @swagger
 * /students/upload/csv:
 *   post:
 *     summary: Upload CSV file with student data
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: CSV processed successfully
 *       400:
 *         description: Invalid file
 */
router.post(
  "/students/upload/csv",
  authMiddleware,
  adminOnly,
  upload.single("file"),
  uploadCSV
);

/**
 * @swagger
 * /students/stats:
 *   get:
 *     summary: Get student statistics for dashboard
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics
 */
router.get("/students/stats", authMiddleware, getStudentStats);

router.post('/upload-csv', authMiddleware, adminOnly, upload.single('file'), uploadCSV);
router.post('/upload-new-csv', authMiddleware, adminOnly, upload.single('file'), uploadNewStudentsCSV);
router.post('/upload-update-csv', authMiddleware, adminOnly, upload.single('file'), uploadUpdateStudentsCSV);

export default router;
