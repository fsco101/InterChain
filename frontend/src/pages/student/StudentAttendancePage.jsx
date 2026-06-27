import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { createStudentAttendance, fetchStudentAttendance } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { useAuth } from '../../context/AuthContext'
import { STUDENT_LINKS } from '../../utils/links'

function AttendanceForm({ onSuccess }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [currentTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const fd = new FormData(formElement)

    if (!fd.get('photo') || !fd.get('photo').size) {
      showError('Photo required', 'Please upload a photo as attendance proof.')
      return
    }
    if (!fd.get('attendance_date') || !fd.get('time_in') || !fd.get('time_out')) {
      showError('Missing fields', 'Date, time-in, and time-out are required.')
      return
    }

    const timeIn = fd.get('time_in')
    const timeOut = fd.get('time_out')
    const [hIn, mIn] = timeIn.split(':').map(Number)
    const [hOut, mOut] = timeOut.split(':').map(Number)
    const hours = Math.max(0, (hOut + mOut / 60) - (hIn + mIn / 60))
    fd.set('hours', hours.toFixed(2))
    fd.set('internship_id', user?.internship_id || 'N/A')

    const ok = await confirmAction({ title: 'Log attendance?', text: 'Your photo proof will be uploaded.' })
    if (!ok) return

    setSubmitting(true)
    try {
      await createStudentAttendance(fd)
      showSuccess('Attendance logged', 'Your attendance with photo proof has been saved.')
      formElement.reset()
      onSuccess?.()
    } catch (err) {
      showError('Failed', extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="dashboard-card form-card" onSubmit={handleSubmit}>
      <h3>Log Attendance</h3>
      <p className="muted" style={{ marginBottom: 12, fontSize: '0.85rem' }}>Upload a photo as proof. All fields are required.</p>

      <label>
        Date
        <input name="attendance_date" type="date" required />
      </label>

      <div className="grid-two" style={{ gap: 12 }}>
        <label>
          Time In
          <input name="time_in" type="time" value={currentTime} readOnly required />
        </label>
        <label>
          Time Out
          <input name="time_out" type="time" required />
        </label>
      </div>

      <label>
        Photo Proof *
        <input name="photo" type="file" accept="image/*" capture="environment" required />
      </label>

      <label>
        Notes (optional)
        <textarea name="notes" rows="3" placeholder="Optional notes about today's attendance" />
      </label>

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Uploading…' : '📸 Log Attendance'}
      </button>
    </form>
  )
}

const STATUS_COLORS = { pending: '#f59e0b', validated: '#22c55e', rejected: '#ef4444' }

function AttendanceList({ records }) {
  return (
    <div className="dashboard-card">
      <p className="eyebrow" style={{ marginBottom: 12 }}>Recent Attendance</p>
      {records.length === 0 ? (
        <p className="muted">No attendance records yet. Log your first attendance above.</p>
      ) : (
        <div className="users-table">
          {records.map((r) => (
            <div key={r.id} className="users-row" style={{ alignItems: 'flex-start' }}>
              {r.payload.photo_url && (
                <img
                  src={r.payload.photo_url}
                  alt="Proof"
                  style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(148,163,184,0.2)' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{r.payload.attendance_date}</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                  {r.payload.time_in} – {r.payload.time_out} · {r.payload.hours}h
                </p>
                {r.payload.notes && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>{r.payload.notes}</p>}
              </div>
              <span
                className="role-chip"
                style={{ background: STATUS_COLORS[r.payload.validation_status] + '22', color: STATUS_COLORS[r.payload.validation_status] }}
              >
                {r.payload.validation_status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentAttendanceContent() {
  const [records, setRecords] = useState([])

  const load = async () => {
    try {
      const { data } = await fetchStudentAttendance()
      setRecords(data.attendance || [])
    } catch { /* silent */ }
  }

  useEffect(() => { load() }, [])

  return (
    <DashboardShell links={STUDENT_LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Student</p>
            <h2>Attendance</h2>
          </div>
        </div>
        <div className="dashboard-stack">
          <AttendanceForm onSuccess={load} />
          <AttendanceList records={records} />
        </div>
      </div>
    </DashboardShell>
  )
}

export default function StudentAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentAttendanceContent />
    </ProtectedRoute>
  )
}
