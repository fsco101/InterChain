import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchSupervisorRecords, fetchSupervisorStudents, fetchSupervisorActivities } from '../../api/records'
import { useAuth } from '../../context/AuthContext'
import { SUPERVISOR_LINKS } from '../../utils/links'

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

function SupervisorDashboardContent() {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState([])
  const [interns, setInterns] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchSupervisorRecords().then(({ data }) => setApprovals(data.approvals || [])).catch(() => {})
    fetchSupervisorStudents().then(({ data }) => setInterns(data.students || [])).catch(() => {})
    fetchSupervisorActivities().then(({ data }) => setActivities(data.activities || [])).catch(() => {})
  }, [])

  const approved = approvals.filter((r) => r.payload.approved).length
  const approvalData = approvals.slice(0, 7).reverse().map((r) => r.payload.approved ? 1 : 0)

  const activityTimelineMap = {}
  activities.forEach(a => {
    const date = a.payload.activity_date || a.created_at.slice(0, 10)
    if (!activityTimelineMap[date]) activityTimelineMap[date] = 0
    activityTimelineMap[date] += parseFloat(a.payload.hours_spent || 0)
  })
  const activityTimeline = Object.entries(activityTimelineMap)
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14)

  const activeInterns = interns.filter(i => i.is_linked && !i.ojt_completed).length
  const completedInterns = interns.filter(i => i.is_linked && i.ojt_completed).length
  const pendingInterns = interns.filter(i => !i.is_linked).length

  const internStats = [
    { name: 'Active', value: activeInterns, color: '#22c55e' },
    { name: 'Completed', value: completedInterns, color: '#3b82f6' },
    { name: 'Pending', value: pendingInterns, color: '#f59e0b' }
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: 8, color: 'var(--text)', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{label || payload[0].payload.name}</p>
          <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
            {payload[0].value} {payload[0].dataKey === 'hours' ? 'hrs logged' : 'interns'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <DashboardShell links={SUPERVISOR_LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Supervisor Dashboard</p>
            <h2>Welcome back, {user?.full_name}</h2>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard label="Total Approvals" value={approvals.length} sub={`${approved} approved`} sparkData={approvalData} color="#38bdf8" />
          <StatCard label="Total Interns" value={interns.length} sub={`${activeInterns} active`} color="#22c55e" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginTop: 18 }}>
          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Intern Activities Timeline (Last 14 Days)</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              {activityTimeline.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>No intern activity yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorActHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Intern Roster Status</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              {interns.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>No interns in roster.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={internStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {internStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid-two" style={{ marginTop: 18 }}>
          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Quick Actions</p>
            <div className="shortcut-grid">
              <Link to="/supervisor/completion" className="shortcut-card">
                <strong>Approve Completion</strong>
                <p>Review and approve internship completion</p>
              </Link>
              <Link to="/supervisor/rankings" className="shortcut-card">
                <strong>View Rankings</strong>
                <p>See top performing students</p>
              </Link>
              <Link to="/supervisor/roster" className="shortcut-card">
                <strong>Roster</strong>
                <p>View instructors and their students</p>
              </Link>
              <Link to="/supervisor/completion" className="shortcut-card">
                <strong>Issue Certificate</strong>
                <p>Generate blockchain-verified e-certificate</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default function SupervisorDashboard() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <SupervisorDashboardContent />
    </ProtectedRoute>
  )
}
