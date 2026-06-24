import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import HistoryPanel from '../../components/HistoryPanel'
import { fetchEmployerHistory, deleteEmployerApproval, bulkDeleteEmployerApproval } from '../../api/records'
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

function EmployerHistoryContent() {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await fetchEmployerHistory()
      setApprovals(data.approvals || [])
    } catch { showError('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeApproval = async (id) => { await deleteEmployerApproval(id); setApprovals((p) => p.filter((r) => r.id !== id)) }
  const removeBulk = async (ids) => { await bulkDeleteEmployerApproval(ids); setApprovals((p) => p.filter((r) => !ids.includes(r.id))) }

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Employer</p><h2>History</h2></div>
        </div>
        <div className="dashboard-stack">
          <HistoryPanel title="Completion Approvals" records={approvals} loading={loading} onDelete={removeApproval} onBulkDelete={removeBulk} />
        </div>
      </div>
    </DashboardShell>
  )
}

export default function EmployerHistoryPage() {
  return <ProtectedRoute allowedRoles={['employer']}><EmployerHistoryContent /></ProtectedRoute>
}
