import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchStudentRecords, fetchUserProfile } from '../../api/records'
import { useAuth } from '../../context/AuthContext'
import { STUDENT_LINKS } from '../../utils/links'

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
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetchStudentRecords().then(({ data }) => setRecords(data)).catch(() => {})
    if (user?.id) {
      fetchUserProfile(user.id).then(({ data }) => setProfile(data)).catch(() => {})
    }
  }, [user])

  const activities = records.activity_logs || []
  const reports = records.reports || []

  // sparkline data
  const hoursData = activities.slice(0, 7).reverse().map((r) => r.payload.hours_spent || 0)
  const reportsData = reports.slice(0, 7).reverse().map((_, i) => i + 1)

  const shortcuts = [
    { label: 'Log Activity', to: '/student/activities', desc: 'Record your daily internship work' },
    { label: 'Submit Report', to: '/student/activities', desc: 'Write and submit an internship report' },
  ]

  const recent = activities.slice(0, 5)
  const tasks = profile?.tasks || []
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed')

  const activityTimelineMap = {}
  activities.forEach(a => {
    const date = a.payload.activity_date
    if (date) {
      if (!activityTimelineMap[date]) activityTimelineMap[date] = 0
      activityTimelineMap[date] += parseFloat(a.payload.hours_spent || 0)
    }
  })
  const timelineData = Object.entries(activityTimelineMap)
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14)

  const taskStats = [
    { name: 'Completed', value: completedTasks.length },
    { name: 'Pending', value: tasks.length - completedTasks.length }
  ]
  const COLORS = ['#22c55e', '#3b82f6']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: 8, color: 'var(--text)', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{label || payload[0].name}</p>
          <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{payload[0].value} {payload[0].name === 'hours' ? 'hrs' : 'tasks'}</p>
        </div>
      )
    }
    return null
  }

  return (
    <DashboardShell links={STUDENT_LINKS}>
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
          <StatCard 
            label="Attendance Hours" 
            value={profile?.attendance_summary?.total_hours || '0.0'} 
            sub="total logged" 
            color="#38bdf8" 
          />
          <StatCard 
            label="Activity Hours" 
            value={profile?.activity_summary?.total_hours || '0.0'} 
            sub="cumulative hours" 
            sparkData={hoursData} 
            color="#a78bfa" 
          />
          <StatCard 
            label="Validated Hours" 
            value={profile?.attendance_summary?.validated_hours || '0.0'} 
            sub="approved by supervisor" 
            color="#22c55e" 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginTop: 18 }}>
          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Activity Hours (Last 14 Active Days)</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              {timelineData.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>No activity data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#a78bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Task Distribution</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              {tasks.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>No tasks assigned yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {taskStats.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index] }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{entry.name} ({entry.value})</span>
                </div>
              ))}
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

            <p className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>Completed Tasks</p>
            {completedTasks.length === 0 ? (
              <p className="muted">No completed tasks.</p>
            ) : (
              <div className="stack-list">
                {completedTasks.map((t) => (
                  <div key={t.id} className="recent-row" style={{ borderLeft: '3px solid #22c55e', paddingLeft: 10 }}>
                    <span className="recent-title">{t.title}</span>
                    <span className="recent-meta" style={{ color: '#22c55e' }}>✓ {t.status}</span>
                  </div>
                ))}
              </div>
            )}
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
