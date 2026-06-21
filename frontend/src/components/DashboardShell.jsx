import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

import AvatarBadge from './AvatarBadge'
import { useAuth } from '../context/AuthContext'

function getNameBadge(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function DashboardShell({ links = [], children }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('internchain_sidebar_collapsed') === 'true')

  useEffect(() => {
    localStorage.setItem('internchain_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  return (
    <div className={`dashboard-layout${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`dashboard-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-brand-block">
          <div className="sidebar-brand-row">
            <Link className="sidebar-brand" to="/">
              InterChain
            </Link>
            <button className="sidebar-collapse-button" type="button" onClick={() => setCollapsed((current) => !current)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? '›' : '‹'}
            </button>
          </div>
          <p className="muted sidebar-brand-copy">Blockchain-backed internship management</p>
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-user-top">
            <AvatarBadge name={user?.full_name} avatarUrl={user?.avatar_url} size={56} />
            <div>
              <p className="eyebrow">Signed in</p>
              <strong>{user?.full_name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <span className="role-chip">{user?.role}</span>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="sidebar-link-badge" aria-hidden="true">
                {getNameBadge(link.label)}
              </span>
              <span className="sidebar-link-text">{link.label}</span>
              {link.description ? <small>{link.description}</small> : null}
            </NavLink>
          ))}
        </nav>

        <button className="secondary-button sidebar-logout" onClick={logout} type="button">
          {collapsed ? 'Out' : 'Logout'}
        </button>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  )
}