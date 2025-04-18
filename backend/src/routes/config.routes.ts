import express from "express";
import multer from "multer";
import {
  getAllConfigs,
  getConfigByCategory,
  updateConfig,
  initializeDefaultConfigs,
  getSubjectChapters,
  updateSubjectChapters,
  initializeDefaultSubjectChapters
} from "../controllers/config.controller";
import {
  getDashboardPDFs,
  updateDashboardPDFs,
  deleteDashboardPDF,
  servePDF
} from "../controllers/dashboardPDF.controller";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";
import Config from "../models/config.model";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB max file size
    files: 3 // Max 3 files at once
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * @swagger
 * /config/subject-chapters:
 *   get:
 *     summary: Get all subject chapters
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subject chapters
 */
router.get("/config/subject-chapters", authMiddleware, getSubjectChapters);

/**
 * @swagger
 * /config/subject-chapters/initialize:
 *   post:
 *     summary: Initialize default subject chapters (Admin only)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default subject chapters initialized successfully
 *       403:
 *         description: Not authorized
 */
router.post("/config/subject-chapters/initialize", authMiddleware, adminOnly, initializeDefaultSubjectChapters);

/**
 * @swagger
 * /config/subject-chapters/{subject}:
 *   put:
 *     summary: Update chapters for a specific subject (Admin only)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subject
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chapters:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Subject chapters updated successfully
 *       403:
 *         description: Not authorized
 */
router.put("/config/subject-chapters/:subject", authMiddleware, adminOnly, updateSubjectChapters);

/**
 * @swagger
 * /config/dashboard-pdfs:
 *   get:
 *     summary: Get dashboard PDF resources
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dashboard PDFs
 */
router.get("/config/dashboard-pdfs", authMiddleware, getDashboardPDFs);

/**
 * @swagger
 * /config/dashboard-pdfs:
 *   post:
 *     summary: Update dashboard PDF resources (Admin only)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: files
 *         type: file
 *         required: true
 *         description: PDF files to upload (max 3)
 *       - in: formData
 *         name: titles
 *         type: array
 *         items:
 *           type: string
 *         required: true
 *         description: Titles for each PDF file (in the same order)
 *       - in: formData
 *         name: descriptions
 *         type: array
 *         items:
 *           type: string
 *         description: Optional descriptions for each PDF file
 *     responses:
 *       200:
 *         description: Dashboard PDFs updated successfully
 *       403:
 *         description: Not authorized
 */
router.post("/config/dashboard-pdfs", authMiddleware, adminOnly, upload.array('files', 3), updateDashboardPDFs);

/**
 * @swagger
 * /uploads/pdfs/{filename}:
 *   get:
 *     summary: Get a PDF file by filename
 *     tags: [Configuration]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF file not found
 */
router.get("/uploads/pdfs/:filename", servePDF);

/**
 * @swagger
 * /config:
 *   get:
 *     summary: Get all configuration categories
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all configurations
 */
router.get("/config", authMiddleware, getAllConfigs);

/**
 * @swagger
 * /config/initialize:
 *   post:
 *     summary: Initialize default configurations (Admin only)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default configurations initialized successfully
 *       403:
 *         description: Not authorized
 */
router.post("/config/initialize", authMiddleware, adminOnly, initializeDefaultConfigs);

/**
 * @swagger
 * /config/{category}:
 *   get:
 *     summary: Get configuration by category
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration details
 *       404:
 *         description: Configuration not found
 */
router.get("/config/:category", authMiddleware, getConfigByCategory);

/**
 * @swagger
 * /config/{category}:
 *   put:
 *     summary: Update configuration values (Admin only)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       403:
 *         description: Not authorized
 */
router.put("/config/:category", authMiddleware, adminOnly, updateConfig);

/**
 * @swagger
 * /config/dashboard-pdfs/{filePath}:
 *   delete:
 *     summary: Delete a dashboard PDF by file path (Admin only)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *         description: File path of the PDF to delete
 *     responses:
 *       200:
 *         description: Dashboard PDF deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: PDF not found
 */
router.delete("/config/dashboard-pdfs/:filePath", authMiddleware, adminOnly, deleteDashboardPDF);

