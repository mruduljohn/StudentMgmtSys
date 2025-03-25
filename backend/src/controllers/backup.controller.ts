import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Student from "../models/student.model";
import User from "../models/user.model";
import Config from "../models/config.model";
import Audit from "../models/audit.model";
import Hour from "../models/hour.model";
import { updateBackupSchedule, triggerManualBackup } from '../utils/backupScheduler';

// Define interface for Request with file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Create a backup of the entire database
export const createBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can create backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can create database backups" });
      return;
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const backupDir = path.join(process.cwd(), "src", "backups");
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Fetch all data from all collections
    const students = await Student.find({}).lean();
    const users = await User.find({}).lean();
    const configs = await Config.find({}).lean();
    const hours = await Hour.find({}).lean();
    
    // Create backup object
    const backup = {
      timestamp,
      version: "1.0",
      metadata: {
        students: students.length,
        users: users.length,
        configs: configs.length,
        hours: hours.length,
      },
      data: {
        students,
        users: users.map(user => {
          // Remove sensitive information
          const { password, ...rest } = user;
          return rest;
        }),
        configs,
        hours,
      }
    };
    
    // Generate filename
    const filename = `backup-${timestamp}.json`;
    const filePath = path.join(backupDir, filename);
    
    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
    
    // Log backup creation
    await Audit.create({
      user: req.user?.id,
      action: "CONFIG_CHANGE",
      entityType: "SYSTEM",
      details: {
        operation: "DATABASE_BACKUP",
        filename,
      },
      ipAddress: req.ip
    });
    
    res.json({
      message: "Database backup created successfully",
      filename,
      metadata: backup.metadata,
    });
  } catch (error) {
    console.error("Error creating database backup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// List all available backups
export const listBackups = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can list backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can view database backups" });
      return;
    }
    
    const backupDir = path.join(process.cwd(), "src", "backups");
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Read directory contents
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json') && (file.startsWith('backup-') || file.startsWith('auto-backup-')))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        // Extract timestamp from filename
        let timestampStr = '';
        let isAutoBackup = false;
        
        if (file.startsWith('backup-')) {
          timestampStr = file.replace('backup-', '').replace('.json', '');
        } else if (file.startsWith('auto-backup-')) {
          timestampStr = file.replace('auto-backup-', '').replace('.json', '');
          isAutoBackup = true;
        }
        
        // Parse the timestamp string to a proper date
        // First replace the hyphens that were used in place of colons
        const formattedTimestamp = timestampStr.replace(/-/g, ':');
        let createdAt = new Date(formattedTimestamp);
        
        // If the date is invalid, use the file's modified time
        if (isNaN(createdAt.getTime())) {
          createdAt = stats.mtime;
        }
        
        return {
          filename: file,
          timestamp: timestampStr,
          size: stats.size,
          createdAt: createdAt.toISOString(),
          isAutoBackup
        };
      })
      .sort((a, b) => {
        // Parse dates for comparison
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    
    res.json({
      backups: files
    });
  } catch (error) {
    console.error("Error listing database backups:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Download a specific backup
export const downloadBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can download backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can download database backups" });
      return;
    }
    
    const { filename } = req.params;
    const backupDir = path.join(process.cwd(), "src", "backups");
    const filePath = path.join(backupDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "Backup file not found" });
      return;
    }
    
    // Send file
    res.download(filePath);
    
  } catch (error) {
    console.error("Error downloading database backup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restore from a backup file
export const restoreFromBackup = async (req: RequestWithFile, res: Response): Promise<void> => {
  try {
    // Only ADMIN can restore backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can restore database backups" });
      return;
    }
    
    if (!req.file) {
      res.status(400).json({ message: "No backup file uploaded" });
      return;
    }
    
    const filePath = req.file.path;
    
    // Parse backup file
    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Validate backup structure
    if (!backupData.data || !backupData.metadata) {
      res.status(400).json({ message: "Invalid backup file format" });
      fs.unlinkSync(filePath);
      return;
    }
    
    // Confirm restore
    if (req.query.confirm !== 'true') {
      // Return metadata without restoring
      res.json({
        message: "Backup validation successful. Send again with confirm=true to proceed with restore.",
        metadata: backupData.metadata,
        timestamp: backupData.timestamp,
        version: backupData.version
      });
      
      fs.unlinkSync(filePath);
      return;
    }
    
    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Clear existing data
      await Student.deleteMany({}, { session });
      // Don't delete current user that is performing the restore
      await User.deleteMany({ _id: { $ne: req.user?.id } }, { session });
      await Config.deleteMany({}, { session });
      await Hour.deleteMany({}, { session });
      
      // Restore data
      if (backupData.data.students.length > 0) {
        await Student.insertMany(backupData.data.students, { session });
      }
      
      if (backupData.data.users.length > 0) {
        // Filter out the current user to prevent conflicts
        const usersToRestore = backupData.data.users.filter(
          (user: any) => user.username !== req.user?.username
        );
        await User.insertMany(usersToRestore, { session });
      }
      
      if (backupData.data.configs.length > 0) {
        await Config.insertMany(backupData.data.configs, { session });
      }
      
      if (backupData.data.hours.length > 0) {
        await Hour.insertMany(backupData.data.hours, { session });
      }
      
      // Commit transaction
      await session.commitTransaction();
      
      // Clean up the temporary file
      fs.unlinkSync(filePath);
      
      // Log restore operation
      await Audit.create({
        user: req.user?.id,
        action: "CONFIG_CHANGE",
        entityType: "SYSTEM",
        details: {
          operation: "DATABASE_RESTORE",
          filename: req.file.originalname,
          metadata: backupData.metadata,
        },
        ipAddress: req.ip
      });
      
      res.json({
        message: "Database restored successfully",
        metadata: backupData.metadata,
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      console.error("Error during restore transaction:", error);
      res.status(500).json({ message: "Error during restore" });
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error restoring database backup:", error);
    res.status(500).json({ message: "Server error" });
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    }
  }
};

// Trigger a scheduled backup
export const scheduleBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can schedule backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can schedule database backups" });
      return;
    }
    
    // Schedule settings
    const { hour, minute, enabled } = req.body;
    
    // Validate input
    if (typeof hour !== 'number' || hour < 0 || hour > 23) {
      res.status(400).json({ message: "Hour must be between 0 and 23" });
      return;
    }
    
    if (typeof minute !== 'number' || minute < 0 || minute > 59) {
      res.status(400).json({ message: "Minute must be between 0 and 59" });
      return;
    }
    
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ message: "Enabled must be a boolean" });
      return;
    }
    
    // Find or create backup schedule config
    let config = await Config.findOne({ category: "backupSchedule" });
    
    if (!config) {
      config = new Config({
        category: "backupSchedule",
        values: ["0", "0", "false"], // Default: midnight, disabled
      });
    }
    
    // Update config
    config.values = [hour.toString(), minute.toString(), enabled.toString()];
    await config.save();
    
    // Log config change
    await Audit.create({
      user: req.user?.id,
      action: "CONFIG_CHANGE",
      entityType: "SYSTEM",
      details: {
        operation: "BACKUP_SCHEDULE_UPDATE",
        hour,
        minute,
        enabled,
      },
      ipAddress: req.ip
    });

    // Import and trigger the updateBackupSchedule function from utils
    await updateBackupSchedule();
    
    res.json({
      message: `Backup schedule ${enabled ? 'enabled' : 'disabled'}`,
      schedule: {
        hour,
        minute,
        enabled,
      }
    });
  } catch (error) {
    console.error("Error scheduling database backup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current backup schedule
export const getBackupSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can view backup schedule
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can view backup schedule" });
      return;
    }
    
    // Find backup schedule config
    const config = await Config.findOne({ category: "backupSchedule" });
    
    if (!config) {
      res.json({
        schedule: {
          hour: 0,
          minute: 0,
          enabled: false,
        }
      });
      return;
    }
    
    // Parse values
    const hour = parseInt(config.values[0], 10) || 0;
    const minute = parseInt(config.values[1], 10) || 0;
    const enabled = config.values[2] === 'true';
    
    res.json({
      schedule: {
        hour,
        minute,
        enabled,
      }
    });
  } catch (error) {
    console.error("Error getting backup schedule:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Test backup scheduler (for debugging)
export const testBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can test backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can test database backups" });
      return;
    }
    
    // Manually trigger a backup
    await triggerManualBackup();
    
    res.json({
      message: "Test backup triggered successfully"
    });
  } catch (error) {
    console.error("Error testing backup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a specific backup
export const deleteBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only ADMIN can delete backups
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only administrators can delete database backups" });
      return;
    }
    
    const { filename } = req.params;
    const backupDir = path.join(process.cwd(), "src", "backups");
    const filePath = path.join(backupDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "Backup file not found" });
      return;
    }
    
    // Check if filename starts with backup- to prevent deleting non-backup files
    if (!filename.startsWith('backup-') && !filename.startsWith('auto-backup-')) {
      res.status(400).json({ message: "Invalid backup filename" });
      return;
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    // Log deletion
    await Audit.create({
      user: req.user?.id,
      action: "CONFIG_CHANGE",
      entityType: "SYSTEM",
      details: {
        operation: "DATABASE_BACKUP_DELETE",
        filename,
      },
      ipAddress: req.ip
    });
    
    res.json({ 
      message: "Backup deleted successfully",
      filename 
    });
    
  } catch (error) {
    console.error("Error deleting database backup:", error);
    res.status(500).json({ message: "Server error" });
  }
}; 