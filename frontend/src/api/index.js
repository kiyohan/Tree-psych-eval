import axios from 'axios';

const API = axios.create({ baseURL: '/api' }); // The proxy will handle the domain

// Interceptor to add the token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth
export const login = (formData) => API.post('/auth/login', formData);
export const getMe = () => API.get('/auth/me'); 

// Uploader
export const submitDrawing = (formData) => API.post('/drawings', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Assessor
export const getAssignedCases = () => API.get('/cases');
export const submitReview = (caseId, reviewData) => API.post(`/cases/${caseId}/review`, reviewData);

// Admin
export const getAdminStats = () => API.get('/admin/analytics');
export const getAllUsers = () => API.get('/users');
export const getAllAdminCases = () => API.get('/admin/cases');
export const reassignCase = (caseId, newAssessorId) => API.put(`/admin/cases/${caseId}/reassign`, { newAssessorId });

// Admin User Management
export const createUser = (userData) => API.post('/users', userData);
export const updateUser = (userId, userData) => API.put(`/users/${userId}`, userData);
export const deleteUser = (userId) => API.delete(`/users/${userId}`);

export const getAdminLogs = () => API.get('/admin/logs');

// Admin - Export system data
export const exportSystemData = () => API.get('/admin/export', { responseType: 'blob' });

// Uploader - Get drawing history
export const getMyDrawingsWithCases = () => API.get('/drawings'); // We need to update the backend for this