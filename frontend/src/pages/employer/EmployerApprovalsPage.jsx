import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import EmployerActions from '../../components/forms/EmployerActions'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

export default function EmployerApprovalsPage() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <div className="dashboard-topbar">
            <div>
              <p className="eyebrow">Employer</p>
              <h2>Completion Approvals</h2>
            </div>
          </div>
          <EmployerActions />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
