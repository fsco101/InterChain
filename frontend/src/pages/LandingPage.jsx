import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()

  const roleLinks = [
    { label: 'Student', path: '/student/dashboard', description: 'Log activities and submit internship reports.' },
    { label: 'Instructor', path: '/instructor/dashboard', description: 'Validate progress and monitor performance.' },
    { label: 'Supervisor', path: '/supervisor/dashboard', description: 'Review attendance and approve completion.' },
    { label: 'Admin', path: '/admin/dashboard', description: 'Review all records and monitor blockchain activity.' },
  ]

  return (
    <div className="page-shell hero-shell">
      <section className="hero-card">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="eyebrow">InternChain</p>
          <h1>Blockchain-backed internship verification for students, instructors, and supervisors.</h1>
          <p className="hero-copy">
            Capture internship activity, attendance, and performance evidence in one flow with role-based access and MongoDB persistence.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to={user ? `/${user.role}/dashboard` : '/signup'}>
              {user ? 'Go to dashboard' : 'Create account'}
            </Link>
            <Link className="secondary-button" to="/login">
              Login
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="feature-grid">
        {roleLinks.map((role) => (
          <Link key={role.label} to={role.path} className="feature-card">
            <span>{role.label}</span>
            <p>{role.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
