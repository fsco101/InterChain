import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchStudentRecords } from '../../api/records'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/student/activities', label: 'Activities', description: 'Log daily activities' },
  { to: '/student/reports', label: 'Reports', description: 'Submit internship reports' },
  { to: '/student/history', label: 'History', description: 'All activity & report records' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function StatCard({ label, value, sub, sparkData, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          {sub && <p className="stat-sub">{sub}</p>}
        </div>
        <Sparkline data={sparkData} color={color} height={44} width={100} />
      </div>
    </div>
  )
}

function StudentDashboardContent() {
  const { user } = useAuth()
  const [records, setRecords] = useState({ activity_logs: [], reports: [] })

  useEffect(() => {
    fetchStudentRecords().then(({ data }) => setRecords(data)).catch(() => {})
  }, [])

  const activities = records.activity_logs || []
  const reports = records.reports || []
  const totalHours = activities.reduce((s, r) => s + (r.payload.hours_spent || 0), 0)

  // last 7 activity hours as sparkline data
  const hoursData = activities.slice(0, 7).reverse().map((r) => r.payload.hours_spent || 0)
  const reportsData = reports.slice(0, 7).reverse().map((_, i) => i + 1)

  const shortcuts = [
    { label: 'Log Activity', to: '/student/activities', desc: 'Record your daily internship work' },
    { label: 'Submit Report', to: '/student/activities', desc: 'Write and submit an internship report' },
  ]

  const recent = activities.slice(0, 5)

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Student Dashboard</p>
            <h2>Welcome back, {user?.full_name}</h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {user?.role_id && (
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>{user.role_id}</span>
              )}
              {user?.internship_id && (
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#a78bfa' }}>{user.internship_id}</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard label="Total Activities" value={activities.length} sub="logged entries" sparkData={hoursData} color="#38bdf8" />
          <StatCard label="Hours Logged" value={totalHours.toFixed(1)} sub="cumulative hours" sparkData={hoursData} color="#22c55e" />
          <StatCard label="Reports Submitted" value={reports.length} sub="internship reports" sparkData={reportsData} color="#a78bfa" />
        </div>

        <div className="grid-two" style={{ marginTop: 18 }}>
          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Quick Actions</p>
            <div className="shortcut-grid">
              {shortcuts.map((s) => (
                <Link key={s.label} to={s.to} className="shortcut-card">
                  <strong>{s.label}</strong>
                  <p>{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Recent Activities</p>
            {recent.length === 0 ? (
              <p className="muted">No activities yet. <Link to="/student/activities" style={{ color: 'var(--accent)' }}>Log one now</Link></p>
            ) : (
              <div className="stack-list">
                {recent.map((r) => (
                  <div key={r.id} className="recent-row">
                    <span className="recent-title">{r.payload.title}</span>
                    <span className="recent-meta">{r.payload.hours_spent}h · {r.payload.activity_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardContent />
    </ProtectedRoute>
  )
}
