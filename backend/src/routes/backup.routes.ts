import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { 
  createBackup, 
  listBackups, 
  downloadBackup, 
  deleteBackup,
  restoreFromBackup,
  scheduleBackup,
  getBackupSchedule,
  testBackup
} from "../controllers/backup.controller";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

// Set up multer for handling backup file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(process.cwd(), "src", "temp");
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `backup-upload-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept JSON files
    if (file.mimetype !== 'application/json' && !file.originalname.endsWith('.json')) {
      return cb(new Error('Only JSON backup files are accepted'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Create a new backup
router.post("/", authMiddleware, adminOnly, createBackup);

// List all available backups
router.get("/", authMiddleware, adminOnly, listBackups);

// Download a specific backup
router.get("/download/:filename", authMiddleware, adminOnly, downloadBackup);

// Delete a specific backup
router.delete("/delete/:filename", authMiddleware, adminOnly, deleteBackup);

// Restore from uploaded backup
router.post("/restore", authMiddleware, adminOnly, upload.single('backup'), restoreFromBackup);

// Configure backup schedule
router.post("/schedule", authMiddleware, adminOnly, scheduleBackup);

// Get backup schedule
router.get("/schedule", authMiddleware, adminOnly, getBackupSchedule);

// Test backup (for debugging)
router.post("/test", authMiddleware, adminOnly, testBackup);

export default router; 