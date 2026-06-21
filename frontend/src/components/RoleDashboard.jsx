import React from 'react'

import { dashboardRequest } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import DashboardShell from './DashboardShell'

export default function RoleDashboard({ role, title, description, children }) {
  const { user } = useAuth()
  const [summary, setSummary] = React.useState(null)
  const [error, setError] = React.useState('')
  const links = React.useMemo(() => {
    const baseLinks = [
      { to: `/${role}/dashboard`, label: 'Overview', description: 'Role dashboard', end: true },
      { to: '/profile', label: 'Profile', description: 'Edit your account' },
    ]

    if (role === 'admin') {
      baseLinks.splice(1, 0, { to: '/admin/users', label: 'Users', description: 'Manage accounts' })
    }

    return baseLinks
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
