import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const fetchStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const addStudent = async (student) => {
  const response = await api.post('/students', student);
  return response.data;
};

export const updateStudent = async (id, student) => {
  const response = await api.put(`/students/${id}`, student);
  return response.data;
};

export const deleteStudent = async (id) => {
  await api.delete(`/students/${id}`);
};

export const fetchBatches = async () => {
  const response = await api.get('/batches');
  return response.data;
};

export const fetchConfigurableOptions = async (category) => {
  const response = await api.get(`/configurable-options/${category}`);
  return response.data;
};

export const fetchAuditLogs = async () => {
  const response = await api.get('/audit-logs');
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const register = async (user) => {
  const response = await api.post('/register', user);
  return response.data;
};

export default api;