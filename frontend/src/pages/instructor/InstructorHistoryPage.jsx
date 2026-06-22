import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import HistoryPanel from '../../components/HistoryPanel'
import {
  fetchInstructorHistory,
  deleteInstructorAttendance, bulkDeleteInstructorAttendance,
  deleteInstructorEvaluation, bulkDeleteInstructorEvaluation,
} from '../../api/records'
import { showError } from '../../utils/alerts'

const LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
  { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
  { to: '/instructor/history', label: 'History', description: 'All attendance & evaluation records' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function InstructorHistoryContent() {
  const [attendance, setAttendance] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await fetchInstructorHistory()
      setAttendance(data.attendance || [])
      setEvaluations(data.evaluations || [])
    } catch { showError('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeAttend = async (id) => { await deleteInstructorAttendance(id); setAttendance((p) => p.filter((r) => r.id !== id)) }
  const removeBulkAttend = async (ids) => { await bulkDeleteInstructorAttendance(ids); setAttendance((p) => p.filter((r) => !ids.includes(r.id))) }
  const removeEval = async (id) => { await deleteInstructorEvaluation(id); setEvaluations((p) => p.filter((r) => r.id !== id)) }
  const removeBulkEval = async (ids) => { await bulkDeleteInstructorEvaluation(ids); setEvaluations((p) => p.filter((r) => !ids.includes(r.id))) }

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Instructor</p><h2>History</h2></div>
        </div>
        <div className="dashboard-stack">
          <HistoryPanel title="Attendance Records" records={attendance} loading={loading} onDelete={removeAttend} onBulkDelete={removeBulkAttend} />
          <HistoryPanel title="Evaluations" records={evaluations} loading={loading} onDelete={removeEval} onBulkDelete={removeBulkEval} />
        </div>
      </div>
    </DashboardShell>
  )
}

export default function InstructorHistoryPage() {
  return <ProtectedRoute allowedRoles={['instructor']}><InstructorHistoryContent /></ProtectedRoute>
}
