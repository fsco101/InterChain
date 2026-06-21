import { useEffect, useState } from 'react'

import AvatarBadge from '../../components/AvatarBadge'
import DashboardShell from '../../components/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'
import PasswordField from '../../components/PasswordField'
import { createAdminUser, deleteAdminUser, fetchAdminUsers, updateAdminUser } from '../../api/admin'
import { confirmAction, showError, showSuccess } from '../../utils/alerts'

const emptyForm = {
  full_name: '',
  email: '',
  role: 'student',
  avatar_file: null,
  password: '',
}

function AdminUsersPanel() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingUserId, setEditingUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [avatarFile])

  const loadUsers = async () => {
    try {
      const { data } = await fetchAdminUsers()
      setUsers(data)
    } catch (error) {
      showError(error?.response?.data?.detail || 'Unable to load users')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const startEdit = (user) => {
    setEditingUserId(user.id)
    setAvatarFile(null)
    setForm({ full_name: user.full_name || '', email: user.email || '', role: user.role || 'student', password: '' })
  }

  const resetForm = () => {
    setEditingUserId(null)
    setAvatarFile(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
      }

      const multipart = new FormData()
      multipart.append('full_name', payload.full_name)
      multipart.append('email', payload.email)
      multipart.append('role', payload.role)
      if (form.password.trim()) {
        multipart.append('password', form.password)
      }
      if (avatarFile) {
        multipart.append('avatar_file', avatarFile)
      }

      if (editingUserId) {
        await updateAdminUser(editingUserId, multipart)
        showSuccess('User updated')
      } else {
        await createAdminUser(multipart)
        showSuccess('User created')
      }

      resetForm()
      await loadUsers()
    } catch (error) {
      showError(error?.response?.data?.detail || 'Unable to save user')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = await confirmAction({
      title: 'Delete user?',
      text: `Remove ${user.full_name} from the system?`,
      confirmButtonText: 'Delete',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteAdminUser(user.id)
      showSuccess('User deleted')
      await loadUsers()
      if (editingUserId === user.id) {
        resetForm()
      }
    } catch (error) {
      showError(error?.response?.data?.detail || 'Unable to delete user')
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">User management</p>
        <h2>{editingUserId ? 'Edit user' : 'Create a user'}</h2>
        <p className="muted">Admins can create, update, and remove accounts directly from the dashboard.</p>

        <form className="form-card admin-user-form" onSubmit={handleSubmit}>
          <div className="admin-form-preview">
            <AvatarBadge name={form.full_name} avatarUrl={avatarPreview || users.find((user) => user.id === editingUserId)?.avatar_url || ''} size={72} />
            <div>
              <strong>{form.full_name || 'User preview'}</strong>
              <p className="muted">{form.role}</p>
            </div>
          </div>

          <div className="grid-two">
            <label>
              Full name
              <input name="full_name" value={form.full_name} onChange={handleChange} type="text" required />
            </label>

            <label>
              Email
              <input name="email" value={form.email} onChange={handleChange} type="email" required />
            </label>
          </div>

          <div className="grid-two">
            <label>
              Role
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              Avatar upload
              <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
            </label>
          </div>

          <PasswordField label="Password" name="password" value={form.password} onChange={handleChange} placeholder={editingUserId ? 'Leave blank to keep current password' : 'Set a password'} autoComplete="new-password" />

          <div className="button-row">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingUserId ? 'Update user' : 'Create user'}
            </button>
            {editingUserId ? (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="dashboard-card">
        <p className="eyebrow">Accounts</p>
        <div className="users-table">
          {users.map((user) => (
            <div key={user.id} className="users-row">
              <AvatarBadge name={user.full_name} avatarUrl={user.avatar_url} size={52} />
              <div>
                <strong>{user.full_name}</strong>
                <p className="muted">{user.email}</p>
              </div>
              <span className="role-chip">{user.role}</span>
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={() => startEdit(user)}>
                  Edit
                </button>
                <button className="secondary-button danger-button" type="button" onClick={() => handleDelete(user)}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 ? <p className="muted">No users found.</p> : null}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardShell
        links={[
          { to: '/admin/dashboard', label: 'Overview', description: 'Admin summary', end: true },
          { to: '/admin/users', label: 'Users', description: 'Manage accounts', end: true },
          { to: '/profile', label: 'Profile', description: 'Edit your account' },
        ]}
      >
        <div className="page-shell dashboard-shell">
          <AdminUsersPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}