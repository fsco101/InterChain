import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import InstructorActions from '../../components/forms/InstructorActions'

const LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
  { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
  { to: '/instructor/history', label: 'History', description: 'All attendance & evaluation records' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export default function InstructorRecordsPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <div className="dashboard-topbar">
            <div>
              <p className="eyebrow">Instructor</p>
              <h2>Attendance &amp; Evaluations</h2>
            </div>
          </div>
          <InstructorActions />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
