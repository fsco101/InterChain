import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchEmployerRecords, fetchInstructorRecords } from '../../api/records'
import { showError } from '../../utils/alerts'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function RankTable({ title, rows, cols }) {
  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 14 }}>{title}</h3>
      {rows.length === 0 ? (
        <p className="muted">No data yet.</p>
      ) : (
        <div className="rank-table">
          <div className="rank-header">
            <span>#</span>
            {cols.map((c) => <span key={c}>{c}</span>)}
          </div>
          {rows.map((row, i) => (
            <div key={i} className={`rank-row${i === 0 ? ' rank-first' : i === 1 ? ' rank-second' : i === 2 ? ' rank-third' : ''}`}>
              <span className="rank-pos">{i + 1}</span>
              {cols.map((c) => <span key={c}>{row[c] ?? '—'}</span>)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EmployerRankingsPage() {
  const [approvals, setApprovals] = useState([])
  const [evaluations, setEvaluations] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, instRes] = await Promise.all([fetchEmployerRecords(), fetchInstructorRecords()])
        setApprovals(empRes.data.approvals || [])
        setEvaluations(instRes.data.evaluations || [])
      } catch {
        showError('Failed to load rankings')
      }
    }
    load()
  }, [])

  // rank students by approval count
  const approvalRank = Object.values(
    approvals.reduce((acc, r) => {
      const id = r.payload.student_id
      if (!acc[id]) acc[id] = { 'Student ID': id, Approvals: 0, Status: r.payload.approved ? 'Approved' : 'Pending' }
      acc[id].Approvals++
      return acc
    }, {})
  ).sort((a, b) => b.Approvals - a.Approvals)

  // rank students by avg evaluation score
  const scoreMap = evaluations.reduce((acc, r) => {
    const id = r.payload.student_id
    if (!acc[id]) acc[id] = { total: 0, count: 0 }
    acc[id].total += r.payload.score || 0
    acc[id].count++
    return acc
  }, {})
  const scoreRank = Object.entries(scoreMap)
    .map(([id, v]) => ({ 'Student ID': id, 'Avg Score': (v.total / v.count).toFixed(1), Evaluations: v.count }))
    .sort((a, b) => b['Avg Score'] - a['Avg Score'])

  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <div className="dashboard-topbar">
            <div>
              <p className="eyebrow">Employer</p>
              <h2>Student Rankings</h2>
            </div>
          </div>
          <div className="dashboard-stack">
            <RankTable title="Top Students by Approvals" rows={approvalRank} cols={['Student ID', 'Approvals', 'Status']} />
            <RankTable title="Top Students by Performance Score" rows={scoreRank} cols={['Student ID', 'Avg Score', 'Evaluations']} />
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
