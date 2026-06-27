import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import StudentActivityForm from '../../components/forms/StudentActions'
import { STUDENT_LINKS } from '../../utils/links'
import { useAuth } from '../../context/AuthContext'

export default function StudentActivitiesPage() {
  const { user } = useAuth()
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardShell links={STUDENT_LINKS}>
        <div className="page-shell dashboard-shell">
          <div className="dashboard-topbar">
            <div>
              <p className="eyebrow">Student</p>
              <h2>Activities &amp; Reports</h2>
            </div>
          </div>
          {!user?.supervisor_id && (
            <div className="dashboard-card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: 20 }}>
              <h3 style={{ color: '#f59e0b', margin: '0 0 8px' }}>Not Approved Yet</h3>
              <p className="muted" style={{ margin: 0 }}>You cannot log activities until your supervisor has approved your OJT link.</p>
            </div>
          )}
          <StudentActivityForm user={user} />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
