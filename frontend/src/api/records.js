import api from './client'

export const createStudentActivity = (payload) => api.post('/records/student/activity', payload)
export const createStudentReport = (payload) => api.post('/records/student/report', payload)
export const fetchStudentRecords = () => api.get('/records/student')

export const createInstructorAttendance = (payload) => api.post('/records/instructor/attendance', payload)
export const createInstructorEvaluation = (payload) => api.post('/records/instructor/evaluation', payload)
export const fetchInstructorRecords = () => api.get('/records/instructor')

export const createEmployerApproval = (payload) => api.post('/records/employer/approval', payload)
export const fetchEmployerRecords = () => api.get('/records/employer')

// Search
export const searchUsers = (role, q, callerRole) => api.get(`/${callerRole}/search`, { params: { role, q } })
export const searchInternships = (q) => api.get('/records/internships/search', { params: { q } })
export const searchStudentsByInternshipId = (q) => api.get('/student/search', { params: { q } })

// Instructor roster
export const fetchInstructorRoster = () => api.get('/instructor/roster')
export const addStudentToRoster = (role_id) => api.post('/instructor/roster/add', { role_id })
export const removeStudentFromRoster = (role_id) => api.delete(`/instructor/roster/${role_id}`)

// Employer roster
export const fetchEmployerRoster = () => api.get('/employer/roster')
export const addInstructorToRoster = (role_id) => api.post('/employer/roster/add', { role_id })
export const removeInstructorFromRoster = (role_id) => api.delete(`/employer/roster/${role_id}`)

// Certificates
export const issueCertificate = (payload) => api.post('/employer/certificates', payload)
export const fetchCertificates = () => api.get('/employer/certificates')
