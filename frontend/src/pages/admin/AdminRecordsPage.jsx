import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import RecordReviewPanel from '../../components/review/RecordReviewPanel'

const LINKS = [
  { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/admin/users', label: 'Users', description: 'Manage accounts' },
  { to: '/admin/records', label: 'Records', description: 'Review all records' },
  { to: '/notifications', label: 'Notifications', description: 'View system alerts' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export default function AdminRecordsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <div className="dashboard-topbar">
            <div>
              <p className="eyebrow">Admin</p>
              <h2>Blockchain Records Review</h2>
            </div>
          </div>
          <RecordReviewPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
