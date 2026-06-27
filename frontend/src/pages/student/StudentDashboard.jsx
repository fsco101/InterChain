import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
