import React from 'react'

import { dashboardRequest } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import DashboardShell from './DashboardShell'

export default function RoleDashboard({ role, title, description, children }) {
  const { user } = useAuth()
  const [summary, setSummary] = React.useState(null)
  const [error, setError] = React.useState('')
  const links = React.useMemo(() => {
    const byRole = {
      student: [
        { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
        { to: '/student/activities', label: 'Activities', description: 'Log daily activities' },
        { to: '/student/reports', label: 'Reports', description: 'Submit internship reports' },
        { to: '/profile', label: 'Profile', description: 'Edit your account' },
      ],
      instructor: [
        { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
        { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
        { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
        { to: '/profile', label: 'Profile', description: 'Edit your account' },
      ],
      employer: [
        { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
        { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
        { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
        { to: '/profile', label: 'Profile', description: 'Edit your account' },
      ],
      admin: [
        { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
        { to: '/admin/users', label: 'Users', description: 'Manage accounts' },
        { to: '/admin/records', label: 'Records', description: 'Review all records' },
        { to: '/profile', label: 'Profile', description: 'Edit your account' },
      ],
    }
    return byRole[role] || byRole.student
  }, [role])

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await dashboardRequest(role)
        setSummary(data)
      } catch (requestError) {
        setError(requestError?.response?.data?.detail || 'Unable to load dashboard data')
      }
    }

    loadDashboard()
  }, [role])

  return (
    <DashboardShell links={links}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>{description}</h2>
          </div>
        </div>

        <div className="dashboard-card">
          <p className="muted">
            Signed in as {user?.full_name} ({user?.email})
          </p>
          {error ? <p className="error-text">{error}</p> : <p>{summary?.message || 'Loading dashboard data...'}</p>}
        </div>

        {children ? <div className="dashboard-stack">{children}</div> : null}

        <div className="dashboard-grid">
          {(summary?.actions || []).map((action) => (
            <div className="mini-card" key={action}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
