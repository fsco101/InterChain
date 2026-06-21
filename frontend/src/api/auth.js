import api from './client'

export const signupRequest = (payload) => api.post('/auth/signup', payload)
export const loginRequest = (payload) => api.post('/auth/login', payload)
export const meRequest = () => api.get('/auth/me')
export const updateProfileRequest = (payload) => api.put('/auth/me', payload)
export const dashboardRequest = (role) => api.get(`/${role}/dashboard`)
