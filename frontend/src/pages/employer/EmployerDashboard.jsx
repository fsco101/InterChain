import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchEmployerRecords, fetchInstructorRecords } from '../../api/records'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
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

function EmployerDashboardContent() {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState([])
  const [evaluations, setEvaluations] = useState([])

  useEffect(() => {
    Promise.all([fetchEmployerRecords(), fetchInstructorRecords()])
      .then(([e, i]) => {
        setApprovals(e.data.approvals || [])
        setEvaluations(i.data.evaluations || [])
      })
      .catch(() => {})
  }, [])

  const approved = approvals.filter((r) => r.payload.approved).length
  const avgScore = evaluations.length
    ? (evaluations.reduce((s, r) => s + (r.payload.score || 0), 0) / evaluations.length).toFixed(1)
    : '—'
  const approvalData = approvals.slice(0, 7).reverse().map((r) => r.payload.approved ? 1 : 0)
  const scoreData = evaluations.slice(0, 7).reverse().map((r) => r.payload.score || 0)

  // top 5 students by score
  const scoreMap = evaluations.reduce((acc, r) => {
    const id = r.payload.student_id
    if (!acc[id]) acc[id] = { total: 0, count: 0 }
    acc[id].total += r.payload.score || 0
    acc[id].count++
    return acc
  }, {})
  const topStudents = Object.entries(scoreMap)
    .map(([id, v]) => ({ id, avg: (v.total / v.count).toFixed(1) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Employer Dashboard</p>
            <h2>Welcome back, {user?.full_name}</h2>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard label="Total Approvals" value={approvals.length} sub={`${approved} approved`} sparkData={approvalData} color="#38bdf8" />
          <StatCard label="Evaluations Reviewed" value={evaluations.length} sub="performance records" sparkData={scoreData} color="#22c55e" />
          <StatCard label="Avg Performance" value={avgScore} sub="student avg score" sparkData={scoreData} color="#f59e0b" />
        </div>

        <div className="grid-two" style={{ marginTop: 18 }}>
          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Quick Actions</p>
            <div className="shortcut-grid">
              <Link to="/employer/approvals" className="shortcut-card">
                <strong>Approve Completion</strong>
                <p>Review and approve internship completion</p>
              </Link>
              <Link to="/employer/rankings" className="shortcut-card">
                <strong>View Rankings</strong>
                <p>See top performing students</p>
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Top Students</p>
            {topStudents.length === 0 ? (
              <p className="muted">No performance data yet.</p>
            ) : (
              <div className="stack-list">
                {topStudents.map((s, i) => (
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

export default function EmployerDashboard() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <EmployerDashboardContent />
    </ProtectedRoute>
  )
}
