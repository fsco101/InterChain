import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import HistoryPanel from '../../components/HistoryPanel'
import {
  fetchInstructorHistory,
  deleteInstructorAttendance, bulkDeleteInstructorAttendance
} from '../../api/records'
import { showError } from '../../utils/alerts'
import { INSTRUCTOR_LINKS } from '../../utils/links'

function InstructorHistoryContent() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await fetchInstructorHistory()
      setAttendance(data.attendance || [])
    } catch { showError('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeAttendance = async (id) => { await deleteInstructorAttendance(id); setAttendance((p) => p.filter((r) => r.id !== id)) }
  const removeBulkAttendance = async (ids) => { await bulkDeleteInstructorAttendance(ids); setAttendance((p) => p.filter((r) => !ids.includes(r.id))) }

  return (
    <DashboardShell links={INSTRUCTOR_LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Instructor</p><h2>History</h2></div>
        </div>
        <div className="dashboard-stack">
          <HistoryPanel title="Attendance Validations" records={attendance} loading={loading} onDelete={removeAttendance} onBulkDelete={removeBulkAttendance} />
        </div>
      </div>
    </DashboardShell>
  )
}

export default function InstructorHistoryPage() {
  return <ProtectedRoute allowedRoles={['instructor']}><InstructorHistoryContent /></ProtectedRoute>
}
