import { useState } from 'react'
import { confirmAction, confirmDeleteAction, showError, showSuccess, extractError } from '../utils/alerts'

function fmt(val) {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return val }
}

function getLabel(record) {
  const p = record.payload
  if (record.record_type === 'student_attendance') return `Attendance - ${p.attendance_date}`
  return p.title || p.report_title || p.student_id || p.recipient_name || record.record_type
}

function getMeta(record) {
  const p = record.payload
  const parts = []
  if (p.internship_id) parts.push(p.internship_id)
  if (p.status) parts.push(p.status)
  if (p.score != null) parts.push(`${p.score}/10`)
  if (p.approved != null) parts.push(p.approved ? 'Approved' : 'Pending')
  if (p.hours_spent) parts.push(`${p.hours_spent}h`)
  if (p.activity_date || p.attendance_date || p.approval_date) {
    parts.push(fmt(p.activity_date || p.attendance_date || p.approval_date))
  }
  return parts.join(' · ')
}

export default function HistoryPanel({ title, records, onDelete, onBulkDelete, loading }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [expandedIds, setExpandedIds] = useState(new Set())

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    const p = r.payload
    return (
      !q ||
      getLabel(r).toLowerCase().includes(q) ||
      (p.internship_id || '').toLowerCase().includes(q) ||
      (p.student_id || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q) ||
      (p.activity_date || p.attendance_date || p.approval_date || '').includes(q) ||
      (r.record_type || '').toLowerCase().includes(q)
    )
  })

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)))

  const handleDelete = async (id) => {
    const ok = await confirmDeleteAction({ title: 'Delete record?', text: 'This cannot be undone.' })
    if (!ok) return
    try {
      await onDelete(id)
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      showSuccess('Deleted', 'Record removed.')
    } catch (e) { showError('Delete failed', extractError(e)) }
  }

  const handleBulkDelete = async () => {
    const ids = [...selected]
    if (!ids.length) return
    const ok = await confirmDeleteAction({ title: `Delete ${ids.length} record(s)?`, text: 'This cannot be undone.' })
    if (!ok) return
    try {
      await onBulkDelete(ids)
      setSelected(new Set())
      showSuccess('Deleted', `${ids.length} record(s) removed.`)
    } catch (e) { showError('Delete failed', extractError(e)) }
  }

  return (
    <div className="history-panel">
      <div className="history-toolbar">
        <h3 style={{ margin: 0 }}>{title} <span className="history-count">{records.length}</span></h3>
        <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <input
            className="history-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {selected.size > 0 && (
            <button className="secondary-button danger-button" onClick={handleBulkDelete} style={{ minHeight: 36, padding: '0 14px', fontSize: '0.82rem' }}>
              Delete {selected.size} selected
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="muted" style={{ padding: '12px 0' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ padding: '12px 0' }}>{search ? 'No results.' : 'No records yet.'}</p>
      ) : (
        <div className="history-list">
          <div className="history-row history-header">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>Record</span>
            <span>Details</span>
            <span>Date</span>
            <span></span>
          </div>
          {filtered.map((r) => {
            const isExpanded = expandedIds.has(r.id)
            const content = r.payload.description || r.payload.summary || r.payload.remarks
            return (
              <div key={r.id} style={{ borderBottom: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column' }}>
                <div className={`history-row${selected.has(r.id) ? ' selected' : ''}`} style={{ borderBottom: 'none' }}>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <span className="history-label" style={{ cursor: content ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }} onClick={() => {
                    if (!content) return
                    setExpandedIds(prev => {
                      const n = new Set(prev)
                      if (n.has(r.id)) n.delete(r.id)
                      else n.add(r.id)
                      return n
                    })
                  }}>
                    {getLabel(r)}
                    {content && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--accent)' }}>{isExpanded ? '▼' : '▶'}</span>}
                  </span>
                  <span className="history-meta">
                    {getMeta(r)}
                    {r.blockchain?.tx_hash && (
                      <>
                        {' · '}
                        <a
                          href={r.blockchain.explorer_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'underline', fontFamily: 'monospace', fontSize: '0.8rem' }}
                          title={r.blockchain.tx_hash}
                        >
                          Tx Link
                        </a>
                      </>
                    )}
                    {r.blockchain?.ipfs?.gateway_url && (
                      <>
                        {' · '}
                        <a
                          href={r.blockchain.ipfs.gateway_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#0ea5e9', textDecoration: 'underline', fontFamily: 'monospace', fontSize: '0.8rem' }}
                          title={r.blockchain.ipfs.cid}
                        >
                          IPFS Link
                        </a>
                      </>
                    )}
                  </span>
                  <span className="history-date">{fmt(r.created_at)}</span>
                  <button
                    className="history-del-btn"
                    onClick={() => handleDelete(r.id)}
                    title="Delete"
                  >✕</button>
                </div>
                {content && isExpanded && (
                  <div style={{ padding: '0 16px 16px 46px', color: 'var(--text)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
