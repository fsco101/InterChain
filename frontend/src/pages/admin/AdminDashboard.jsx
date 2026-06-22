import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchAdminDashboard } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/admin/users', label: 'Users', description: 'Manage accounts' },
  { to: '/admin/records', label: 'Records', description: 'Review all records' },
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

function AdminDashboardContent() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    fetchAdminDashboard().then(({ data }) => setCounts(data.counts || {})).catch(() => {})
  }, [])

  const totalRecords = (counts.activity_logs || 0) + (counts.student_reports || 0) +
    (counts.attendance_records || 0) + (counts.performance_evaluations || 0) + (counts.completion_approvals || 0)

  const sparkPlaceholder = [1, 2, 3, 4, 5, 6, 7]

  const shortcuts = [
    { label: 'Manage Users', to: '/admin/users', desc: 'View users and change roles' },
    { label: 'Review Records', to: '/admin/records', desc: 'Browse all blockchain records' },
  ]

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h2>Welcome back, {user?.full_name}</h2>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard label="Total Users" value={counts.users ?? '—'} sub="registered accounts" sparkData={sparkPlaceholder} color="#38bdf8" />
          <StatCard label="Total Records" value={totalRecords || '—'} sub="across all collections" sparkData={sparkPlaceholder} color="#22c55e" />
          <StatCard label="Activity Logs" value={counts.activity_logs ?? '—'} sub="student activities" sparkData={sparkPlaceholder} color="#a78bfa" />
          <StatCard label="Evaluations" value={counts.performance_evaluations ?? '—'} sub="performance records" sparkData={sparkPlaceholder} color="#f59e0b" />
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
            <p className="eyebrow" style={{ marginBottom: 10 }}>Collection Summary</p>
            <div className="summary-grid">
              {Object.entries(counts).map(([label, value]) => (
                <div key={label} className="mini-card">
                  <strong>{value}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{label.replaceAll('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
