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
        // Include full user data with password hashes to allow complete restoration
        users,
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
    console.log("Processing backup file at:", filePath);
    
    // Parse backup file with error handling
    let backupData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      // Check if the file is not empty
      if (!fileContent || fileContent.trim().length === 0) {
        fs.unlinkSync(filePath);
        res.status(400).json({ message: "Backup file is empty" });
        return;
      }
      
      backupData = JSON.parse(fileContent);
      console.log("Successfully parsed JSON data");
    } catch (parseError) {
      console.error("Error parsing backup JSON:", parseError);
      // Clean up file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        console.error("Error deleting invalid file:", unlinkError);
      }
      
      res.status(400).json({ message: "Invalid JSON format in backup file" });
      return;
    }
    
    // Validate backup structure
    if (!backupData.data || !backupData.metadata) {
      console.error("Invalid backup structure: missing data or metadata");
      fs.unlinkSync(filePath);
      res.status(400).json({ message: "Invalid backup structure: missing data or metadata sections" });
      return;
    }
    
    // Log the structure for debugging
    console.log("Backup metadata:", backupData.metadata);
    console.log("Backup data sections available:", Object.keys(backupData.data));
    
    // Confirm restore
    if (req.query.confirm !== 'true') {
      // Return metadata without restoring
      res.json({
        message: "Backup validation successful. Send again with confirm=true to proceed with restore.",
        metadata: backupData.metadata,
        timestamp: backupData.timestamp,
        version: backupData.version
      });
      
      // Don't delete the file yet as it will be needed for the confirmation request
      return;
    }
    
    console.log("Starting restore process with confirm=true");
    
    // NO TRANSACTIONS: Simplified approach without transactions for MongoDB standalone mode
    try {
      console.log("Removing existing data...");
      
      // Clear existing data with separate try/catch blocks
      try {
        // Use native MongoDB driver directly to avoid Mongoose transaction issues
        if (!mongoose.connection.db) {
          throw new Error("MongoDB connection not initialized");
        }
        const studentCollection = mongoose.connection.db.collection('students');
        await studentCollection.deleteMany({});
        console.log("Cleared student data using native MongoDB driver");
      } catch (deleteError) {
        console.error("Error clearing students:", deleteError);
      }
      
      try {
        // Don't delete current user - use native MongoDB driver
        if (!mongoose.connection.db) {
          throw new Error("MongoDB connection not initialized");
        }
        const userCollection = mongoose.connection.db.collection('users');
        if (req.user?.id) {
          await userCollection.deleteMany({ _id: { $ne: new mongoose.Types.ObjectId(req.user.id) } });
        } else {
          await userCollection.deleteMany({});
        }
        console.log("Cleared user data (except current user) using native MongoDB driver");
      } catch (deleteError) {
        console.error("Error clearing users:", deleteError);
      }
      
      try {
        // Use native MongoDB driver
        if (!mongoose.connection.db) {
          throw new Error("MongoDB connection not initialized");
        }
        const configCollection = mongoose.connection.db.collection('configs');
        await configCollection.deleteMany({});
        console.log("Cleared config data using native MongoDB driver");
      } catch (deleteError) {
        console.error("Error clearing configs:", deleteError);
      }
      
      try {
        // Use native MongoDB driver
        if (!mongoose.connection.db) {
          throw new Error("MongoDB connection not initialized");
        }
        const hourCollection = mongoose.connection.db.collection('hours');
        await hourCollection.deleteMany({});
        console.log("Cleared hour data using native MongoDB driver");
      } catch (deleteError) {
        console.error("Error clearing hours:", deleteError);
      }
      
      console.log("Inserting new data...");
      
      // Insert students if available
      if (backupData.data.students && backupData.data.students.length > 0) {
        try {
          // Insert in batches to avoid overwhelming the database
          const batchSize = 100;
          const studentBatches = [];
          
          for (let i = 0; i < backupData.data.students.length; i += batchSize) {
            studentBatches.push(backupData.data.students.slice(i, i + batchSize));
          }
          
          console.log(`Processing ${studentBatches.length} student batches`);
          
          for (const batch of studentBatches) {
            try {
              await Student.insertMany(batch, { ordered: false });
            } catch (batchError: unknown) {
              const errorMessage = batchError instanceof Error 
                ? batchError.message 
                : 'Unknown error in student batch';
              console.warn("Error in student batch:", errorMessage);
            }
          }
          
          console.log(`Restored ${backupData.data.students.length} students`);
        } catch (studentError) {
          console.error("Error restoring students:", studentError);
        }
      }
      
      // Insert users if available
      if (backupData.data.users && backupData.data.users.length > 0) {
        try {
          // Filter out the current user to prevent conflicts
          const usersToRestore = backupData.data.users.filter(
            (user: any) => user.username !== req.user?.username
          );
          
          await User.insertMany(usersToRestore, { ordered: false });
          console.log(`Restored ${usersToRestore.length} users`);
        } catch (userError) {
          console.error("Error restoring users:", userError);
        }
      }
      
      // Insert configs if available
      if (backupData.data.configs && backupData.data.configs.length > 0) {
        try {
          await Config.insertMany(backupData.data.configs, { ordered: false });
          console.log(`Restored ${backupData.data.configs.length} configs`);
        } catch (configError) {
          console.error("Error restoring configs:", configError);
        }
      }
      
      // Insert hours if available
      if (backupData.data.hours && backupData.data.hours.length > 0) {
        try {
          // Insert in batches to avoid overwhelming the database
          const batchSize = 100;
          const hourBatches = [];
          
          for (let i = 0; i < backupData.data.hours.length; i += batchSize) {
            hourBatches.push(backupData.data.hours.slice(i, i + batchSize));
          }
          
          console.log(`Processing ${hourBatches.length} hour batches`);
          
          for (const batch of hourBatches) {
            try {
              await Hour.insertMany(batch, { ordered: false });
            } catch (batchError: unknown) {
              const errorMessage = batchError instanceof Error 
                ? batchError.message 
                : 'Unknown error in hour batch';
              console.warn("Error in hour batch:", errorMessage);
            }
          }
          
          console.log(`Restored ${backupData.data.hours.length} hours`);
        } catch (hourError) {
          console.error("Error restoring hours:", hourError);
        }
      }
      
      console.log("Restore process completed successfully");
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(filePath);
        console.log("Temporary file deleted");
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
      
      // Log restore operation
      try {
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
        console.log("Restore audit log created");
      } catch (auditError) {
        console.error("Error creating audit log:", auditError);
      }
      
      res.json({
        message: "Database restored successfully",
        metadata: backupData.metadata,
      });
    } catch (restoreError) {
      console.error("General error during restore process:", restoreError);
      res.status(500).json({ 
        message: "Error during restore process",
        error: restoreError instanceof Error ? restoreError.message : 'Unknown error'
      });
      
      // Ensure the temporary file is deleted
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    }
  } catch (error) {
    console.error("Fatal error in restore controller:", error);
    res.status(500).json({ 
      message: "Server error during restore process",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
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