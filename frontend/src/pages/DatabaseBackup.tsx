import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import axios, { testBackup, deleteBackup } from '../api';
import { useAuthStore } from '../store/authStore';
import { format, parseISO } from 'date-fns';
import { FaDownload, FaUpload, FaDatabase, FaCalendarAlt, FaCheck, FaTimes, FaTrash, FaClock } from 'react-icons/fa';

// Define types for the backup data
interface Backup {
  filename: string;
  timestamp: string;
  size: number;
  createdAt: string;
  isAutoBackup?: boolean;
}

interface BackupSchedule {
  hour: number;
  minute: number;
  enabled: boolean;
}

const DatabaseBackup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<BackupSchedule>({ hour: 0, minute: 0, enabled: false });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleString());

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
      toast.error('Only administrators can access backup management');
    }
  }, [user, navigate]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(format(now, "HH:mm:ss (h:mm:ss a), MMM d, yyyy"));
    }, 1000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(timer);
  }, []);

  // Fetch backup list
  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/backup');
      setBackups(response.data.backups || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching backups:', err);
      setError(err.response?.data?.message || 'Failed to load backups');
      toast.error('Failed to load backup list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch backup schedule
  const fetchSchedule = async () => {
    try {
      const response = await axios.get('/backup/schedule');
      setSchedule(response.data.schedule);
    } catch (err: any) {
      console.error('Error fetching backup schedule:', err);
      toast.error('Failed to load backup schedule');
    }
  };

  // Initial data load
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchBackups();
      fetchSchedule();
    }
  }, [user]);

  // Create new backup
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const response = await axios.post('/backup');
      toast.success('Backup created successfully');
      fetchBackups();
    } catch (err: any) {
      console.error('Error creating backup:', err);
      toast.error(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Download backup
  const handleDownloadBackup = async (filename: string) => {
    try {
      const response = await axios.get(`/backup/download/${filename}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error('Error downloading backup:', err);
      toast.error('Failed to download backup');
    }
  };

  // Handle file selection for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        toast.error('Only JSON backup files are accepted');
        return;
      }
      setUploadFile(file);
    }
  };

  // Validate backup file before restore
  const handleValidateBackup = async () => {
    if (!uploadFile) {
      toast.error('Please select a backup file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('backup', uploadFile);
      
      const response = await axios.post('/backup/restore', formData);
      setBackupInfo(response.data);
      setConfirmRestore(true);
    } catch (err: any) {
      console.error('Error validating backup:', err);
      toast.error(err.response?.data?.message || 'Invalid backup file');
    }
  };

  // Restore from backup
  const handleRestoreBackup = async () => {
    if (!uploadFile) {
      toast.error('Please select a backup file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('backup', uploadFile);
      
      const response = await axios.post('/backup/restore?confirm=true', formData);
      toast.success('Database restored successfully');
      setShowUploadModal(false);
      setUploadFile(null);
      setConfirmRestore(false);
      setBackupInfo(null);
      fetchBackups();
    } catch (err: any) {
      console.error('Error restoring backup:', err);
      toast.error(err.response?.data?.message || 'Failed to restore backup');
    }
  };

  // Update backup schedule
  const handleUpdateSchedule = async () => {
    try {
      await axios.post('/backup/schedule', schedule);
      toast.success(`Backup schedule ${schedule.enabled ? 'enabled' : 'disabled'}`);
      setShowScheduleModal(false);
      fetchSchedule();
    } catch (err: any) {
      console.error('Error updating backup schedule:', err);
      toast.error(err.response?.data?.message || 'Failed to update backup schedule');
    }
  };

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format timestamp
  const formatDate = (dateString: string): string => {
    try {
      // Check if the date is provided as a valid ISO string
      if (typeof dateString === 'string') {
        // If it's a proper ISO date string that was already formatted
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return format(date, 'MMM d, yyyy, h:mm a');
        }
      }
      
      return 'Unknown date';
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Unknown date';
    }
  };

  // Format time (HH:MM)
  const formatTime = (hour: number, minute: number): string => {
    const date = new Date();
    date.setHours(hour, minute, 0);
    
    // Return both 24-hour and 12-hour formats
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} (${format(date, 'h:mm a')})`;
  };

  // Test backup (for debugging)
  const handleTestBackup = async () => {
    try {
      await testBackup();
      toast.success('Test backup triggered successfully');
      // Refresh the backup list after a short delay
      setTimeout(() => {
        fetchBackups();
      }, 2000);
    } catch (err: any) {
      console.error('Error testing backup:', err);
      toast.error(err.response?.data?.message || 'Failed to test backup');
    }
  };

  // Delete backup
  const handleDeleteBackup = async (filename: string) => {
    try {
      await deleteBackup(filename);
      toast.success('Backup deleted successfully');
      fetchBackups();
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting backup:', err);
      toast.error(err.response?.data?.message || 'Failed to delete backup');
    }
  };

  return (
    <Layout title="Database Backup">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Database Backup Management</h2>
            <p className="text-gray-600">Backup and restore your database</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="primary"
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              icon={<FaDatabase />}
            >
              {isCreatingBackup ? 'Creating...' : 'Create Backup'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(true)}
              icon={<FaUpload />}
            >
              Restore Backup
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowScheduleModal(true)}
              icon={<FaCalendarAlt />}
            >
              Schedule
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="secondary"
                onClick={handleTestBackup}
                icon={<FaCheck />}
              >
                Test Backup
              </Button>
            )}
          </div>
        </div>

        {/* Current time and schedule info */}
        <div className="mb-6">
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Backup Schedule</h3>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${schedule.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {schedule.enabled ? (
                    <p className="text-gray-700">
                      Daily backup scheduled at <span className="font-medium">{formatTime(schedule.hour, schedule.minute)}</span>
                    </p>
                  ) : (
                    <p className="text-gray-700">Automatic backups are disabled</p>
                  )}
                </div>
              </div>
              <div className="flex items-center text-gray-700">
                <FaClock className="mr-2" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading backups...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No backups available
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.filename} className={`hover:bg-gray-50 ${backup.filename.startsWith('auto-backup-') ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {backup.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {backup.filename.startsWith('auto-backup-') ? 
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Automatic</span> : 
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Manual</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.filename)}
                            icon={<FaDownload />}
                          >
                            Download
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(backup.filename)}
                            icon={<FaTrash />}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Delete Backup"
      >
        <div>
          <p className="mb-4 text-gray-600">
            Are you sure you want to delete this backup? This action cannot be undone.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaTrash className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Backup file:</strong> {showDeleteConfirm}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDeleteBackup(showDeleteConfirm)}
            >
              Delete Backup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setConfirmRestore(false);
          setBackupInfo(null);
        }}
        title="Restore Database from Backup"
      >
        {!confirmRestore ? (
          <div>
            <p className="mb-4 text-gray-600">
              Please select a backup file to restore. This will overwrite your current database.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Backup File (JSON)</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Warning: This action will replace all current data with the data from the backup file. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleValidateBackup}
                disabled={!uploadFile}
              >
                Validate Backup
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Backup Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Timestamp:</div>
                  <div className="font-medium">{backupInfo.timestamp}</div>
                  
                  <div className="text-gray-500">Version:</div>
                  <div className="font-medium">{backupInfo.version}</div>
                  
                  <div className="text-gray-500">Students:</div>
                  <div className="font-medium">{backupInfo.metadata.students}</div>
                  
                  <div className="text-gray-500">Users:</div>
                  <div className="font-medium">{backupInfo.metadata.users}</div>
                  
                  <div className="text-gray-500">Configs:</div>
                  <div className="font-medium">{backupInfo.metadata.configs}</div>
                  
                  <div className="text-gray-500">Hours:</div>
                  <div className="font-medium">{backupInfo.metadata.hours}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>FINAL WARNING:</strong> You are about to overwrite your current database. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmRestore(false);
                  setBackupInfo(null);
                }}
              >
                Back
              </Button>
              <Button
                variant="danger"
                onClick={handleRestoreBackup}
              >
                Confirm Restore
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Configure Backup Schedule"
      >
        <div>
          <p className="mb-4 text-gray-600">
            Configure automatic daily database backups.
          </p>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Schedule Time (24-hour format)</label>
            <div className="flex space-x-2">
              <select
                value={schedule.hour}
                onChange={(e) => setSchedule({...schedule, hour: parseInt(e.target.value)})}
                className="w-20 p-2 border border-gray-300 rounded"
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className="p-2">:</span>
              <select
                value={schedule.minute}
                onChange={(e) => setSchedule({...schedule, minute: parseInt(e.target.value)})}
                className="w-20 p-2 border border-gray-300 rounded"
              >
                {Array.from({length: 60}, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => setSchedule({...schedule, enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-700">
                Enable automatic backups
              </span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateSchedule}
            >
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default DatabaseBackup; 