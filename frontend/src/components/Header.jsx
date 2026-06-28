import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Notifications from './Notifications'
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

import { spacing, fontSize } from '../utils/responsive'

export default function Header() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = () => {
    if (theme === 'system') setTheme('dark')
    else if (theme === 'dark') setTheme('light')
    else setTheme('system')
  }

  const themeIcons = {
    light: <FiSun size={18} />,
    dark: <FiMoon size={18} />,
    system: <FiMonitor size={18} />
  }

  return (
    <header style={{
      padding: `${spacing.md}px ${spacing.xxxl}px`,
      borderBottom: '1px solid var(--panel-border)',
      background: 'var(--panel)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 10
    }}>
      <Link to="/" className="header-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        InterChain
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xxl }}>
        <button
          onClick={handleThemeToggle}
          className="theme-toggle-btn"
          style={{
            background: 'var(--bg-soft)',
            border: '1px solid var(--panel-border)',
            borderRadius: '999px',
            padding: `${spacing.xs}px ${spacing.md}px`,
            cursor: 'pointer',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.sm}px`,
            fontSize: fontSize.sm,
            boxShadow: 'var(--shadow)',
            transition: 'all 0.2s ease'
          }}
          title="Toggle Theme"
        >
          <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>{themeIcons[theme]}</span>
          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{theme}</span>
        </button>
        {user && <Notifications />}
        {user && (
          <span style={{ fontSize: fontSize.sm, color: 'var(--muted)' }}>
            Logged in as <strong style={{ color: 'var(--text)' }}>{user.full_name}</strong>
          </span>
        )}
      </div>
    </header>
  )
}
