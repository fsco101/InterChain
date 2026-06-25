import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchInstructorStudentAttendance, fetchInstructorRoster } from '../../api/records'
import { showError } from '../../utils/alerts'
import { INSTRUCTOR_LINKS } from '../../utils/links'

const STATUS_COLORS = { pending: '#f59e0b', validated: '#22c55e', rejected: '#ef4444' }

function InstructorSchedulePanel() {
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [filterStudent, setFilterStudent] = useState('all')

  useEffect(() => {
    fetchInstructorStudentAttendance()
      .then(({ data }) => setRecords(data.attendance || []))
      .catch(() => showError('Failed to load student attendance'))
    fetchInstructorRoster()
      .then(({ data }) => setStudents(data.students || []))
      .catch(() => {})
  }, [])

  // Compute hours per student
  const hoursByStudent = {}
  records.forEach((r) => {
    const uid = r.user_id
    if (!hoursByStudent[uid]) hoursByStudent[uid] = { total: 0, validated: 0, name: r.user_name || uid, days: 0 }
    hoursByStudent[uid].total += r.payload.hours || 0
    hoursByStudent[uid].days += 1
    if (r.payload.validation_status === 'validated') hoursByStudent[uid].validated += r.payload.hours || 0
  })

  const filtered = filterStudent === 'all' ? records : records.filter((r) => r.user_id === filterStudent)

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Instructor</p>
        <h2>OJT Schedule & Attendance</h2>
        <p className="muted">View allotted hours and attendance records for students in your roster. This is a read-only view.</p>
      </div>

      {/* Hours summary per student */}
      {Object.keys(hoursByStudent).length > 0 && (
        <div className="dashboard-card">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Hours Summary</p>
          <div className="users-table">
            {Object.entries(hoursByStudent).map(([uid, info]) => (
              <div key={uid} className="users-row">
                <span style={{ fontWeight: 600 }}>{info.name}</span>
                <span className="muted">{info.days} days</span>
                <span>Total: <strong>{info.total.toFixed(1)}h</strong></span>
                <span style={{ color: '#22c55e' }}>Validated: <strong>{info.validated.toFixed(1)}h</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="dashboard-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>Filter by student:</span>
          <button className={filterStudent === 'all' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '0.78rem', padding: '4px 12px' }} onClick={() => setFilterStudent('all')}>All</button>
          {students.map((s) => (
            <button key={s.user_id} className={filterStudent === s.user_id ? 'primary-button' : 'secondary-button'} style={{ fontSize: '0.78rem', padding: '4px 12px' }} onClick={() => setFilterStudent(s.user_id)}>
              {s.full_name}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance records */}
      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Attendance Records ({filtered.length})</p>
        {filtered.length === 0 ? <p className="muted">No attendance records found.</p> : (
          <div className="users-table">
            {filtered.map((r) => (
              <div key={r.id} className="users-row" style={{ alignItems: 'flex-start' }}>
                {r.payload.photo_url && (
                  <img src={r.payload.photo_url} alt="Proof" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{r.user_name || 'Student'}</strong>
                  <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{r.payload.attendance_date} · {r.payload.time_in}–{r.payload.time_out} · {r.payload.hours}h</p>
                </div>
                <span className="role-chip" style={{ background: STATUS_COLORS[r.payload.validation_status] + '22', color: STATUS_COLORS[r.payload.validation_status] }}>
                  {r.payload.validation_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function InstructorSchedulePage() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <DashboardShell links={INSTRUCTOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <InstructorSchedulePanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
