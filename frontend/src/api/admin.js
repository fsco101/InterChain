import api from './client'

export const fetchAdminDashboard = () => api.get('/admin/dashboard')
export const fetchAdminReview = () => api.get('/admin/review')
export const fetchAdminUsers = () => api.get('/admin/users')
export const backfillRoleIds = () => api.post('/admin/users/backfill-role-ids')
export const createAdminUser = (payload) => api.post('/admin/users', payload)
export const updateAdminUser = (userId, payload) => api.put(`/admin/users/${userId}`, payload)
export const updateAdminUserRole = (userId, role) => api.patch(`/admin/users/${userId}/role`, { role })
export const deleteAdminUser = (userId) => api.delete(`/admin/users/${userId}`)
export const verifyAdminUser = (userId) => api.patch(`/admin/users/${userId}/verify`)
