import express from "express";
import {
  getAuditLogs,
  getStudentAuditLogs,
  getUserAuditLogs,
  getAuditStats
} from "../controllers/audit.controller";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /audit/logs:
 *   get:
 *     summary: Get all audit logs with pagination and filtering (Admin only)
 *     tags: [Audit]
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
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *     responses:
 *       200:
 *         description: List of audit logs
 *       403:
 *         description: Not authorized
 */
router.get("/audit/logs", authMiddleware, adminOnly, getAuditLogs);

/**
 * @swagger
 * /audit/student/{studentId}:
 *   get:
 *     summary: Get audit logs for a specific student
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student audit logs
 */
router.get("/audit/student/:studentId", authMiddleware, getStudentAuditLogs);

/**
 * @swagger
 * /audit/user:
 *   get:
 *     summary: Get audit logs for current user
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User audit logs
 */
router.get("/audit/user", authMiddleware, getUserAuditLogs);

/**
 * @swagger
 * /audit/stats:
 *   get:
 *     summary: Get audit log statistics (Admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics
 *       403:
 *         description: Not authorized
 */
router.get("/audit/stats", authMiddleware, adminOnly, getAuditStats);

export default router; 