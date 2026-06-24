import { useEffect, useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardShell from '../components/DashboardShell'
import { fetchIpfsRecords } from '../api/ipfs'
import { useAuth } from '../context/AuthContext'

const ROLE_LINKS = {
  student: [
    { to: '/student/dashboard', label: 'Overview', end: true },
    { to: '/student/activities', label: 'Activities' },
    { to: '/student/history', label: 'History' },
    { to: '/ipfs-records', label: 'IPFS Records' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile' },
  ],
  instructor: [
    { to: '/instructor/dashboard', label: 'Overview', end: true },
    { to: '/instructor/attendance', label: 'Attendance' },
    { to: '/instructor/history', label: 'History' },
    { to: '/ipfs-records', label: 'IPFS Records' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile' },
  ],
  employer: [
    { to: '/employer/dashboard', label: 'Overview', end: true },
    { to: '/employer/approvals', label: 'Approvals' },
    { to: '/employer/certificates', label: 'Certificates' },
    { to: '/ipfs-records', label: 'IPFS Records' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Overview', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/records', label: 'Records' },
    { to: '/ipfs-records', label: 'IPFS Records' },
    { to: '/profile', label: 'Profile' },
  ],
}

const TYPE_LABELS = {
  student_activity: 'Activity Log',
  student_report: 'Report',
  attendance_validation: 'Attendance',
  performance_evaluation: 'Evaluation',
  completion_approval: 'Approval',
  certificate: 'Certificate',
}

const TYPE_COLORS = {
  student_activity: '#0ea5e9',
  student_report: '#8b5cf6',
  attendance_validation: '#f59e0b',
  performance_evaluation: '#10b981',
  completion_approval: '#f97316',
  certificate: '#ec4899',
}

function fmt(val) {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return val }
}

function StatusDot({ ok }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: ok ? '#10b981' : '#64748b', marginRight: 5, flexShrink: 0,
    }} />
  )
}