// Test endpoint to create default subject chapters without authentication
router.post("/config/test-create-chapters", async (req, res) => {
  try {
    const defaultChapters = {
      'PHYSICS': [
        'Physical World, Units and Measurements',
        'Motion in a Straight Line',
        'Motion in a Plane'
      ],
      'CHEMISTRY': [
        'Some Basic Concepts of Chemistry',
        'Structure of Atoms',
        'Classification of Elements and Periodicity in Properties'
      ],
      'BOTANY': [
        'Biological Classification',
        'Plant Kingdom',
        'Morphology of Flowering Plants'
      ],
      'ZOOLOGY': [
        'The Living World',
        'Animal Kingdom Non Chordata',
        'Animal Kingdom Phylum Chordata'
      ],
      'MATHS': [
        'Sets, Relations and Functions',
        'Trigonometry I',
        'Linear Inequations and Inequalities'
      ]
    };
    
    // Find or create the subjectChapters config
    let config = await Config.findOne({ category: 'subjectChapters' });
    
    if (!config) {
      config = new Config({
        category: 'subjectChapters',
        values: Object.keys(defaultChapters),
        subjectChapters: new Map()
      });
    } else {
      // Update the values array with all subject keys
      config.values = Object.keys(defaultChapters);
    }
    
    // Initialize subjectChapters if undefined
    if (!config.subjectChapters) {
      config.subjectChapters = new Map();
    }
    
    // Update with default chapters
    for (const [subject, chapters] of Object.entries(defaultChapters)) {
      config.subjectChapters.set(subject, chapters);
    }
    
    // Save the config
    await config.save();
    
    res.json({
      message: "Default subject chapters created successfully",
      subjects: Object.keys(defaultChapters)
    });
  } catch (error) {
    console.error("Error creating default chapters:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Test endpoint for subject chapters without authentication
router.get("/config/test-chapters", async (req, res) => {
  try {
    const config = await Config.findOne({ category: 'subjectChapters' });
    
    if (!config) {
      res.json({ message: "No subject chapters found", chapters: {} });
      return;
    }
    
    // Convert Map to a more JSON-friendly format
    const chapters = config.subjectChapters ? Object.fromEntries(config.subjectChapters) : {};
    
    res.json({ message: "Subject chapters found", chapters });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Test endpoint to verify API is working
router.get("/config/test", (req, res) => {
  res.json({ message: "Config API is working!" });
});

// Temporary endpoint to fix dashboard PDFs
router.post("/config/fix-dashboard-pdfs", async (req, res) => {
  try {
    console.log("Running dashboard PDFs fix...");
    
    // Find the existing document
    const existingDoc = await Config.findOne({ category: 'dashboard-pdfs' });
    console.log("Found document:", existingDoc);
    
    if (existingDoc) {
      // Create test PDFs array
      const testPdfs = [
        {
          title: "Test PDF 1",
          fileUrl: "https://example.com/test1.pdf",
          description: "Test description 1",
          uploadedAt: new Date()
        }
      ];
      
      // Direct update to ensure the dashboardPDFs field exists
      const result = await Config.collection.updateOne(
        { category: 'dashboard-pdfs' },
        { 
          $set: { dashboardPDFs: testPdfs }
        }
      );
      
      console.log("Update result:", result);
      
      // Get the updated document
      const updatedDoc = await Config.findOne({ category: 'dashboard-pdfs' });
      console.log("Updated document:", updatedDoc);
      
      res.json({
        message: "Fixed dashboard PDFs document",
        before: existingDoc,
        after: updatedDoc,
        updateResult: result
      });
    } else {
      // Create new document with dashboardPDFs field
      const newDoc = await Config.create({
        category: 'dashboard-pdfs',
        values: [],
        dashboardPDFs: [{
          title: "Test PDF 1",
          fileUrl: "https://example.com/test1.pdf",
          description: "Test description 1",
          uploadedAt: new Date()
        }]
      });
      
      console.log("Created new document:", newDoc);
      
      res.json({
        message: "Created new dashboard PDFs document",
        document: newDoc
      });
    }
  } catch (error) {
    console.error("Error fixing dashboard PDFs:", error);
    res.status(500).json({
      message: "Error fixing dashboard PDFs",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 