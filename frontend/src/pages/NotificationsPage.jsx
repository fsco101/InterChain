import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardShell from '../components/DashboardShell'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { confirmAction, showSuccess } from '../utils/alerts'

const TYPE_COLOR = { success: '#22c55e', info: '#38bdf8', warning: '#f59e0b', error: '#ef4444' }

function fmt(val) {
  try { return new Date(val).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

const ROLE_LINKS = {
  student: [
    { to: '/student/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
    { to: '/student/activities', label: 'Activities', description: 'Log daily activities' },
    { to: '/student/history', label: 'History', description: 'All records' },
    { to: '/notifications', label: 'Notifications', description: 'All notifications' },
    { to: '/profile', label: 'Profile', description: 'Edit your account' },
  ],
  instructor: [
    { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
    { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
    { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
    { to: '/instructor/history', label: 'History', description: 'All attendance & evaluation records' },
    { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
    { to: '/notifications', label: 'Notifications', description: 'All notifications' },
    { to: '/profile', label: 'Profile', description: 'Edit your account' },
  ],
  employer: [
    { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
    { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
    { to: '/employer/history', label: 'History', description: 'All approval records' },
    { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
    { to: '/employer/roster', label: 'Roster', description: 'Instructors & their students' },
    { to: '/employer/certificates', label: 'Certificates', description: 'Issue e-certificates' },
    { to: '/notifications', label: 'Notifications', description: 'All notifications' },
    { to: '/profile', label: 'Profile', description: 'Edit your account' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
    { to: '/admin/users', label: 'Users', description: 'Manage users' },
    { to: '/admin/records', label: 'Records', description: 'Review all records' },
    { to: '/notifications', label: 'Notifications', description: 'All notifications' },
    { to: '/profile', label: 'Profile', description: 'Edit your account' },
  ],
}

function NotificationsPanel() {
  const { notifications, unread, doMarkRead, doMarkAllRead, doDelete, doBulkDelete } = useNotifications()
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const allSelected = notifications.length > 0 && notifications.every((n) => selected.has(n.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(notifications.map((n) => n.id)))

  const handleDelete = async (id) => {
    await doDelete(id)
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleBulkDelete = async () => {
    const ok = await confirmAction({
      title: `Delete ${selected.size} notification${selected.size > 1 ? 's' : ''}?`,
      confirmButtonText: 'Delete',
    })
    if (!ok) return
    await doBulkDelete([...selected])
    setSelected(new Set())
    showSuccess('Deleted', `${selected.size} notification${selected.size > 1 ? 's' : ''} removed.`)
  }

  const handleMarkAllRead = async () => {
    await doMarkAllRead()
    showSuccess('Done', 'All notifications marked as read.')
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Notifications</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0 }}>
            All Notifications
            {unread > 0 && (
              <span className="notif-count" style={{ marginLeft: 10, fontSize: '0.8rem' }}>{unread} unread</span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.size > 0 && (
              <button className="notif-action-btn danger" onClick={handleBulkDelete}>Delete {selected.size}</button>
            )}
            {unread > 0 && (
              <button className="notif-action-btn" onClick={handleMarkAllRead}>Mark all read</button>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <p className="muted" style={{ padding: '24px', margin: 0 }}>No notifications yet.</p>
        ) : (
          <>
            <div style={{ padding: '12px 18px 8px', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                Select all ({notifications.length})
              </label>
            </div>
            <div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? ' read' : ''}`}
                  style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.07)' }}
                  onClick={() => { if (!n.read) doMarkRead(n.id) }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(n.id)}
                    onChange={() => toggle(n.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ flexShrink: 0 }}
                  />
                  <span className="notif-dot" style={{ background: TYPE_COLOR[n.type] || '#38bdf8', width: 10, height: 10, marginTop: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="notif-title" style={{ fontSize: '0.92rem' }}>{n.title}</p>
                    {n.message && <p className="notif-msg">{n.message}</p>}
                    <p className="notif-time">{fmt(n.created_at)}</p>
                  </div>
                  <button
                    className="notif-del"
                    style={{ opacity: 1, color: 'var(--muted)' }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                    title="Delete"
                  >✕</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const links = ROLE_LINKS[user?.role] || []
  return (
    <ProtectedRoute allowedRoles={['student', 'instructor', 'employer', 'admin']}>
      <DashboardShell links={links}>
        <div className="page-shell dashboard-shell">
          <NotificationsPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
