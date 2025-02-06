import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Use the service name 'backend'

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

// Authentication
export const register = (userData) => apiClient.post('/register', userData);
export const login = (userData) => apiClient.post('/login', userData);

// Student Routes
export const getStudents = () => apiClient.get('/students');
export const getStudentById = (id) => apiClient.get(`/students/${id}`);
export const createStudent = (studentData) => apiClient.post('/students', studentData);
export const updateStudent = (id, studentData) => apiClient.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => apiClient.delete(`/students/${id}`);

// Batch Routes
export const getActiveBatches = () => apiClient.get('/batches');
export const getBatchById = (id) => apiClient.get(`/batches/${id}`);
export const createBatch = (batchData) => apiClient.post('/batches', batchData);
export const updateBatch = (id, batchData) => apiClient.put(`/batches/${id}`, batchData);
export const deleteBatch = (id) => apiClient.delete(`/batches/${id}`);

// Hostel Routes
export const getActiveHostels = () => apiClient.get('/hostels');
export const getHostelById = (id) => apiClient.get(`/hostels/${id}`);
export const createHostel = (hostelData) => apiClient.post('/hostels', hostelData);
export const updateHostel = (id, hostelData) => apiClient.put(`/hostels/${id}`, hostelData);
export const deleteHostel = (id) => apiClient.delete(`/hostels/${id}`);

// Program Routes
export const getActivePrograms = () => apiClient.get('/programs');
export const getProgramById = (id) => apiClient.get(`/programs/${id}`);
export const createProgram = (programData) => apiClient.post('/programs', programData);
export const updateProgram = (id, programData) => apiClient.put(`/programs/${id}`, programData);
export const deleteProgram = (id) => apiClient.delete(`/programs/${id}`);

// Configurable Options Routes
export const getConfigurableOptions = (category) => apiClient.get(`/configurable-options/${category}`);
export const addConfigurableOption = (category, value, academicYear) => apiClient.post('/configurable-options', { category, value, academicYear });
export const deactivateConfigurableOption = (id) => apiClient.delete(`/configurable-options/${id}`);

// Audit Logs Routes
export const getAuditLogs = () => apiClient.get('/audit-logs');

// Excel Routes
export const uploadExcel = (formData) => apiClient.post('/upload-excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadExcel = () => apiClient.get('/download-excel', { responseType: 'blob' });