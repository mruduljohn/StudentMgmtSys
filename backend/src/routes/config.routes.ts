import express from "express";
import {
  getAllConfigs,
  getConfigByCategory,
  updateConfig,
  initializeDefaultConfigs,
  getSubjectChapters,
  updateSubjectChapters,
  initializeDefaultSubjectChapters
} from "../controllers/config.controller";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";
import Config from "../models/config.model";

const router = express.Router();

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

export default router; 