import api from './client'

export const fetchAdminDashboard = () => api.get('/admin/dashboard')
export const fetchAdminReview = () => api.get('/admin/review')
export const fetchAdminUsers = () => api.get('/admin/users')
export const createAdminUser = (payload) => api.post('/admin/users', payload)
export const updateAdminUser = (userId, payload) => api.put(`/admin/users/${userId}`, payload)
export const deleteAdminUser = (userId) => api.delete(`/admin/users/${userId}`)
