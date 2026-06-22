import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

import AvatarBadge from './AvatarBadge'
import { useAuth } from '../context/AuthContext'
import { confirmLogout, showSignedOut } from '../utils/alerts'

const ICONS = {
  Overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  Users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="3" /><path d="M21 20c0-3.3-2.7-6-6-6" />
    </svg>
  ),
  Activities: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Attendance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  ),
  Evaluations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Approvals: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Rankings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Records: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
}

const LOGOUT_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const COLLAPSE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const EXPAND_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

function getIcon(label) {
  return ICONS[label] ?? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export default function DashboardShell({ links = [], children }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('internchain_sidebar_collapsed') === 'true')

  useEffect(() => {
    localStorage.setItem('internchain_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  const handleLogout = async () => {
    const confirmed = await confirmLogout()
    if (!confirmed) return
    showSignedOut(user?.full_name || 'User')
    logout()
  }

  return (
    <div className={`dashboard-layout${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`dashboard-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-brand-block">
          <div className="sidebar-brand-row">
            {!collapsed && (
              <Link className="sidebar-brand" to="/">
                InterChain
              </Link>
            )}
            <button
              className="sidebar-collapse-button"
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? EXPAND_ICON : COLLAPSE_ICON}
            </button>
          </div>
          {!collapsed && <p className="muted sidebar-brand-copy">Blockchain-backed internship management</p>}
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-user-top">
            <AvatarBadge name={user?.full_name} avatarUrl={user?.avatar_url} size={collapsed ? 40 : 48} />
            {!collapsed && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 2 }}>Signed in</p>
                <strong>{user?.full_name}</strong>
                <br />
                <span style={{ fontSize: '0.82rem' }}>{user?.email}</span>
              </div>
            )}
          </div>
          {!collapsed && <span className="role-chip">{user?.role}</span>}
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              title={collapsed ? link.label : undefined}
            >
              <span className="sidebar-link-icon" aria-hidden="true">
                {getIcon(link.label)}
              </span>
              {!collapsed && (
                <span className="sidebar-link-content">
                  <span className="sidebar-link-text">{link.label}</span>
                  {link.description ? <small>{link.description}</small> : null}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          className="sidebar-logout-button"
          onClick={handleLogout}
          type="button"
          title={collapsed ? 'Logout' : undefined}
        >
          {LOGOUT_ICON}
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  )
}