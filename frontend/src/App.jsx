import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import StudentDashboard from './pages/student/StudentDashboard'
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import EmployerDashboard from './pages/employer/EmployerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './context/AuthContext'

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
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
