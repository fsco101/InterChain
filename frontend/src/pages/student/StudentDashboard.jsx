import ProtectedRoute from '../../components/ProtectedRoute'
import RoleDashboard from '../../components/RoleDashboard'
import StudentActions from '../../components/forms/StudentActions'

function StudentDashboardContent() {
  return (
    <RoleDashboard role="student" title="Student Dashboard" description="Track internship activity and reports">
      <StudentActions />
    </RoleDashboard>
  )
}

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboardContent />
    </ProtectedRoute>
  )
}
