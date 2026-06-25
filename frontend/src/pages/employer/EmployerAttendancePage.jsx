import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchEmployerAllAttendance, fetchEmployerStudents, validateStudentAttendance } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { EMPLOYER_LINKS } from '../../utils/links'

const STATUS_COLORS = { pending: '#f59e0b', validated: '#22c55e', rejected: '#ef4444' }

function AttendanceCard({ record, onValidate }) {
  const [acting, setActing] = useState(false)

  const handle = async (validationStatus) => {
    const label = validationStatus === 'validated' ? 'Validate' : 'Reject'
    const ok = await confirmAction({ title: `${label} this attendance?`, confirmButtonText: label })
    if (!ok) return

    setActing(true)
    try {
      await validateStudentAttendance(record.id, { validation_status: validationStatus })
      showSuccess(`Attendance ${validationStatus}`)
      onValidate?.()
    } catch (err) {
      showError('Failed', extractError(err))
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="users-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
      {record.payload.photo_url && (
        <a href={record.payload.photo_url} target="_blank" rel="noreferrer">
          <img
            src={record.payload.photo_url}
            alt="Proof"
            style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(148,163,184,0.2)', cursor: 'pointer' }}
          />
        </a>
      )}
      <Link to={`/profile/${record.user_id}`} style={{ flexShrink: 0, display: 'block', marginTop: 4 }}>
        <AvatarBadge name={record.user_name || 'Student'} avatarUrl={record.user_avatar_url} size={42} />
      </Link>
      <div style={{ flex: 1, minWidth: 180 }}>
        <Link to={`/profile/${record.user_id}`} style={{ textDecoration: 'none' }}>
          <strong>{record.user_name || 'Student'}</strong>
        </Link>
        <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
          {record.payload.attendance_date} · {record.payload.time_in} – {record.payload.time_out} · {record.payload.hours}h
        </p>
        {record.payload.notes && <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>{record.payload.notes}</p>}
        {record.payload.validated_by_name && (
          <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>Reviewed by: {record.payload.validated_by_name}</p>
        )}
      </div>
      <span className="role-chip" style={{ background: STATUS_COLORS[record.payload.validation_status] + '22', color: STATUS_COLORS[record.payload.validation_status] }}>
        {record.payload.validation_status}
      </span>
      {record.payload.validation_status === 'pending' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="primary-button" style={{ fontSize: '0.78rem', padding: '6px 14px' }} onClick={() => handle('validated')} disabled={acting}>✓ Validate</button>
          <button className="secondary-button danger-button" style={{ fontSize: '0.78rem', padding: '6px 14px' }} onClick={() => handle('rejected')} disabled={acting}>✕ Reject</button>
        </div>
      )}
    </div>
  )
}

function EmployerAttendancePanel() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState('all') // all | pending | validated | rejected

  const load = async () => {
    try {
      const { data } = await fetchEmployerAllAttendance()
      setRecords(data.attendance || [])
    } catch (err) {
      const status = err?.response?.status
      if (status !== 404) showError('Failed to load attendance', extractError(err))
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? records : records.filter((r) => r.payload.validation_status === filter)
  const pending = records.filter((r) => r.payload.validation_status === 'pending').length

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Employer</p>
        <h2>Student Attendance</h2>
        <p className="muted">View and validate student attendance records with photo proof.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {['all', 'pending', 'validated', 'rejected'].map((f) => (
            <button key={f} className={filter === f ? 'primary-button' : 'secondary-button'} style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pending > 0 && <span style={{ marginLeft: 6, fontWeight: 800 }}>({pending})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p className="muted" style={{ padding: 24, margin: 0 }}>No {filter !== 'all' ? filter : ''} attendance records.</p>
        ) : (
          <div className="users-table">
            {filtered.map((r) => <AttendanceCard key={r.id} record={r} onValidate={load} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EmployerAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={EMPLOYER_LINKS}>
        <div className="page-shell dashboard-shell">
          <EmployerAttendancePanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
