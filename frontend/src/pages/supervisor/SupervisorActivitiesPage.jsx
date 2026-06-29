import { useEffect, useState } from 'react'
import { useSessionStorage } from '../../hooks/useSessionStorage'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchSupervisorActivities, validateStudentActivityLog } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { SUPERVISOR_LINKS } from '../../utils/links'

const STATUS_COLORS = { pending: '#f59e0b', validated: '#22c55e', rejected: '#ef4444' }

function ActivityCard({ record, onValidate, selectable, selected, onToggle }) {
  const [acting, setActing] = useState(false)

  const handle = async (validationStatus) => {
    const label = validationStatus === 'validated' ? 'Approve' : 'Reject'
    const ok = await confirmAction({ title: `${label} this activity?`, confirmButtonText: label })
    if (!ok) return

    setActing(true)
    try {
      await validateStudentActivityLog(record.id, { status: validationStatus })
      showSuccess(`Activity ${validationStatus}`)
      onValidate?.()
    } catch (err) {
      showError('Failed', extractError(err))
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="users-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
      {selectable && (
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onToggle} 
          style={{ marginTop: 14, cursor: 'pointer', width: 16, height: 16 }}
        />
      )}
      <Link to={`/profile/${record.user_id}`} style={{ flexShrink: 0, display: 'block', marginTop: 4 }}>
        <AvatarBadge name={record.user_name || 'Student'} avatarUrl={record.user_avatar_url} size={42} />
      </Link>
      <div style={{ flex: 1, minWidth: 180 }}>
        <Link to={`/profile/${record.user_id}`} style={{ textDecoration: 'none' }}>
          <strong>{record.user_name || 'Student'}</strong>
        </Link>
        <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
          {record.payload.activity_date} · {record.payload.hours_spent}h spent
        </p>
        <p style={{ margin: '6px 0 2px', fontSize: '0.9rem', fontWeight: 600 }}>{record.payload.title}</p>
        <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.82rem' }}>{record.payload.description}</p>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
          {record.payload.internship_id && <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>ID: {record.payload.internship_id}</span>}
        </p>
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
            <button className="primary-button" style={{ fontSize: '0.78rem', padding: '6px 0', flex: 1 }} onClick={() => handle('validated')} disabled={acting}>✓ Approve</button>
            <button className="secondary-button danger-button" style={{ fontSize: '0.78rem', padding: '6px 0', flex: 1 }} onClick={() => handle('rejected')} disabled={acting}>✕ Reject</button>
          </div>
        )}
      </div>
    </div>
  )
}

function SupervisorActivitiesPanel() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useSessionStorage('sup-act-filter', 'pending') // all | pending | validated | rejected
  const [searchQuery, setSearchQuery] = useSessionStorage('sup-act-search', '')
  const [dateFilter, setDateFilter] = useSessionStorage('sup-act-date', '')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [actingBulk, setActingBulk] = useState(false)

  const load = async () => {
    try {
      const { data } = await fetchSupervisorActivities()
      setRecords(data.activities || [])
    } catch (err) {
      const status = err?.response?.status
      if (status !== 404) showError('Failed to load activities', extractError(err))
    }
  }

  useEffect(() => { load() }, [])

  const filtered = records.filter((r) => {
    if (filter !== 'all' && r.payload.validation_status !== filter) return false
    if (dateFilter && r.payload.activity_date !== dateFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = (r.user_name || '').toLowerCase().includes(q)
      const idMatch = (r.payload.internship_id || '').toLowerCase().includes(q)
      if (!nameMatch && !idMatch) return false
    }
    return true
  })

  const pending = records.filter((r) => r.payload.validation_status === 'pending').length

  const handleBulkAction = async (status) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const label = status === 'validated' ? 'Approve' : 'Reject'
    const ok = await confirmAction({ title: `${label} ${ids.length} selected activities?`, confirmButtonText: label })
    if (!ok) return

    setActingBulk(true)
    try {
      await Promise.all(ids.map(id => validateStudentActivityLog(id, { status })))
      showSuccess(`${ids.length} activities ${status}`)
      setSelectedIds(new Set())
      load()
    } catch (err) {
      showError('Failed some updates', extractError(err))
      load()
    } finally {
      setActingBulk(false)
    }
  }

  const handleToggleAll = (e) => {
    if (e.target.checked) {
      const newSet = new Set()
      filtered.forEach(r => {
        if (r.payload.validation_status === 'pending') newSet.add(r.id)
      })
      setSelectedIds(newSet)
    } else {
      setSelectedIds(new Set())
    }
  }

  const allPendingFiltered = filtered.filter(r => r.payload.validation_status === 'pending')
  const allSelected = allPendingFiltered.length > 0 && allPendingFiltered.every(r => selectedIds.has(r.id))

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Supervisor</p>
        <h2>Student Activities</h2>
        <p className="muted">View and approve student activity logs before they appear on their profile.</p>

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

        {filter === 'pending' && filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={allSelected} onChange={handleToggleAll} style={{ width: 16, height: 16 }} />
              Select All Pending
            </label>
            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="primary-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleBulkAction('validated')} disabled={actingBulk}>
                  Approve Selected ({selectedIds.size})
                </button>
                <button className="secondary-button danger-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleBulkAction('rejected')} disabled={actingBulk}>
                  Reject Selected ({selectedIds.size})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p className="muted" style={{ padding: 24, margin: 0 }}>No {filter !== 'all' ? filter : ''} activities found.</p>
        ) : (
          <div className="users-table">
            {filtered.map((r) => (
              <ActivityCard 
                key={r.id} 
                record={r} 
                onValidate={load} 
                selectable={filter === 'pending' && r.payload.validation_status === 'pending'}
                selected={selectedIds.has(r.id)}
                onToggle={() => {
                  const n = new Set(selectedIds)
                  if (n.has(r.id)) n.delete(r.id)
                  else n.add(r.id)
                  setSelectedIds(n)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SupervisorActivitiesPage() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <DashboardShell links={SUPERVISOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <SupervisorActivitiesPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
