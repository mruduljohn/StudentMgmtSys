import fs from 'fs';
import path from 'path';
import { CronJob } from 'cron';
import mongoose from 'mongoose';
import Config from '../models/config.model';
import Student from '../models/student.model';
import User from '../models/user.model';
import Hour from '../models/hour.model';
import Audit from '../models/audit.model';

let backupJob: CronJob | null = null;

/**
 * Initialize the backup scheduler
 */
export const initBackupScheduler = async (): Promise<void> => {
  try {
    console.log('Initializing backup scheduler...');
    
    // Load backup schedule from config
    const config = await Config.findOne({ category: 'backupSchedule' });
    
    if (!config) {
      console.log('No backup schedule configured. Creating default (disabled) schedule.');
      await Config.create({
        category: 'backupSchedule',
        values: ['0', '0', 'false'] // Default: midnight, disabled
      });
      return;
    }
    
    // Parse config values
    const hour = parseInt(config.values[0] || '0', 10);
    const minute = parseInt(config.values[1] || '0', 10);
    const enabled = config.values[2] === 'true';
    
    if (enabled) {
      // Schedule backup job
      scheduleBackup(hour, minute);
      console.log(`Backup scheduler initialized: ${hour}:${minute.toString().padStart(2, '0')}`);
      
      // Log current time to help with debugging
      const now = new Date();
      console.log(`Current server time: ${now.toLocaleString()}`);
      
      // Calculate next execution time
      const nextRunDate = new Date();
      nextRunDate.setHours(hour, minute, 0, 0);
      if (nextRunDate <= now) {
        // If the time has already passed today, schedule for tomorrow
        nextRunDate.setDate(nextRunDate.getDate() + 1);
      }
      console.log(`Next scheduled backup: ${nextRunDate.toLocaleString()}`);
    } else {
      console.log('Backup scheduler is disabled.');
    }
  } catch (error) {
    console.error('Error initializing backup scheduler:', error);
  }
};

/**
 * Schedule a backup job
 */
export const scheduleBackup = (hour: number, minute: number): void => {
  // Stop existing job if any
  if (backupJob) {
    backupJob.stop();
  }
  
  // Create cron expression: minute hour * * *
  const cronExpression = `${minute} ${hour} * * *`;
  
  // Create new job with local timezone instead of UTC
  backupJob = new CronJob(
    cronExpression,
    performBackup,
    null,
    true
  );
  
  console.log(`Backup scheduled at ${hour}:${minute.toString().padStart(2, '0')} local time daily`);
};

/**
 * Perform a database backup
 */
export const performBackup = async (): Promise<void> => {
  try {
    console.log('Starting scheduled database backup...');
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupDir = path.join(process.cwd(), 'src', 'backups');
    
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
      version: '1.0',
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
    
    // Generate filename - use backup- prefix to match manual backups
    const filename = `auto-backup-${timestamp}.json`;
    const filePath = path.join(backupDir, filename);
    
    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
    
    // Manage backup retention - keep only last 30 automatic backups
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          // Use modified time which is more reliable than birthtime
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Delete old backups (keep last 30)
    if (files.length > 30) {
      for (let i = 30; i < files.length; i++) {
        try {
          fs.unlinkSync(files[i].path);
          console.log(`Deleted old backup: ${files[i].filename}`);
        } catch (error) {
          console.error(`Error deleting old backup ${files[i].filename}:`, error);
        }
      }
    }
    
    // Log backup creation to audit trail
    await Audit.create({
      action: 'CONFIG_CHANGE',
      entityType: 'SYSTEM',
      details: {
        operation: 'AUTOMATIC_DATABASE_BACKUP',
        filename,
      },
      automated: true
    });
    
    console.log(`Scheduled backup completed: ${filename}`);
  } catch (error) {
    console.error('Error performing scheduled backup:', error);
  }
};

/**
 * Update the backup schedule
 */
export const updateBackupSchedule = async (): Promise<void> => {
  try {
    // Load backup schedule from config
    const config = await Config.findOne({ category: 'backupSchedule' });
    
    if (!config) {
      return;
    }
    
    // Parse config values
    const hour = parseInt(config.values[0] || '0', 10);
    const minute = parseInt(config.values[1] || '0', 10);
    const enabled = config.values[2] === 'true';
    
    if (enabled) {
      // Schedule backup job
      scheduleBackup(hour, minute);
      console.log(`Backup schedule updated: ${hour}:${minute.toString().padStart(2, '0')}`);
    } else {
      // Stop existing job if any
      if (backupJob) {
        backupJob.stop();
        backupJob = null;
        console.log('Backup scheduler disabled');
      }
    }
  } catch (error) {
    console.error('Error updating backup schedule:', error);
  }
};

/**
 * Manually trigger a backup (useful for testing)
 */
export const triggerManualBackup = async (): Promise<void> => {
  console.log('Manually triggering backup...');
  await performBackup();
  console.log('Manual backup complete');
}; 