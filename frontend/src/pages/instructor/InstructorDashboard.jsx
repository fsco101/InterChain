import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import Sparkline from '../../components/Sparkline'
import { fetchInstructorRecords, fetchInstructorRoster } from '../../api/records'
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
  const [roster, setRoster] = useState([])

  useEffect(() => {
    fetchInstructorRecords().then(({ data }) => setRecords(data)).catch(() => {})
    fetchInstructorRoster().then(({ data }) => setRoster(data.students || [])).catch(() => {})
  }, [])

  const attendance = records.attendance || []
  const presentCount = attendance.filter((r) => r.payload.status === 'present').length
  const attendData = attendance.slice(0, 7).reverse().map((r) => r.payload.status === 'present' ? 1 : 0)

  const attendanceTimelineMap = {}
  attendance.forEach(a => {
    const date = a.payload.attendance_date || a.created_at.slice(0, 10)
    if (!attendanceTimelineMap[date]) attendanceTimelineMap[date] = { present: 0, absent: 0, late: 0 }
    if (a.payload.status === 'present') attendanceTimelineMap[date].present++
    else if (a.payload.status === 'late') attendanceTimelineMap[date].late++
    else attendanceTimelineMap[date].absent++
  })
  const attendanceTimeline = Object.entries(attendanceTimelineMap)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14)

  const pendingStudents = roster.filter(s => !s.employer_id).length
  const activeStudents = roster.filter(s => s.employer_id).length
  const rosterStats = [
    { name: 'Active Placement', value: activeStudents },
    { name: 'Pending Placement', value: pendingStudents }
  ]
  const COLORS = ['#38bdf8', '#f59e0b']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: 8, color: 'var(--text)', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{label || payload[0].name}</p>
          <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
            {payload[0].value} {payload[0].name === 'Active Placement' || payload[0].name === 'Pending Placement' ? 'students' : 'records'}
          </p>
        </div>
      )
    }
    return null
  }

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
          <StatCard label="Total Students" value={roster.length} sub="in your roster" color="#a78bfa" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginTop: 18 }}>
          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Global Attendance Trend (Last 14 Days)</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              {attendanceTimeline.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>No attendance data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="present" name="Present" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dashboard-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Student Status Distribution</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              {roster.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>No students in roster.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rosterStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {rosterStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {rosterStats.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index] }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{entry.name} ({entry.value})</span>
                </div>
              ))}
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
