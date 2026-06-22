import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchInstructorRecords } from '../../api/records'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
  { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
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

function InstructorDashboardContent() {
  const { user } = useAuth()
  const [records, setRecords] = useState({ attendance: [], evaluations: [] })

  useEffect(() => {
    fetchInstructorRecords().then(({ data }) => setRecords(data)).catch(() => {})
  }, [])

  const attendance = records.attendance || []
  const evaluations = records.evaluations || []
  const presentCount = attendance.filter((r) => r.payload.status === 'present').length
  const avgScore = evaluations.length
    ? (evaluations.reduce((s, r) => s + (r.payload.score || 0), 0) / evaluations.length).toFixed(1)
    : '—'

  const attendData = attendance.slice(0, 7).reverse().map((r) => r.payload.status === 'present' ? 1 : 0)
  const scoreData = evaluations.slice(0, 7).reverse().map((r) => r.payload.score || 0)

  // student rank by avg score
  const scoreMap = evaluations.reduce((acc, r) => {
    const id = r.payload.student_id
    if (!acc[id]) acc[id] = { total: 0, count: 0 }
    acc[id].total += r.payload.score || 0
    acc[id].count++
    return acc
  }, {})
  const ranked = Object.entries(scoreMap)
    .map(([id, v]) => ({ id, avg: (v.total / v.count).toFixed(1) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Instructor Dashboard</p>
            <h2>Welcome back, {user?.full_name}</h2>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard label="Attendance Records" value={attendance.length} sub={`${presentCount} present`} sparkData={attendData} color="#38bdf8" />
          <StatCard label="Evaluations" value={evaluations.length} sub="submitted" sparkData={scoreData} color="#22c55e" />
          <StatCard label="Avg Score" value={avgScore} sub="across all students" sparkData={scoreData} color="#f59e0b" />
        </div>

        <div className="grid-two" style={{ marginTop: 18 }}>
          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Quick Actions</p>
            <div className="shortcut-grid">
              <Link to="/instructor/attendance" className="shortcut-card">
                <strong>Record Attendance</strong>
                <p>Mark student present, absent or late</p>
              </Link>
              <Link to="/instructor/evaluations" className="shortcut-card">
                <strong>Submit Evaluation</strong>
                <p>Score and give feedback to a student</p>
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Student Rankings</p>
            {ranked.length === 0 ? (
              <p className="muted">No evaluations yet.</p>
            ) : (
              <div className="stack-list">
                {ranked.map((s, i) => (
                  <div key={s.id} className="recent-row">
                    <span className="rank-badge">{i + 1}</span>
                    <span className="recent-title">{s.id}</span>
                    <span className="recent-meta">avg {s.avg}/10</span>
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

export default function InstructorDashboard() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <InstructorDashboardContent />
    </ProtectedRoute>
  )
}
