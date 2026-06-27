// Centralized sidebar navigation links for each role.
// Import these in any page that needs the sidebar.

export const STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/student/activities', label: 'Activities & Reports', description: 'Log activities & submit reports' },
  { to: '/student/attendance', label: 'Attendance', description: 'Log attendance with photo proof' },
  { to: '/student/tasks', label: 'Given Tasks', description: 'Tasks assigned by your supervisor' },
  { to: '/student/history', label: 'History', description: 'All activity & report records' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export const INSTRUCTOR_LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/schedule', label: 'OJT Schedule', description: 'View student attendance & hours' },
  { to: '/instructor/hours', label: 'Required Hours', description: 'Set & track student required hours' },
  { to: '/instructor/rankings', label: 'Rankings', description: 'Student performance rankings' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export const SUPERVISOR_LINKS = [
  { to: '/supervisor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/supervisor/attendance', label: 'Attendance', description: 'View & validate student attendance' },
  { to: '/supervisor/evaluations', label: 'Evaluations', description: 'Evaluate student performance' },
  { to: '/supervisor/completion', label: 'Completion & Certificates', description: 'Approve completion & issue certificates' },
  { to: '/supervisor/rankings', label: 'Rankings', description: 'Student performance rankings' },
  { to: '/supervisor/tasks', label: 'Tasks', description: 'Assign tasks to students' },
  { to: '/supervisor/roster', label: 'Instructor Roster', description: 'Instructors in your roster' },
  { to: '/supervisor/interns', label: 'Intern Roster', description: 'Interns under your supervision' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/admin/users', label: 'Users', description: 'Manage users' },
  { to: '/admin/records', label: 'Records', description: 'Review all records' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export const ROLE_LINKS = {
  student: STUDENT_LINKS,
  instructor: INSTRUCTOR_LINKS,
  supervisor: SUPERVISOR_LINKS,
  admin: ADMIN_LINKS,
}
