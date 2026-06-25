// Centralized sidebar navigation links for each role.
// Import these in any page that needs the sidebar.

export const STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/student/activities', label: 'Activities & Reports', description: 'Log activities & submit reports' },
  { to: '/student/attendance', label: 'Attendance', description: 'Log attendance with photo proof' },
  { to: '/student/history', label: 'History', description: 'All activity & report records' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export const INSTRUCTOR_LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/schedule', label: 'OJT Schedule', description: 'View student attendance & hours' },
  { to: '/instructor/rankings', label: 'Rankings', description: 'Student performance rankings' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export const EMPLOYER_LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/attendance', label: 'Attendance', description: 'View & validate student attendance' },
  { to: '/employer/evaluations', label: 'Evaluations', description: 'Evaluate student performance' },
  { to: '/employer/completion', label: 'Completion & Certificates', description: 'Approve completion & issue certificates' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance rankings' },
  { to: '/employer/tasks', label: 'Tasks', description: 'Assign tasks to students' },
  { to: '/employer/roster', label: 'Roster', description: 'Instructors & their students' },
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
  employer: EMPLOYER_LINKS,
  admin: ADMIN_LINKS,
}
