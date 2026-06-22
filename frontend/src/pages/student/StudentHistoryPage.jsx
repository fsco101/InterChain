import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import HistoryPanel from '../../components/HistoryPanel'
import {
  fetchStudentHistory,
  deleteStudentActivity, bulkDeleteStudentActivity,
  deleteStudentReport, bulkDeleteStudentReport,
} from '../../api/records'
import { showError } from '../../utils/alerts'

const LINKS = [
  { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/student/activities', label: 'Activities', description: 'Log daily activities' },
  { to: '/student/reports', label: 'Reports', description: 'Submit internship reports' },
  { to: '/student/history', label: 'History', description: 'All activity & report records' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function StudentHistoryContent() {
  const [activities, setActivities] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await fetchStudentHistory()
      setActivities(data.activity_logs || [])
      setReports(data.reports || [])
    } catch { showError('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeActivity = async (id) => { await deleteStudentActivity(id); setActivities((p) => p.filter((r) => r.id !== id)) }
  const removeBulkActivity = async (ids) => { await bulkDeleteStudentActivity(ids); setActivities((p) => p.filter((r) => !ids.includes(r.id))) }
  const removeReport = async (id) => { await deleteStudentReport(id); setReports((p) => p.filter((r) => r.id !== id)) }
  const removeBulkReport = async (ids) => { await bulkDeleteStudentReport(ids); setReports((p) => p.filter((r) => !ids.includes(r.id))) }

  return (
    <DashboardShell links={LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Student</p><h2>History</h2></div>
        </div>
        <div className="dashboard-stack">
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
