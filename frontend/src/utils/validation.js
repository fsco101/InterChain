function validateRequired(value, label) {
  if (!String(value || '').trim()) {
    return `${label} is required`
  }

  return ''
}

function validateDate(value, label) {
  const error = validateRequired(value, label)
  if (error) {
    return error
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return `${label} must be a valid date`
  }

  return ''
}

function validateNumber(value, label, { min, max } = {}) {
  const error = validateRequired(value, label)
  if (error) {
    return error
  }

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return `${label} must be a number`
  }

  if (min !== undefined && numericValue < min) {
    return `${label} must be at least ${min}`
  }

  if (max !== undefined && numericValue > max) {
    return `${label} must be at most ${max}`
  }

  return ''
}

export function validateStudentActivity(values) {
  return (
    validateRequired(values.internship_id, 'Internship ID') ||
    validateDate(values.activity_date, 'Activity date') ||
    validateRequired(values.title, 'Activity title') ||
    validateRequired(values.description, 'Activity description') ||
    validateNumber(values.hours_spent, 'Hours spent', { min: 0.5, max: 24 }) ||
    ''
  )
}

export function validateStudentReport(values) {
  return (
    validateRequired(values.internship_id, 'Internship ID') ||
    validateRequired(values.report_title, 'Report title') ||
    validateRequired(values.summary, 'Report summary') ||
    ''
  )
}

export function validateInstructorAttendance(values) {
  return (
    validateRequired(values.internship_id, 'Internship ID') ||
    validateRequired(values.student_id, 'Student ID') ||
    validateDate(values.attendance_date, 'Attendance date') ||
    validateRequired(values.status, 'Attendance status') ||
    ''
  )
}

export function validateInstructorEvaluation(values) {
  return (
    validateRequired(values.internship_id, 'Internship ID') ||
    validateRequired(values.student_id, 'Student ID') ||
    validateNumber(values.score, 'Score', { min: 1, max: 10 }) ||
    validateRequired(values.feedback, 'Feedback') ||
    ''
  )
}

export function validateEmployerApproval(values) {
  return (
    validateRequired(values.internship_id, 'Internship ID') ||
    validateRequired(values.student_id, 'Student ID') ||
    validateDate(values.approval_date, 'Approval date') ||
    ''
  )
}
