import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchAdminDashboard } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/admin/users', label: 'Users', description: 'Manage accounts' },
  { to: '/admin/records', label: 'Records', description: 'Review all records' },
  { to: '/notifications', label: 'Notifications', description: 'View system alerts' },
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

const ROLE_COLORS = {
  admin: '#ef4444',
  instructor: '#38bdf8',
  supervisor: '#a78bfa',
  student: '#22c55e'
}

function AdminDashboardContent() {
  const { user } = useAuth()
  const [data, setData] = useState({ counts: {}, user_roles: {}, activity_timeline: [] })

  useEffect(() => {
    fetchAdminDashboard().then(({ data }) => setData(data)).catch(() => {})
  }, [])

  const counts = data.counts || {}
  const totalRecords = (counts.activity_logs || 0) + (counts.student_reports || 0) +
    (counts.attendance_records || 0) + (counts.performance_evaluations || 0) + (counts.completion_approvals || 0)

  const sparkPlaceholder = [1, 2, 3, 4, 5, 6, 7]

  const rolesData = Object.entries(data.user_roles || {}).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    count,
    roleKey: role
  }))

  const shortcuts = [
    { label: 'Manage Users', to: '/admin/users', desc: 'View users and change roles' },
    { label: 'Review Records', to: '/admin/records', desc: 'Browse all blockchain records' },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: 8, color: 'var(--text)', boxShadow: 'var(--shadow)' }}>
          <p className="label" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{label}</p>
          <p className="intro" style={{ margin: '4px 0 0', fontWeight: 600 }}>{payload[0].value} records</p>
        </div>
      )
    }
    return null
  }

  const RoleTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: 8, color: 'var(--text)', boxShadow: 'var(--shadow)' }}>
          <p className="label" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{label}</p>
          <p className="intro" style={{ margin: '4px 0 0', fontWeight: 600 }}>{payload[0].value} users</p>
        </div>
      )
    }
    return null
  }

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginTop: 18 }}>
          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>System Activity (14 Days)</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.activity_timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>User Distribution</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rolesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<RoleTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {rolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.roleKey] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
                  <span style={{ color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'capitalize' }}>{label.replaceAll('_', ' ')}</span>
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
