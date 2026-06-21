import ProtectedRoute from '../../components/ProtectedRoute'
import RoleDashboard from '../../components/RoleDashboard'
import EmployerActions from '../../components/forms/EmployerActions'

function EmployerDashboardContent() {
  return (
    <RoleDashboard role="employer" title="Employer Dashboard" description="Approve attendance and completion">
      <EmployerActions />
    </RoleDashboard>
  )
}

export default function EmployerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <EmployerDashboardContent />
    </ProtectedRoute>
  )
}
