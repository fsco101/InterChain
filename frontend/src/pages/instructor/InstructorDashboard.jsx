import ProtectedRoute from '../../components/ProtectedRoute'
import RoleDashboard from '../../components/RoleDashboard'
import InstructorActions from '../../components/forms/InstructorActions'

function InstructorDashboardContent() {
  return (
    <RoleDashboard role="instructor" title="Instructor Dashboard" description="Validate progress and evaluations">
      <InstructorActions />
    </RoleDashboard>
  )
}

export default function InstructorDashboard() {
  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <InstructorDashboardContent />
    </ProtectedRoute>
  )
}
