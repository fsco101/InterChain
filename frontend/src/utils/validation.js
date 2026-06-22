function validateRequired(value, label) {
  if (!String(value || '').trim()) {
    return `${label} is required`
  }
  return ''
}

function validateMinLength(value, label, min) {
  const error = validateRequired(value, label)
  if (error) return error
  if (String(value).trim().length < min) {
    return `${label} must be at least ${min} characters`
  }
  return ''
}

function validateDate(value, label) {
  const error = validateRequired(value, label)
  if (error) return error
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return `${label} must be a valid date`
  }
  return ''
}

function validateNumber(value, label, { min, max } = {}) {
  const error = validateRequired(value, label)
  if (error) return error
  const num = Number(value)
  if (Number.isNaN(num)) return `${label} must be a number`
  if (min !== undefined && num < min) return `${label} must be at least ${min}`
  if (max !== undefined && num > max) return `${label} must be at most ${max}`
  return ''
}

export function validateStudentActivity(values) {
  return (
    validateMinLength(values.internship_id, 'Internship ID', 3) ||
    validateDate(values.activity_date, 'Activity date') ||
    validateMinLength(values.title, 'Activity title', 3) ||
    validateMinLength(values.description, 'Activity description', 10) ||
    validateNumber(values.hours_spent, 'Hours spent', { min: 0.5, max: 24 }) ||
    ''
  )
}

export function validateStudentReport(values) {
  return (
    validateMinLength(values.internship_id, 'Internship ID', 3) ||
    validateMinLength(values.report_title, 'Report title', 3) ||
    validateMinLength(values.summary, 'Report summary', 20) ||
    ''
  )
}

export function validateInstructorAttendance(values) {
  return (
    validateMinLength(values.internship_id, 'Internship ID', 3) ||
    validateMinLength(values.student_id, 'Student ID', 5) ||
    validateDate(values.attendance_date, 'Attendance date') ||
    validateRequired(values.status, 'Attendance status') ||
    ''
  )
}

export function validateInstructorEvaluation(values) {
  return (
    validateMinLength(values.internship_id, 'Internship ID', 3) ||
    validateMinLength(values.student_id, 'Student ID', 5) ||
    validateNumber(values.score, 'Score', { min: 1, max: 10 }) ||
    validateMinLength(values.feedback, 'Feedback', 10) ||
    ''
  )
}

export function validateEmployerApproval(values) {
  return (
    validateMinLength(values.internship_id, 'Internship ID', 3) ||
    validateMinLength(values.student_id, 'Student ID', 5) ||
    validateDate(values.approval_date, 'Approval date') ||
    ''
  )
}

export function validateProfile(values) {
  return (
    validateMinLength(values.full_name, 'Full name', 2) ||
    validateMinLength(values.email, 'Email', 5) ||
    (values.password && values.password.trim().length > 0 && values.password.trim().length < 8
      ? 'Password must be at least 8 characters'
      : '') ||
    (values.password && values.password.trim() !== (values.confirm_password || '').trim()
      ? 'Passwords do not match'
      : '') ||
    ''
  )
}

export function validateAdminUser(values, isEditing) {
  return (
    validateMinLength(values.full_name, 'Full name', 2) ||
    validateMinLength(values.email, 'Email', 5) ||
    (!isEditing ? validateMinLength(values.password, 'Password', 8) : '') ||
    (values.password && values.password.trim().length > 0 && values.password.trim().length < 8
      ? 'Password must be at least 8 characters'
      : '') ||
    ''
  )
}
