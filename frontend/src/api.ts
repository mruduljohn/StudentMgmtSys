import axios from 'axios';
import { Student, Hour } from './types';

// Get API base URL from environment variable or use default
// Add debugging to see what's happening with the environment variable
console.log('Environment variables:', import.meta.env);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// Try to get the API URL from different sources
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// If running in a browser, try to determine the API URL dynamically
if (!API_BASE_URL && typeof window !== 'undefined') {
  // Get the current hostname (e.g., 192.168.8.80 or localhost)
  const hostname = window.location.hostname;
  API_BASE_URL = `http://${hostname}:5000/api`;
  console.log('Dynamically determined API_BASE_URL:', API_BASE_URL);
} else if (!API_BASE_URL) {
  // Fallback to localhost if all else fails
  API_BASE_URL = 'http://localhost:5000/api';
  console.log('Using fallback API_BASE_URL:', API_BASE_URL);
} else {
  console.log('Using environment variable API_BASE_URL:', API_BASE_URL);
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request to:', (config.baseURL || '') + (config.url || ''));
  return config;
});

// Export the api instance as the default export
export default api;

// Authentication APIs
export const login = async (credentials: { username: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: { 
  username: string; 
  email: string; 
  password: string; 
  name: string; 
  role: string;
}) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const updateUser = async (userId: string, userData: { 
  name?: string; 
  email?: string; 
  role?: string;
  class?: string;
}) => {
  const response = await api.put(`/auth/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  localStorage.removeItem('token');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const resetPassword = async (userId: string, passwordData: {
  currentPassword?: string;
  newPassword: string;
}) => {
  const response = await api.post(`/auth/reset-password/${userId}`, passwordData);
  return response.data;
};

// Student APIs
export const fetchStudents = async (params?: { 
  page?: number; 
  limit?: number; 
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}) => {
  console.log("API fetchStudents called with params:", params);
  try {
    const response = await api.get('/students', { params });
    console.log("API fetchStudents response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

export const getStudentById = async (id: string) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const addStudent = async (student: Partial<Student>) => {
  const response = await api.post('/students', student);
  return response.data;
};

export const updateStudent = async (id: string, student: Partial<Student>) => {
  try {
    console.log(`API call: Updating student with ID: ${id}`, student);
    // Make sure we're using the correct endpoint format
    const response = await api.put(`/students/${id}`, student);
    console.log(`API response for update:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`API error updating student with ID ${id}:`, error);
    throw error;
  }
};

