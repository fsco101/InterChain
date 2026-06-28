import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()

  const roleLinks = [
    { label: 'Student', path: '/student/dashboard', description: 'Log activities and submit verified internship reports.', icon: '🎓' },
    { label: 'Instructor', path: '/instructor/dashboard', description: 'Validate progress and monitor performance on-chain.', icon: '📝' },
    { label: 'Supervisor', path: '/supervisor/dashboard', description: 'Review attendance and approve completion securely.', icon: '🏢' },
    { label: 'Admin', path: '/admin/dashboard', description: 'Audit all records and monitor the blockchain network.', icon: '🛡️' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="page-shell hero-shell">
      <div className="blockchain-bg-effect"></div>
      
      <section className="hero-card modern-hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <div className="badge-glow">
            <span className="eyebrow">Web3 Verified</span>
          </div>
          <h1>InterChain. The Future of <span className="text-gradient">Internship Verification</span>.</h1>
          <p className="hero-copy">
            Secure, immutable, and transparent. Capture internship activity, attendance, and performance evidence backed by Polygon blockchain technology.
          </p>
          <div className="hero-actions">
            <Link className="primary-button pulse-btn" to={user ? `/${user.role}/dashboard` : '/signup'}>
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Link>
            {!user && (
              <Link className="secondary-button" to="/login">
                Login to Account
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      <motion.section 
        className="feature-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {roleLinks.map((role) => (
          <motion.div key={role.label} variants={itemVariants}>
            <Link to={role.path} className="feature-card blockchain-card">
              <div className="card-icon">{role.icon}</div>
              <span>{role.label}</span>
              <p>{role.description}</p>
            </Link>
          </motion.div>
        ))}
      </motion.section>
    </div>
  )
}

