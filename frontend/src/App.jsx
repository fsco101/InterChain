import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './context/AuthContext'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentActivitiesPage from './pages/student/StudentActivitiesPage'
import StudentHistoryPage from './pages/student/StudentHistoryPage'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorRecordsPage from './pages/instructor/InstructorRecordsPage'
import InstructorRosterPage from './pages/instructor/InstructorRosterPage'
import InstructorHistoryPage from './pages/instructor/InstructorHistoryPage'

import EmployerDashboard from './pages/employer/EmployerDashboard'
import EmployerApprovalsPage from './pages/employer/EmployerApprovalsPage'
import EmployerHistoryPage from './pages/employer/EmployerHistoryPage'
import EmployerRankingsPage from './pages/employer/EmployerRankingsPage'
import EmployerRosterPage from './pages/employer/EmployerRosterPage'
import EmployerCertificatesPage from './pages/employer/EmployerCertificatesPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminRecordsPage from './pages/admin/AdminRecordsPage'

function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/activities" element={<StudentActivitiesPage />} />
      <Route path="/student/reports" element={<StudentActivitiesPage />} />
      <Route path="/student/history" element={<StudentHistoryPage />} />

      {/* Instructor */}
      <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      <Route path="/instructor/attendance" element={<InstructorRecordsPage />} />
      <Route path="/instructor/evaluations" element={<InstructorRecordsPage />} />
      <Route path="/instructor/history" element={<InstructorHistoryPage />} />
      <Route path="/instructor/roster" element={<InstructorRosterPage />} />

      {/* Employer */}
      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
      <Route path="/employer/approvals" element={<EmployerApprovalsPage />} />
      <Route path="/employer/history" element={<EmployerHistoryPage />} />
      <Route path="/employer/rankings" element={<EmployerRankingsPage />} />
      <Route path="/employer/roster" element={<EmployerRosterPage />} />
      <Route path="/employer/certificates" element={<EmployerCertificatesPage />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/records" element={<AdminRecordsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