function IpfsRow({ record }) {
  const [expanded, setExpanded] = useState(false)
  const color = TYPE_COLORS[record.record_type] || 'var(--accent)'
  const label = TYPE_LABELS[record.record_type] || record.record_type
  const hasIpfs = Boolean(record.ipfs?.gateway_url)
  const hasPolygon = Boolean(record.polygon?.explorer_url)

  return (
    <>
      <div
        className="history-row"
        style={{ gridTemplateColumns: '140px 1fr 100px 90px 90px 32px', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          <span className="role-chip" style={{
            background: color + '22', color, borderColor: color + '44', fontSize: '0.7rem',
          }}>
            {label}
          </span>
        </span>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {record.summary}
        </span>
        <span className="history-date">{fmt(record.created_at)}</span>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
          <StatusDot ok={hasIpfs} />
          {hasIpfs ? (
            <a href={record.ipfs.gateway_url} target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent)' }} onClick={(e) => e.stopPropagation()}>
              IPFS
            </a>
          ) : <span className="muted">No IPFS</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
          <StatusDot ok={hasPolygon} />
          {hasPolygon ? (
            <a href={record.polygon.explorer_url} target="_blank" rel="noreferrer"
              style={{ color: '#8b5cf6' }} onClick={(e) => e.stopPropagation()}>
              Amoy
            </a>
          ) : <span className="muted">No Polygon</span>}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{
          margin: '0 0 4px 0',
          padding: '14px 18px',
          borderRadius: 12,
          background: 'rgba(2,6,23,0.6)',
          border: '1px solid rgba(148,163,184,0.15)',
          display: 'grid',
          gap: 10,
          fontSize: '0.82rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* IPFS */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 6, fontSize: '0.68rem' }}>IPFS (Pinata)</p>
              {hasIpfs ? (
                <>
                  <p style={{ margin: '0 0 4px', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--accent)' }}>
                    CID: {record.ipfs.cid}
                  </p>
                  <a href={record.ipfs.gateway_url} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    View on IPFS Gateway
                  </a>
                </>
              ) : <span className="muted">Not pinned to IPFS</span>}
            </div>

            {/* Polygon */}
            <div>
              <p className="eyebrow" style={{ marginBottom: 6, fontSize: '0.68rem' }}>Polygon Amoy</p>
              {hasPolygon ? (
                <>
                  <p style={{ margin: '0 0 4px', fontFamily: 'monospace', wordBreak: 'break-all', color: '#a78bfa' }}>
                    {record.polygon.polygon_tx_hash}
                  </p>
                  <a href={record.polygon.explorer_url} target="_blank" rel="noreferrer"
                    style={{ color: '#a78bfa', textDecoration: 'underline' }}>
                    View on PolygonScan Amoy
                  </a>
                  {record.polygon.block_number && (
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                      Block #{record.polygon.block_number} &middot; {record.polygon.status}
                    </p>
                  )}
                </>
              ) : <span className="muted">Not recorded on Polygon</span>}
            </div>

          </div>

          {/* SHA-256 hash */}
          {record.tx_hash && !record.polygon && (
            <div>
              <p className="eyebrow" style={{ marginBottom: 4, fontSize: '0.68rem' }}>SHA-256 Hash</p>
              <p style={{ margin: 0, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--muted)' }}>
                {record.tx_hash}
              </p>
            </div>
          )}

          <p className="muted" style={{ margin: 0 }}>
            Submitted by <strong style={{ color: 'var(--text)' }}>{record.user_name || '—'}</strong>
          </p>
        </div>
      )}
    </>
  )
}

function IpfsViewer() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchIpfsRecords()
      .then(({ data }) => setRecords(data.records || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    const matchType = typeFilter === 'all' || r.record_type === typeFilter
    const matchSearch = !q ||
      r.summary.toLowerCase().includes(q) ||
      (r.user_name || '').toLowerCase().includes(q) ||
      (r.tx_hash || '').toLowerCase().includes(q) ||
      (r.ipfs?.cid || '').toLowerCase().includes(q) ||
      (r.polygon?.polygon_tx_hash || '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const pinnedIpfs = records.filter((r) => r.ipfs?.cid).length
  const pinnedPolygon = records.filter((r) => r.polygon?.polygon_tx_hash).length

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Blockchain</p>
        <h2>IPFS + Polygon Amoy Records</h2>
        <p className="muted">
          All records are pinned to IPFS via Pinata and anchored on Polygon Amoy. Click any row to inspect CID and transaction details.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Records', value: records.length, color: 'var(--text)' },
            { label: 'Pinned to IPFS', value: pinnedIpfs, color: '#0ea5e9' },
            { label: 'On Polygon Amoy', value: pinnedPolygon, color: '#8b5cf6' },
            { label: 'Pending', value: records.length - pinnedIpfs, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} className="dashboard-card" style={{ flex: 1, minWidth: 120, padding: '12px 16px', margin: 0 }}>
              <p className="eyebrow" style={{ marginBottom: 4, fontSize: '0.68rem' }}>{label}</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-card">
        <div className="history-toolbar" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>
            Records <span className="history-count">{filtered.length}</span>
          </h3>
          <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.25)', background: 'var(--card)', color: 'var(--text)', fontSize: '0.85rem' }}
            >
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              className="history-search"
              placeholder="Search by name, CID, hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading records...</p>
        ) : filtered.length === 0 ? (
          <p className="muted">
            {search || typeFilter !== 'all' ? 'No results.' : 'No records yet. Records appear here after creation.'}
          </p>
        ) : (
          <div className="history-list">
            <div className="history-row history-header"
              style={{ gridTemplateColumns: '140px 1fr 100px 90px 90px 32px', gap: 10 }}>
              <span>Type</span>
              <span>Record</span>
              <span>Date</span>
              <span>IPFS</span>
              <span>Polygon</span>
              <span></span>
            </div>
            {filtered.map((r) => <IpfsRow key={r.id} record={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function IpfsViewerPage() {
  const { user } = useAuth()
  const links = ROLE_LINKS[user?.role] || ROLE_LINKS.student

  return (
    <ProtectedRoute allowedRoles={['student', 'instructor', 'employer', 'admin']}>
      <DashboardShell links={links}>
        <div className="page-shell dashboard-shell">
          <IpfsViewer />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
