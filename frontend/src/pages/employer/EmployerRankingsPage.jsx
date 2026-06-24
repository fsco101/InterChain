import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchEmployerRecords } from '../../api/records'
import { showError } from '../../utils/alerts'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/history', label: 'History', description: 'All approval records' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
  { to: '/employer/roster', label: 'Roster', description: 'Instructors & their students' },
  { to: '/employer/certificates', label: 'Certificates', description: 'Issue e-certificates' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
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

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchEmployerRecords()
        setApprovals(data.approvals || [])
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
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
