import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'

const PREVIEW_LIMIT = 5

const TYPE_COLOR = { success: '#22c55e', info: '#38bdf8', warning: '#f59e0b', error: '#ef4444' }

function fmt(val) {
  try { return new Date(val).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

export default function Notifications() {
  const { notifications, unread, doMarkRead, doMarkAllRead, doDelete, doBulkDelete } = useNotifications()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleOpen = () => { setOpen((o) => !o); setSelected(new Set()) }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await doDelete(id)
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleBulkDelete = async () => {
    await doBulkDelete([...selected])
    setSelected(new Set())
  }

  const navigate = useNavigate()
  const hasMore = notifications.length > PREVIEW_LIMIT
  const visible = hasMore ? notifications.slice(0, PREVIEW_LIMIT) : notifications
  const allSelected = visible.length > 0 && visible.every((n) => selected.has(n.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((n) => n.id)))

  const handleSeeAll = () => { setOpen(false); navigate('/notifications') }

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell" onClick={handleOpen} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span className="notif-panel-title">Notifications {unread > 0 && <span className="notif-count">{unread}</span>}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {selected.size > 0 && (
                <button className="notif-action-btn danger" onClick={handleBulkDelete}>Delete {selected.size}</button>
              )}
              {unread > 0 && (
                <button className="notif-action-btn" onClick={doMarkAllRead}>Mark all read</button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="muted" style={{ padding: '16px', margin: 0, fontSize: '0.85rem' }}>No notifications.</p>
          ) : (
            <>
              <div className="notif-select-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  Select all
                </label>
              </div>
              <div className="notif-list">
                {visible.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item${n.read ? ' read' : ''}`}
                    onClick={() => { if (!n.read) doMarkRead(n.id) }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={() => toggle(n.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ flexShrink: 0 }}
                    />
                    <span className="notif-dot" style={{ background: TYPE_COLOR[n.type] || '#38bdf8' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="notif-title">{n.title}</p>
                      {n.message && <p className="notif-msg">{n.message}</p>}
                      <p className="notif-time">{fmt(n.created_at)}</p>
                    </div>
                    <button className="notif-del" onClick={(e) => handleDelete(e, n.id)} title="Delete">✕</button>
                  </div>
                ))}
              </div>
              {hasMore && (
                <button className="notif-see-all" onClick={handleSeeAll}>
                  See all {notifications.length} notifications →
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
