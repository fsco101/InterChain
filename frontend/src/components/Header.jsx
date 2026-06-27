import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Notifications from './Notifications'

export default function Header() {
  const { user } = useAuth()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '16px 32px',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      background: 'rgba(2, 6, 23, 0.75)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <Link to="/" className="header-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        InterChain
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {user && <Notifications />}
        {user && (
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Logged in as <strong style={{ color: 'var(--text)' }}>{user.full_name}</strong>
          </span>
        )}
      </div>
    </header>
  )
}
