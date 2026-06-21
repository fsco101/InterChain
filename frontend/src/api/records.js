import api from './client'

export const createStudentActivity = (payload) => api.post('/records/student/activity', payload)
export const createStudentReport = (payload) => api.post('/records/student/report', payload)
export const fetchStudentRecords = () => api.get('/records/student')

export const createInstructorAttendance = (payload) => api.post('/records/instructor/attendance', payload)
export const createInstructorEvaluation = (payload) => api.post('/records/instructor/evaluation', payload)
export const fetchInstructorRecords = () => api.get('/records/instructor')

export const createEmployerApproval = (payload) => api.post('/records/employer/approval', payload)
export const fetchEmployerRecords = () => api.get('/records/employer')
