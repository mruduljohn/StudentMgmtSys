import express from "express";
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  logoutUser,
  getAllUsers,
  updateUser,
  deleteUser
} from "../controllers/auth.controller";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MENTOR]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       403:
 *         description: Not authorized
 */
router.post("/register", authMiddleware, adminOnly, registerUser);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Not authenticated
 */
router.get("/me", authMiddleware, getCurrentUser);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authMiddleware, logoutUser);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Not authorized
 */
router.get("/users", authMiddleware, adminOnly, getAllUsers);

/**
 * @swagger
 * /auth/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Auth]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MENTOR]
 *               class:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put("/users/:id", authMiddleware, adminOnly, updateUser);

/**
 * @swagger
 * /auth/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Auth]
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
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete your own account
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", authMiddleware, adminOnly, deleteUser);

export default router;
