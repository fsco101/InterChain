import api from './client'

export const createStudentActivity = (payload) => api.post('/records/student/activity', payload)
export const createStudentReport = (payload) => api.post('/records/student/report', payload)
export const fetchStudentRecords = () => api.get('/records/student')

// Student Attendance
export const createStudentAttendance = (formData) => api.post('/records/student/attendance', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const fetchStudentAttendance = () => api.get('/records/student/attendance')
export const fetchStudentAttendanceHistory = () => api.get('/records/student/attendance/history')
export const deleteStudentAttendance = (id) => api.delete(`/records/student/attendance/${id}`)

export const createInstructorAttendance = (payload) => api.post('/records/instructor/attendance', payload)
export const createInstructorEvaluation = (payload) => api.post('/records/instructor/evaluation', payload)
export const fetchInstructorRecords = () => api.get('/records/instructor')

// Employer Evaluations
export const createEmployerEvaluation = (payload) => api.post('/records/employer/evaluation', payload)
export const fetchEmployerEvaluations = () => api.get('/records/employer/evaluations')
export const fetchEmployerEvaluationsHistory = () => api.get('/records/employer/evaluations/history')
export const deleteEmployerEvaluation = (id) => api.delete(`/records/employer/evaluation/${id}`)

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
export const fetchInstructorEmployers = () => api.get('/instructor/employers')

// Instructor read-only
export const fetchInstructorStudentAttendance = () => api.get('/instructor/student-attendance')
export const fetchInstructorRankings = () => api.get('/instructor/rankings')

// Employer roster
export const fetchEmployerRoster = () => api.get('/employer/roster')
export const addInstructorToRoster = (role_id) => api.post('/employer/roster/add', { role_id })
export const removeInstructorFromRoster = (role_id) => api.delete(`/employer/roster/${role_id}`)

// Employer students & attendance
export const fetchEmployerStudents = () => api.get('/employer/students')
export const fetchEmployerStudentAttendance = (studentId) => api.get(`/employer/student-attendance/${studentId}`)
export const fetchEmployerAllAttendance = () => api.get('/employer/attendance')
export const validateStudentAttendance = (recordId, payload) => api.patch(`/employer/attendance/${recordId}/validate`, payload)

// Employer positions
export const createPosition = (payload) => api.post('/employer/positions', payload)
export const fetchPositions = () => api.get('/employer/positions')
export const deletePosition = (id) => api.delete(`/employer/positions/${id}`)

// Employer assign position to student
export const assignStudentPosition = (studentId, ojt_position) => api.put(`/employer/student/${studentId}/position`, { ojt_position })

// Employer tasks
export const createTask = (payload) => api.post('/employer/tasks', payload)
export const fetchTasks = () => api.get('/employer/tasks')
export const updateTaskStatus = (taskId, status) => api.patch(`/employer/tasks/${taskId}`, { status })
export const deleteTask = (taskId) => api.delete(`/employer/tasks/${taskId}`)

// Employer rankings
export const fetchEmployerRankings = () => api.get('/employer/rankings')

// Employer student hours
export const fetchStudentHours = (roleId) => api.get(`/employer/student-hours/${roleId}`)

// Certificates
export const issueCertificate = (payload) => api.post('/employer/certificates', payload)
export const fetchCertificates = () => api.get('/employer/certificates')

// History
export const fetchStudentHistory = () => api.get('/records/student/history')
export const fetchInstructorHistory = () => api.get('/records/instructor/history')
export const fetchEmployerHistory = () => api.get('/records/employer/history')

// Delete (student)
export const deleteStudentActivity = (id) => api.delete(`/records/student/activity/${id}`)
export const deleteStudentReport = (id) => api.delete(`/records/student/report/${id}`)
export const bulkDeleteStudentActivity = (ids) => api.post('/records/student/activity/bulk-delete', { ids })
export const bulkDeleteStudentReport = (ids) => api.post('/records/student/report/bulk-delete', { ids })

// Delete (instructor)
export const deleteInstructorAttendance = (id) => api.delete(`/records/instructor/attendance/${id}`)
export const deleteInstructorEvaluation = (id) => api.delete(`/records/instructor/evaluation/${id}`)
export const bulkDeleteInstructorAttendance = (ids) => api.post('/records/instructor/attendance/bulk-delete', { ids })
export const bulkDeleteInstructorEvaluation = (ids) => api.post('/records/instructor/evaluation/bulk-delete', { ids })

// Delete (employer)
export const deleteEmployerApproval = (id) => api.delete(`/records/employer/approval/${id}`)
export const bulkDeleteEmployerApproval = (ids) => api.post('/records/employer/approval/bulk-delete', { ids })

// Public profile
export const fetchUserProfile = (userId) => api.get(`/auth/profile/${userId}`)
