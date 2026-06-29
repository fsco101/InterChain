import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchInstructorRecords } from '../../api/records'
import { fetchInstructorRoster } from '../../api/records'
import { INSTRUCTOR_LINKS } from '../../utils/links'
import { useAuth } from '../../context/AuthContext'

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
  const [records, setRecords] = useState({ attendance: [] })

  useEffect(() => {
    fetchInstructorRecords().then(({ data }) => setRecords(data)).catch(() => {})
  }, [])

  const attendance = records.attendance || []
  const presentCount = attendance.filter((r) => r.payload.status === 'present').length
  const attendData = attendance.slice(0, 7).reverse().map((r) => r.payload.status === 'present' ? 1 : 0)

  return (
    <DashboardShell links={INSTRUCTOR_LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Instructor Dashboard</p>
            <h2>Welcome back, {user?.full_name}</h2>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard label="Attendance Records" value={attendance.length} sub={`${presentCount} present`} sparkData={attendData} color="#38bdf8" />
        </div>

        <div className="grid-two" style={{ marginTop: 18 }}>
          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 10 }}>Quick Actions</p>
            <div className="shortcut-grid">
              <Link to="/instructor/attendance" className="shortcut-card">
                <strong>Record Attendance</strong>
                <p>Mark student present, absent or late</p>
              </Link>
            </div>
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
