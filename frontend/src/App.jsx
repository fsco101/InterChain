import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import { useAuth } from './context/AuthContext'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentActivitiesPage from './pages/student/StudentActivitiesPage'
import StudentHistoryPage from './pages/student/StudentHistoryPage'
import StudentAttendancePage from './pages/student/StudentAttendancePage'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorSchedulePage from './pages/instructor/InstructorSchedulePage'
import InstructorRosterPage from './pages/instructor/InstructorRosterPage'
import InstructorRankingsPage from './pages/instructor/InstructorRankingsPage'

import EmployerDashboard from './pages/employer/EmployerDashboard'
import EmployerAttendancePage from './pages/employer/EmployerAttendancePage'
import EmployerEvaluationsPage from './pages/employer/EmployerEvaluationsPage'
import EmployerCompletionPage from './pages/employer/EmployerCompletionPage'
import EmployerRankingsPage from './pages/employer/EmployerRankingsPage'
import EmployerTasksPage from './pages/employer/EmployerTasksPage'
import EmployerRosterPage from './pages/employer/EmployerRosterPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminRecordsPage from './pages/admin/AdminRecordsPage'
import NotificationsPage from './pages/NotificationsPage'
import IpfsViewerPage from './pages/IpfsViewerPage'

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
      <Route path="/profile/:userId" element={<UserProfilePage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/activities" element={<StudentActivitiesPage />} />
      <Route path="/student/attendance" element={<StudentAttendancePage />} />
      <Route path="/student/history" element={<StudentHistoryPage />} />

      {/* Instructor */}
      <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      <Route path="/instructor/schedule" element={<InstructorSchedulePage />} />
      <Route path="/instructor/rankings" element={<InstructorRankingsPage />} />
      <Route path="/instructor/roster" element={<InstructorRosterPage />} />

      {/* Employer */}
      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
      <Route path="/employer/attendance" element={<EmployerAttendancePage />} />
      <Route path="/employer/evaluations" element={<EmployerEvaluationsPage />} />
      <Route path="/employer/completion" element={<EmployerCompletionPage />} />
      <Route path="/employer/rankings" element={<EmployerRankingsPage />} />
      <Route path="/employer/tasks" element={<EmployerTasksPage />} />
      <Route path="/employer/roster" element={<EmployerRosterPage />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/records" element={<AdminRecordsPage />} />

      {/* Notifications */}
      <Route path="/notifications" element={<NotificationsPage />} />

      {/* IPFS Records Viewer */}
      <Route path="/ipfs-records" element={<IpfsViewerPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
