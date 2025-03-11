import express from "express";
import {
  getAllConfigs,
  getConfigByCategory,
  updateConfig,
  initializeDefaultConfigs
} from "../controllers/config.controller";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

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

export default router; 