export const deleteStudent = async (id: string) => {
  try {
    console.log(`API call: Deleting student with ID: ${id}`);
    // Make sure we're using the correct endpoint format
    const response = await api.delete(`/students/${id}`);
    console.log(`API response for delete:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`API error deleting student with ID ${id}:`, error);
    throw error;
  }
};

export const uploadStudentCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/students/upload/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadNewStudentsCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use the same endpoint as the combined upload but with a different controller
  const response = await api.post('/students/upload/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      mode: 'new'
    }
  });
  
  return response.data;
};

export const uploadUpdateStudentsCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use the same endpoint as the combined upload but with a different controller
  const response = await api.post('/students/upload/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      mode: 'update'
    }
  });
  
  return response.data;
};

export const getStudentStats = async () => {
  const response = await api.get('/students/stats');
  return response.data;
};

// Configuration APIs
export const getAllConfigs = async () => {
  try {
    const response = await api.get('/config');
    
    // Define a type for the config objects
    interface ConfigItem {
      category: string;
      values: string[];
    }
    
    // Format the response for the frontend
    const configs = response.data as ConfigItem[];
    const batchConfig = {
      batches: configs.find((c: ConfigItem) => c.category === 'batches')?.values || [],
      teachers: configs.find((c: ConfigItem) => c.category === 'classTeachers')?.values || [],
      hostels: configs.find((c: ConfigItem) => c.category === 'hostels')?.values || [],
      programs: configs.find((c: ConfigItem) => c.category === 'programs')?.values || [],
      streams: configs.find((c: ConfigItem) => c.category === 'streams')?.values || []
    };
    
    const remarksConfig = {
      remarks: configs.find((c: ConfigItem) => c.category === 'remarks')?.values[0] || 'Remarks',
      remarks1: configs.find((c: ConfigItem) => c.category === 'remarks1')?.values[0] || 'Remarks 1',
      remarks2: configs.find((c: ConfigItem) => c.category === 'remarks2')?.values[0] || 'Remarks 2',
      remarks3: configs.find((c: ConfigItem) => c.category === 'remarks3')?.values[0] || 'Remarks 3',
      remarks4: configs.find((c: ConfigItem) => c.category === 'remarks4')?.values[0] || 'Remarks 4'
    };
    
    const flagsConfig = {
      flag1: configs.find((c: ConfigItem) => c.category === 'flag1')?.values[0] || 'Flag 1',
      flag2: configs.find((c: ConfigItem) => c.category === 'flag2')?.values[0] || 'Flag 2',
      flag3: configs.find((c: ConfigItem) => c.category === 'flag3')?.values[0] || 'Flag 3',
      flag4: configs.find((c: ConfigItem) => c.category === 'flag4')?.values[0] || 'Flag 4'
    };
    
    return {
      batchConfig,
      remarksConfig,
      flagsConfig,
      rawConfigs: configs
    };
  } catch (error) {
    console.error('Error fetching configurations:', error);
    throw error;
  }
};

export const getConfigByCategory = async (category: string) => {
  const response = await api.get(`/config/${category}`);
  return response.data;
};

export const updateConfig = async (category: string, values: string[]) => {
  const response = await api.put(`/config/${category}`, { values });
  return response.data;
};

export const initializeDefaultConfigs = async () => {
  const response = await api.post('/config/initialize');
  return response.data;
};

// Audit APIs
export const getAuditLogs = async (params?: { 
  page?: number; 
  limit?: number; 
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get('/audit/logs', { params });
  return response.data;
};

export const getStudentAuditLogs = async (studentId: string) => {
  const response = await api.get(`/audit/student/${studentId}`);
  return response.data;
};

export const getUserAuditLogs = async () => {
  const response = await api.get('/audit/user');
  return response.data;
};

export const getAuditStats = async () => {
  const response = await api.get('/audit/stats');
  return response.data;
};

// Hour APIs
export const fetchHours = async (params?: Record<string, string | number | boolean | undefined>) => {
  console.log("API fetchHours called with params:", params);
  
  const queryParams = params ? new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString() : '';
  
  const url = `/hours${queryParams ? `?${queryParams}` : ''}`;
  console.log("API fetchHours requesting URL:", url);
  
  try {
    const response = await api.get(url);
    console.log("API fetchHours response data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching hours:", error);
    throw error;
  }
};

export const getHourById = async (id: string) => {
  const response = await api.get(`/hours/${id}`);
  return response.data.hour;
};

export const addHour = async (hourData: Partial<Hour>) => {
  const response = await api.post('/hours', hourData);
  return response.data;
};

export const updateHour = async (id: string, hourData: Partial<Hour>) => {
  const response = await api.put(`/hours/${id}`, hourData);
  return response.data;
};

export const deleteHour = async (id: string) => {
  const response = await api.delete(`/hours/${id}`);
  return response.data;
};

export const uploadHoursCSV = async (file: File, mode: 'new' | 'update' | 'both' = 'both') => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/hours/upload/csv?mode=${mode}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getHourStats = async (params?: Record<string, string | number | boolean | undefined>) => {
  const queryParams = params ? new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString() : '';
  
  const url = `/hours/stats${queryParams ? `?${queryParams}` : ''}`;
  const response = await api.get(url);
  return response.data.stats;
};

export const getChapterStatus = async (params?: Record<string, string | number | boolean | undefined>) => {
  const queryParams = params ? new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString() : '';
  
  const url = `/hours/chapter-status${queryParams ? `?${queryParams}` : ''}`;
  const response = await api.get(url);
  return response.data.chapters;
};

export const getHourOptions = async () => {
  const response = await api.get('/hours/options');
  return response.data.options;
};

// Get subject chapters
export const getSubjectChapters = async () => {
  try {
    const response = await api.get('/config/subject-chapters');
    return response.data;
  } catch (error) {
    console.error('Error fetching subject chapters:', error);
    throw error;
  }
};

// Update chapters for a specific subject
export const updateSubjectChapters = async (subject: string, chapters: string[]) => {
  try {
    const response = await api.put(`/config/subject-chapters/${subject}`, { chapters });
    return response.data;
  } catch (error) {
    console.error(`Error updating chapters for ${subject}:`, error);
    throw error;
  }
};

// Initialize default subject chapters
export const initializeDefaultSubjectChapters = async () => {
  try {
    const response = await api.post('/config/subject-chapters/initialize');
    return response.data;
  } catch (error) {
    console.error('Error initializing default subject chapters:', error);
    throw error;
  }
};

// Function to find a student by ID
export const findStudent = async (studentId: string) => {
  try {
    const response = await api.get(`/students/find/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error finding student:', error);
    throw error;
  }
};

// Database Backup API Functions
export const listBackups = async () => {
  try {
    const response = await api.get('/backup');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createBackup = async () => {
  try {
    const response = await api.post('/backup');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadBackup = async (filename: string) => {
  try {
    const response = await api.get(`/backup/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const validateBackupFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('backup', file);
    const response = await api.post('/backup/restore', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const restoreBackup = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('backup', file);
    
    // Configure axios with larger timeout and proper headers
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for large files
    };

    // First validate without confirming
    console.log('Validating backup file...');
    const validationResponse = await api.post('/backup/restore', formData, config);
    console.log('Validation response:', validationResponse.data);
    
    // If validation is successful, confirm the restore
    console.log('Starting restore with confirmation...');
    const confirmResponse = await api.post('/backup/restore?confirm=true', formData, config);
    console.log('Restore completed successfully:', confirmResponse.data);
    
    return confirmResponse.data;
  } catch (error: any) {
    console.error('Restore backup error:', error);
    
    // Enhance error information for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

export const getBackupSchedule = async () => {
  try {
    const response = await api.get('/backup/schedule');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBackupSchedule = async (schedule: { 
  hour: number; 
  minute: number; 
  enabled: boolean;
}) => {
  try {
    const response = await api.post('/backup/schedule', schedule);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Test backup (for debugging)
export const testBackup = async () => {
  try {
    const response = await api.post('/backup/test');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBackup = async (filename: string) => {
  try {
    const response = await api.delete(`/backup/delete/${filename}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Dashboard PDFs APIs
export const getDashboardPDFs = async () => {
  try {
    const response = await api.get('/config/dashboard-pdfs');
    console.log("API getDashboardPDFs response:", response.data);
    // Make sure we're returning the dashboardPDFs array from the response
    return response.data.dashboardPDFs || [];
  } catch (error) {
    console.error('Error fetching dashboard PDFs:', error);
    throw error;
  }
};

export const uploadDashboardPDFs = async (formData: FormData) => {
  try {
    // Use axios directly with content-type multipart/form-data for file upload
    const response = await api.post('/config/dashboard-pdfs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading dashboard PDFs:', error);
    throw error;
  }
};

export const deleteDashboardPDF = async (filePath: string) => {
  try {
    // Extract just the filename from the path for more reliable deletion
    const filename = filePath.split('/').pop();
    
    // Using the filename for deletion is more reliable
    console.log(`Deleting PDF with filename: ${filename}`);
    const response = await api.delete(`/config/dashboard-pdfs/${encodeURIComponent(filename || '')}`);
    
    return response.data;
  } catch (error) {
    console.error('Error deleting dashboard PDF:', error);
    throw error;
  }
};