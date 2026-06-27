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

// Supervisor Evaluations
export const submitEmployerEvaluation = (payload) => api.post('/records/employer/evaluate', payload)

// Task Mark Done
export const fetchStudentTasks = () => api.get('/student/tasks')
export const studentMarkTaskDone = (taskId, formData) => api.patch(`/records/student/tasks/${taskId}/done`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const submitInstructorEvaluation = (payload) => api.post('/instructor/evaluation', payload)
export const fetchInstructorEvaluations = () => api.get('/instructor/evaluations')
export const setStudentRequiredHours = (roleId, hours) => api.put(`/instructor/student/${roleId}/required-hours`, { required_hours: parseFloat(hours) })

export const fetchGlobalRankings = (params) => api.get('/records/rankings', { params })
export const createSupervisorEvaluation = (payload) => api.post('/records/supervisor/evaluation', payload)
export const fetchSupervisorEvaluations = () => api.get('/records/supervisor/evaluations')
export const fetchSupervisorEvaluationsHistory = () => api.get('/records/supervisor/evaluations/history')
export const deleteSupervisorEvaluation = (id) => api.delete(`/records/supervisor/evaluation/${id}`)

export const createSupervisorApproval = (payload) => api.post('/records/supervisor/approval', payload)
export const fetchSupervisorRecords = () => api.get('/records/supervisor')

// Search
export const searchUsers = (role, q, callerRole) => api.get(`/${callerRole}/search`, { params: { role, q } })
export const searchInternships = (q) => api.get('/records/internships/search', { params: { q } })
export const searchStudentsByInternshipId = (q) => api.get('/student/search', { params: { q } })

// Instructor roster
export const fetchInstructorRoster = () => api.get('/instructor/roster')
export const fetchInstructorRosterHours = () => api.get('/instructor/roster/hours')
export const addStudentToRoster = (role_id) => api.post('/instructor/roster/add', { role_id })
export const removeStudentFromRoster = (role_id) => api.delete(`/instructor/roster/${role_id}`)
export const fetchInstructorSupervisors = () => api.get('/instructor/supervisors')
export const unlinkSupervisor = (employerId) => api.delete(`/instructor/supervisor/${employerId}`)
export const fetchInstructorStudentCompanies = () => api.get('/instructor/student-companies')

// Instructor read-only
export const fetchInstructorStudentAttendance = () => api.get('/instructor/student-attendance')

// Supervisor roster
export const fetchSupervisorRoster = () => api.get('/supervisor/roster')
export const addInstructorToRoster = (role_id) => api.post('/supervisor/roster/add', { role_id })
export const removeInstructorFromRoster = (role_id) => api.delete(`/supervisor/roster/${role_id}`)

// Supervisor students & attendance
export const fetchSupervisorStudents = () => api.get('/supervisor/students')
export const linkStudentToCompany = (studentId) => api.post(`/supervisor/student/${studentId}/link`)
export const unlinkStudentFromCompany = (studentId) => api.delete(`/supervisor/student/${studentId}/link`)
export const fetchSupervisorStudentAttendance = (studentId) => api.get(`/supervisor/student-attendance/${studentId}`)
export const fetchSupervisorAllAttendance = () => api.get('/supervisor/attendance')
export const validateStudentAttendance = (recordId, payload) => api.patch(`/supervisor/attendance/${recordId}/validate`, payload)

// Supervisor Activities
export const fetchSupervisorActivities = () => api.get('/supervisor/activities')
export const validateStudentActivityLog = (recordId, payload) => api.patch(`/supervisor/activities/${recordId}/validate`, payload)

// Supervisor positions
export const createPosition = (payload) => api.post('/supervisor/positions', payload)
export const fetchPositions = () => api.get('/supervisor/positions')
export const deletePosition = (id) => api.delete(`/supervisor/positions/${id}`)

// Supervisor assign position to student
export const assignStudentPosition = (studentId, ojt_position) => api.put(`/supervisor/student/${studentId}/position`, { ojt_position })

// Supervisor tasks
export const createTask = (payload) => api.post('/supervisor/tasks', payload)
export const fetchTasks = () => api.get('/supervisor/tasks')
export const updateTaskStatus = (taskId, status) => api.patch(`/supervisor/tasks/${taskId}`, { status })
export const deleteTask = (taskId) => api.delete(`/supervisor/tasks/${taskId}`)

// Supervisor student hours
export const fetchStudentHours = (roleId) => api.get(`/supervisor/student-hours/${roleId}`)
export const fetchSupervisorInternHours = () => api.get('/supervisor/interns/hours')

// Certificates
export const issueCertificate = (payload) => api.post('/supervisor/certificates', payload)
export const fetchCertificates = () => api.get('/supervisor/certificates')

// History
export const fetchStudentHistory = () => api.get('/records/student/history')
export const fetchInstructorHistory = () => api.get('/records/instructor/history')
export const fetchSupervisorHistory = () => api.get('/records/supervisor/history')

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

// Delete (supervisor)
export const deleteSupervisorApproval = (id) => api.delete(`/records/supervisor/approval/${id}`)
export const bulkDeleteSupervisorApproval = (ids) => api.post('/records/supervisor/approval/bulk-delete', { ids })

// Public profile
export const fetchUserProfile = (userId) => api.get(`/auth/profile/${userId}`)

// Documents
export const fetchStudentDocuments = () => api.get('/student/documents')
export const uploadStudentDocument = (formData) => api.post('/student/documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const removeStudentDocument = (docType) => api.delete('/student/documents', { params: { document_type: docType } })
export const fetchSupervisorStudentDocuments = (studentId) => api.get(`/supervisor/students/${studentId}/documents`)
export const linkSupervisorIntern = (studentId) => api.post(`/supervisor/interns/${studentId}/link`)
export const fetchInstructorStudentDocuments = (studentId) => api.get(`/instructor/students/${studentId}/documents`)
export const approveStudentOJT = (studentId) => api.post(`/supervisor/students/${studentId}/ojt-approval`)
