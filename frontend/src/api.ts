import axios from 'axios';
import { Student } from './types';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  return config;
});

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
  
  const response = await api.post('/students/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadNewStudentsCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/students/upload-new-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadUpdateStudentsCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/students/upload-update-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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

export default api;