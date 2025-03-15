import express from "express";
import {
  getAllHours,
  getHourById,
  addHour,
  updateHour,
  deleteHour,
  getHourStats,
  getChapterStatus,
  getHourOptions
} from "../controllers/hour.controller";
import { authMiddleware, adminOnly, mentorOrAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Hours
 *   description: Hour Management API
 */

/**
 * @swagger
 * /hours:
 *   get:
 *     summary: Get all hours with pagination and filtering
 *     tags: [Hours]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by batch
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: string
 *         description: Filter by chapter
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *         description: Filter by mode
 *       - in: query
 *         name: classTeacher
 *         schema:
 *           type: string
 *         description: Filter by class teacher
 *       - in: query
 *         name: chapterStatus
 *         schema:
 *           type: string
 *           enum: [NOT STARTED, ONGOING, COMPLETED]
 *         description: Filter by chapter status
 *     responses:
 *       200:
 *         description: List of hours
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/hours", authMiddleware, getAllHours);

/**
 * @swagger
 * /hours/stats:
 *   get:
 *     summary: Get hour statistics
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter stats by batch
 *     responses:
 *       200:
 *         description: Hour statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/hours/stats", authMiddleware, getHourStats);

/**
 * @swagger
 * /hours/chapter-status:
 *   get:
 *     summary: Get chapter status
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by batch
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject
 *     responses:
 *       200:
 *         description: Chapter status
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/hours/chapter-status", authMiddleware, getChapterStatus);

/**
 * @swagger
 * /hours/options:
 *   get:
 *     summary: Get options for hour dropdowns
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hour options
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/hours/options", authMiddleware, getHourOptions);

/**
 * @swagger
 * /hours/{id}:
 *   get:
 *     summary: Get hour by ID
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hour ID
 *     responses:
 *       200:
 *         description: Hour details
 *       404:
 *         description: Hour not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/hours/:id", authMiddleware, getHourById);

/**
 * @swagger
 * /hours:
 *   post:
 *     summary: Add a new hour entry
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batch
 *               - subject
 *               - chapter
 *               - mode
 *               - classTeacher
 *               - allotedHours
 *             properties:
 *               batch:
 *                 type: string
 *               subject:
 *                 type: string
 *               chapter:
 *                 type: string
 *               mode:
 *                 type: string
 *               classTeacher:
 *                 type: string
 *               allotedHours:
 *                 type: number
 *               completedHours:
 *                 type: number
 *               chapterStatus:
 *                 type: string
 *                 enum: [NOT STARTED, ONGOING, COMPLETED]
 *     responses:
 *       201:
 *         description: Hour created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/hours", authMiddleware, mentorOrAdmin, addHour);

/**
 * @swagger
 * /hours/{id}:
 *   put:
 *     summary: Update an hour entry
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batch:
 *                 type: string
 *               subject:
 *                 type: string
 *               chapter:
 *                 type: string
 *               mode:
 *                 type: string
 *               classTeacher:
 *                 type: string
 *               allotedHours:
 *                 type: number
 *               completedHours:
 *                 type: number
 *               chapterStatus:
 *                 type: string
 *                 enum: [NOT STARTED, ONGOING, COMPLETED]
 *     responses:
 *       200:
 *         description: Hour updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hour not found
 *       500:
 *         description: Server error
 */
router.put("/hours/:id", authMiddleware, mentorOrAdmin, updateHour);

/**
 * @swagger
 * /hours/{id}:
 *   delete:
 *     summary: Delete an hour entry
 *     tags: [Hours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hour ID
 *     responses:
 *       200:
 *         description: Hour deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hour not found
 *       500:
 *         description: Server error
 */
router.delete("/hours/:id", authMiddleware, mentorOrAdmin, deleteHour);

export default router; 