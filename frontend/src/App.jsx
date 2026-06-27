import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentActivitiesPage from './pages/student/StudentActivitiesPage'
import StudentHistoryPage from './pages/student/StudentHistoryPage'
import StudentAttendancePage from './pages/student/StudentAttendancePage'
import StudentTasksPage from './pages/student/StudentTasksPage'
import StudentDocumentsPage from './pages/student/StudentDocumentsPage'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorSchedulePage from './pages/instructor/InstructorSchedulePage'
import InstructorRosterPage from './pages/instructor/InstructorRosterPage'
import InstructorHoursTrackingPage from './pages/instructor/InstructorHoursTrackingPage'

import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import SupervisorAttendancePage from './pages/supervisor/SupervisorAttendancePage'
import SupervisorActivitiesPage from './pages/supervisor/SupervisorActivitiesPage'
import SupervisorEvaluationsPage from './pages/supervisor/SupervisorEvaluationsPage'
import SupervisorCompletionPage from './pages/supervisor/SupervisorCompletionPage'
import SupervisorTasksPage from './pages/supervisor/SupervisorTasksPage'
import SupervisorRosterPage from './pages/supervisor/SupervisorRosterPage'
import SupervisorInternRosterPage from './pages/supervisor/SupervisorInternRosterPage'
import StudentDocumentsViewPage from './pages/supervisor/StudentDocumentsViewPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminRecordsPage from './pages/admin/AdminRecordsPage'
import NotificationsPage from './pages/NotificationsPage'
import IpfsViewerPage from './pages/IpfsViewerPage'
import RankingsPage from './pages/RankingsPage'

function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />
}

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div id="main-scroll-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
      <Route path="/student/tasks" element={<StudentTasksPage />} />
      <Route path="/student/documents" element={<StudentDocumentsPage />} />

      {/* Instructor */}
      <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      <Route path="/instructor/schedule" element={<InstructorSchedulePage />} />
      <Route path="/instructor/hours" element={<InstructorHoursTrackingPage />} />
      <Route path="/instructor/roster" element={<InstructorRosterPage />} />
      <Route path="/instructor/interns/:studentId/documents" element={<StudentDocumentsViewPage />} />

      {/* Supervisor */}
      <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
      <Route path="/supervisor/attendance" element={<SupervisorAttendancePage />} />
      <Route path="/supervisor/activities" element={<SupervisorActivitiesPage />} />
      <Route path="/supervisor/evaluations" element={<SupervisorEvaluationsPage />} />
      <Route path="/supervisor/completion" element={<SupervisorCompletionPage />} />
      <Route path="/supervisor/tasks" element={<SupervisorTasksPage />} />
      <Route path="/supervisor/roster" element={<SupervisorRosterPage />} />
      <Route path="/supervisor/interns" element={<SupervisorInternRosterPage />} />
      <Route path="/supervisor/interns/:studentId/documents" element={<StudentDocumentsViewPage />} />
      {/* Global Rankings */}
      <Route path="/rankings" element={<RankingsPage />} />

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
      </div>
      <Footer />
    </div>
  )
}
