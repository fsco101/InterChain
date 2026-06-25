import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import StudentActivityForm from '../../components/forms/StudentActions'
import { STUDENT_LINKS } from '../../utils/links'

export default function StudentActivitiesPage() {
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
          <StudentActivityForm />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
