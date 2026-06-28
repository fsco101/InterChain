import { useEffect, useState } from 'react'
import { useSessionStorage } from '../../hooks/useSessionStorage'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchSupervisorAllAttendance, fetchSupervisorStudents, validateStudentAttendance } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { SUPERVISOR_LINKS } from '../../utils/links'

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
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
          {record.payload.internship_id && <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>ID: {record.payload.internship_id}</span>}
          {record.payload.ojt_position && <span> · {record.payload.ojt_position}</span>}
          {record.payload.institution && <span> · {record.payload.institution}</span>}
        </p>
        {record.payload.notes && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>Note: {record.payload.notes}</p>}
        {record.payload.validated_by_name && (
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Reviewed by: {record.payload.validated_by_name}</p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 120, flex: 1 }}>
        <span className="role-chip" style={{ background: STATUS_COLORS[record.payload.validation_status] + '22', color: STATUS_COLORS[record.payload.validation_status] }}>
          {record.payload.validation_status}
        </span>
        <Link to={`/profile/${record.user_id}`} className="secondary-button" style={{ fontSize: '0.75rem', padding: '4px 10px', minHeight: 'unset', width: '100%', maxWidth: 140 }}>
          View Profile
        </Link>
        {record.payload.validation_status === 'pending' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', maxWidth: 140, justifyContent: 'flex-end' }}>
            <button className="primary-button" style={{ fontSize: '0.78rem', padding: '6px 0', flex: 1 }} onClick={() => handle('validated')} disabled={acting}>✓ Validate</button>
            <button className="secondary-button danger-button" style={{ fontSize: '0.78rem', padding: '6px 0', flex: 1 }} onClick={() => handle('rejected')} disabled={acting}>✕ Reject</button>
          </div>
        )}
      </div>
    </div>
  )
}

function SupervisorAttendancePanel() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useSessionStorage('sup-att-filter', 'all') // all | pending | validated | rejected
  const [searchQuery, setSearchQuery] = useSessionStorage('sup-att-search', '')
  const [dateFilter, setDateFilter] = useSessionStorage('sup-att-date', '')

  const load = async () => {
    try {
      const { data } = await fetchSupervisorAllAttendance()
      setRecords(data.attendance || [])
    } catch (err) {
      const status = err?.response?.status
      if (status !== 404) showError('Failed to load attendance', extractError(err))
    }
  }

  useEffect(() => { load() }, [])

  const filtered = records.filter((r) => {
    if (filter !== 'all' && r.payload.validation_status !== filter) return false
    if (dateFilter && r.payload.attendance_date !== dateFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = (r.user_name || '').toLowerCase().includes(q)
      const idMatch = (r.payload.internship_id || '').toLowerCase().includes(q)
      if (!nameMatch && !idMatch) return false
    }
    return true
  })
  
  const pending = records.filter((r) => r.payload.validation_status === 'pending').length

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Supervisor</p>
        <h2>Student Attendance</h2>
        <p className="muted">View and validate student attendance records with photo proof.</p>
        
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'pending', 'validated', 'rejected'].map((f) => (
            <button key={f} className={filter === f ? 'primary-button' : 'secondary-button'} style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pending > 0 && <span style={{ marginLeft: 6, fontWeight: 800 }}>({pending})</span>}
            </button>
          ))}
          
          <div style={{ flex: 1, minWidth: '100%', height: 1, background: 'rgba(148,163,184,0.1)', margin: '4px 0' }} />
          
          <input 
            type="text" 
            placeholder="Search student name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'var(--input-bg)', color: 'var(--text)' }}
          />
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'var(--input-bg)', color: 'var(--text)' }}
          />
          {dateFilter && <button className="secondary-button" style={{ padding: '6px 12px' }} onClick={() => setDateFilter('')}>Clear Date</button>}
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

export default function SupervisorAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <DashboardShell links={SUPERVISOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <SupervisorAttendancePanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
