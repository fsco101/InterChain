import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const roleHome = {
  student: '/student/dashboard',
  instructor: '/instructor/dashboard',
  employer: '/employer/dashboard',
  admin: '/admin/dashboard',
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="page-shell center-copy">Loading session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || '/'} replace />
  }

  return children
}
