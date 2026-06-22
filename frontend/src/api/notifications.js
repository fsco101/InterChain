import api from './client'

export const fetchNotifications = () => api.get('/notifications')
export const markRead = (id) => api.patch(`/notifications/${id}/read`)
export const markAllRead = () => api.patch('/notifications/read-all')
export const deleteNotification = (id) => api.delete(`/notifications/${id}`)
export const bulkDeleteNotifications = (ids) => api.post('/notifications/bulk-delete', { ids })
