import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Use the service name 'backend' instead of 'localhost'

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

export const register = (userData) => apiClient.post('/register', userData);
export const login = (userData) => apiClient.post('/login', userData);
export const getStudents = () => apiClient.get('/students');
export const getStudentById = (id) => apiClient.get(`/students/${id}`);
export const createStudent = (studentData) => apiClient.post('/students', studentData);
export const updateStudent = (id, studentData) => apiClient.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => apiClient.delete(`/students/${id}`);
export const uploadExcel = (formData) => apiClient.post('/upload-excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadExcel = () => apiClient.get('/download-excel', { responseType: 'blob' });