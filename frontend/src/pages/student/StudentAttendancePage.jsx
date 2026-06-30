import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { timeInStudentAttendance, timeOutStudentAttendance, fetchStudentAttendance } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction, showLoading, closeAlert } from '../../utils/alerts'
import { useAuth } from '../../context/AuthContext'
import { STUDENT_LINKS } from '../../utils/links'

function AttendanceForm({ records, onSuccess }) {
  const { user } = useAuth()

  // Find today's record (assume PHT date format matching backend YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const todayRecord = records.find(r => r.payload.attendance_date === todayStr)

  const handleTimeIn = async (e) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const fd = new FormData(formElement)

    if (!fd.get('photo') || !fd.get('photo').size) {
      showError('Photo required', 'Please upload a photo as proof.')
      return
    }

    fd.set('internship_id', user?.internship_id || 'N/A')

    const ok = await confirmAction({ title: 'Time In?', text: 'Your photo proof will be uploaded.' })
    if (!ok) return

    showLoading('Logging time in...')
    try {
      await timeInStudentAttendance(fd)
      closeAlert()
      showSuccess('Timed In', 'Your time in has been logged.')
      formElement.reset()
      onSuccess?.()
    } catch (err) {
      closeAlert()
      showError('Failed', extractError(err))
    }
  }

  const handleTimeOut = async (e) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const fd = new FormData(formElement)

    if (!fd.get('photo') || !fd.get('photo').size) {
      showError('Photo required', 'Please upload a photo as proof.')
      return
    }

    const ok = await confirmAction({ title: 'Time Out?', text: 'Your photo proof will be uploaded.' })
    if (!ok) return
    if (!ok) return

    showLoading('Logging time out...')
    try {
      await timeOutStudentAttendance(fd)
      closeAlert()
      showSuccess('Timed Out', 'Your time out has been logged.')
      formElement.reset()
      onSuccess?.()
    } catch (err) {
      closeAlert()
      showError('Failed', extractError(err))
    }
  }

  if (todayRecord && todayRecord.payload.time_out && !['rejected', 're-validated'].includes(todayRecord.payload.validation_status)) {
    return (
      <div className="dashboard-card form-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <h3 style={{ color: '#22c55e', margin: '0 0 8px' }}>Attendance Completed</h3>
        <p className="muted" style={{ margin: 0 }}>You have already timed in and out for today.</p>
      </div>
    )
  }

  const isTimedIn = todayRecord && (!todayRecord.payload.time_out || ['rejected', 're-validated'].includes(todayRecord.payload.validation_status))

  return (
    <form className="dashboard-card form-card" onSubmit={isTimedIn ? handleTimeOut : handleTimeIn}>
      <h3>{isTimedIn ? 'Time Out' : 'Time In'}</h3>
      <p className="muted" style={{ marginBottom: 12, fontSize: '0.85rem' }}>Upload a photo as proof of your current location/activity.</p>

      {isTimedIn && (
        <div style={{ background: ['rejected', 're-validated'].includes(todayRecord.payload.validation_status) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {['rejected', 're-validated'].includes(todayRecord.payload.validation_status) ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444' }}>
              <strong>Attendance {todayRecord.payload.validation_status === 'rejected' ? 'Rejected' : 'Re-validated'}:</strong> Please upload a new time out photo. (Timed in at {todayRecord.payload.time_in})
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8' }}>
              <strong>Current Status:</strong> Timed in at {todayRecord.payload.time_in}
            </p>
          )}
        </div>
      )}

      <label>
        Photo Proof *
        <input name="photo" type="file" accept="image/*" capture="environment" required />
      </label>

      <button className="primary-button" type="submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {isTimedIn ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Time Out
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Log Time In
          </>
        )}
      </button>
    </form>
  )
}

const STATUS_COLORS = { pending: '#f59e0b', validated: '#22c55e', rejected: '#ef4444', 're-validated': '#f43f5e' }

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
              <div style={{ display: 'flex', gap: 8 }}>
                {r.payload.photo_url && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={r.payload.photo_url}
                      alt="Time In Proof"
                      style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(148,163,184,0.2)' }}
                    />
                    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: 4 }}>In</div>
                  </div>
                )}
                {r.payload.photo_out_url && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={r.payload.photo_out_url}
                      alt="Time Out Proof"
                      style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(148,163,184,0.2)' }}
                    />
                    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: 4 }}>Out</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                <strong>{r.payload.attendance_date}</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                  {r.payload.time_in} – {r.payload.time_out || 'Pending'} · {r.payload.hours}h
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
  const { user } = useAuth()
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
          {!user?.supervisor_id ? (
            <div className="dashboard-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ color: '#f59e0b', margin: '0 0 8px' }}>Not Approved Yet</h3>
              <p className="muted" style={{ margin: 0 }}>You cannot log attendance until your supervisor has approved your OJT link.</p>
            </div>
          ) : (
            <AttendanceForm records={records} onSuccess={load} />
          )}
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
