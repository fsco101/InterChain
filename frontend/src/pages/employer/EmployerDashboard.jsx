import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchEmployerRecords } from '../../api/records'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/history', label: 'History', description: 'All approval records' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
  { to: '/employer/roster', label: 'Roster', description: 'Instructors & their students' },
  { to: '/employer/certificates', label: 'Certificates', description: 'Issue e-certificates' },
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

  useEffect(() => {
    fetchEmployerRecords()
      .then(({ data }) => { setApprovals(data.approvals || []) })
      .catch(() => {})
  }, [])

  const approved = approvals.filter((r) => r.payload.approved).length
  const approvalData = approvals.slice(0, 7).reverse().map((r) => r.payload.approved ? 1 : 0)

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
              <Link to="/employer/roster" className="shortcut-card">
                <strong>Roster</strong>
                <p>View instructors and their students</p>
              </Link>
              <Link to="/employer/certificates" className="shortcut-card">
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

export default function EmployerDashboard() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <EmployerDashboardContent />
    </ProtectedRoute>
  )
}
