import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import StudentActivityForm from '../../components/forms/StudentActions'

const LINKS = [
  { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/student/activities', label: 'Activities', description: 'Log daily activities' },
  { to: '/student/reports', label: 'Reports', description: 'Submit internship reports' },
  { to: '/student/history', label: 'History', description: 'All activity & report records' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export default function StudentActivitiesPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <div className="dashboard-topbar">
            <div>
              <p className="eyebrow">Student</p>
              <h2>Activities &amp; Reports</h2>
            </div>
          </div>
          <StudentActivityForm />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
