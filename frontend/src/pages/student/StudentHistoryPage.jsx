import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import HistoryPanel from '../../components/HistoryPanel'
import {
  fetchStudentHistory,
  deleteStudentActivity, bulkDeleteStudentActivity,
  deleteStudentReport, bulkDeleteStudentReport,
  deleteStudentAttendance, bulkDeleteStudentAttendance
} from '../../api/records'
import { showError } from '../../utils/alerts'
import { STUDENT_LINKS } from '../../utils/links'

function StudentHistoryContent() {
  const [activities, setActivities] = useState([])
  const [reports, setReports] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await fetchStudentHistory()
      setActivities(data.activity_logs || [])
      setReports(data.reports || [])
      setAttendance(data.attendance || [])
    } catch { showError('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeActivity = async (id) => { await deleteStudentActivity(id); setActivities((p) => p.filter((r) => r.id !== id)) }
  const removeBulkActivity = async (ids) => { await bulkDeleteStudentActivity(ids); setActivities((p) => p.filter((r) => !ids.includes(r.id))) }
  const removeReport = async (id) => { await deleteStudentReport(id); setReports((p) => p.filter((r) => r.id !== id)) }
  const removeBulkReport = async (ids) => { await bulkDeleteStudentReport(ids); setReports((p) => p.filter((r) => !ids.includes(r.id))) }
  const removeAttendance = async (id) => { await deleteStudentAttendance(id); setAttendance((p) => p.filter((r) => r.id !== id)) }
  const removeBulkAttendance = async (ids) => { await bulkDeleteStudentAttendance(ids); setAttendance((p) => p.filter((r) => !ids.includes(r.id))) }

  return (
    <DashboardShell links={STUDENT_LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Student</p><h2>History</h2></div>
        </div>
        <div className="dashboard-stack">
          <HistoryPanel title="Attendance Logs" records={attendance} loading={loading} onDelete={removeAttendance} onBulkDelete={removeBulkAttendance} />
          <HistoryPanel title="Activity Logs" records={activities} loading={loading} onDelete={removeActivity} onBulkDelete={removeBulkActivity} />
          <HistoryPanel title="Reports" records={reports} loading={loading} onDelete={removeReport} onBulkDelete={removeBulkReport} />
        </div>
      </div>
    </DashboardShell>
  )
}

export default function StudentHistoryPage() {
  return <ProtectedRoute allowedRoles={['student']}><StudentHistoryContent /></ProtectedRoute>
}
