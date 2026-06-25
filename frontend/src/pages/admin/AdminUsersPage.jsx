import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarBadge from '../../components/AvatarBadge'
import DashboardShell from '../../components/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'
import { fetchAdminUsers, updateAdminUserRole, backfillRoleIds } from '../../api/admin'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/admin/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/admin/users', label: 'Users', description: 'Manage accounts' },
  { to: '/admin/records', label: 'Records', description: 'Review all records' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

const ROLES = ['student', 'instructor', 'employer', 'admin']

function AdminUsersPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    try {
      const { data } = await fetchAdminUsers()
      setUsers(data.users)
    } catch (error) {
      showError('Failed to load users', extractError(error))
    }
  }

  useEffect(() => { loadUsers() }, [])

  const filtered = users.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.role.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const openRoleChange = (user) => {
    setSelectedUser(user)
    setNewRole(user.role)
  }

  const handleRoleChange = async () => {
    if (!selectedUser || newRole === selectedUser.role) {
      setSelectedUser(null)
      return
    }
    const confirmed = await confirmAction({
      title: 'Change user role?',
      text: `Change ${selectedUser.full_name} from ${selectedUser.role} to ${newRole}?`,
      confirmButtonText: 'Change Role',
    })
    if (!confirmed) return
    setSaving(true)
    try {
      await updateAdminUserRole(selectedUser.id, newRole)
      showSuccess('Role updated', `${selectedUser.full_name} is now a ${newRole}.`)
      setSelectedUser(null)
      await loadUsers()
    } catch (error) {
      showError('Role change failed', extractError(error))
    } finally {
      setSaving(false)
    }
  }

  const handleBackfill = async () => {
    try {
      const { data } = await backfillRoleIds()
      showSuccess('Backfill complete', data.message)
      await loadUsers()
    } catch (error) {
      showError('Backfill failed', extractError(error))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">User Management</p>
        <h2>System Users</h2>
        <p className="muted">View all registered users. You can change a user's role but cannot modify other account details.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.7)', color: 'var(--text)', padding: '0 14px' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.7)', color: 'var(--text)', padding: '0 14px' }}
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
          </select>
          <button className="secondary-button" type="button" onClick={handleBackfill} title="Assign role IDs to users missing them">
            Assign Missing Role IDs
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="dashboard-card" style={{ border: '1px solid rgba(56,189,248,0.3)' }}>
          <p className="eyebrow">Change Role</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Link to={`/profile/${selectedUser.id}`} style={{ flexShrink: 0, display: 'block' }}>
              <AvatarBadge name={selectedUser.full_name} avatarUrl={selectedUser.avatar_url} size={48} />
            </Link>
            <div>
              <Link to={`/profile/${selectedUser.id}`} style={{ textDecoration: 'none' }}>
                <strong>{selectedUser.full_name}</strong>
              </Link>
              <p className="muted" style={{ margin: 0 }}>{selectedUser.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.7)', color: 'var(--text)', padding: '0 14px' }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="primary-button" onClick={handleRoleChange} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm Change'}
            </button>
            <button className="secondary-button" onClick={() => setSelectedUser(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Accounts ({filtered.length})</p>
        <div className="users-table">
          {filtered.length === 0 && <p className="muted">No users match your search.</p>}
          {filtered.map((u) => (
            <div key={u.id} className="users-row">
              <Link to={`/profile/${u.id}`} style={{ flexShrink: 0, display: 'block' }}>
                <AvatarBadge name={u.full_name} avatarUrl={u.avatar_url} size={48} />
              </Link>
              <div>
                <Link to={`/profile/${u.id}`} style={{ textDecoration: 'none' }}>
                  <strong>{u.full_name}</strong>
                </Link>
                <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{u.email}</p>
                {u.role_id && (
                  <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent)' }}>{u.role_id}</p>
                )}
                {u.role === 'student' && u.internship_id && (
                  <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#a78bfa' }}>{u.internship_id}</p>
                )}
                {u.institution && (
                  <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>{u.institution}</p>
                )}
                <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>
                  Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
              <span className="role-chip">{u.role}</span>
              <button
                className="secondary-button"
                type="button"
                onClick={() => openRoleChange(u)}
                disabled={u.id === currentUser?.id}
                title={u.id === currentUser?.id ? "Can't change your own role" : 'Change role'}
              >
                Change Role
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <AdminUsersPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
