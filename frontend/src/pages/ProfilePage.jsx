import { useEffect, useState } from 'react'

import AvatarBadge from '../components/AvatarBadge'
import DashboardShell from '../components/DashboardShell'
import ProtectedRoute from '../components/ProtectedRoute'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/AuthContext'
import { showError, showSuccess, extractError } from '../utils/alerts'
import { validateProfile } from '../utils/validation'

const buildLinks = (role) => {
  const links = [
    { to: `/${role}/dashboard`, label: 'Overview', description: 'Dashboard summary', end: true },
    { to: '/profile', label: 'Profile', description: 'Update your account' },
  ]

  if (role === 'admin') {
    links.splice(1, 0, { to: '/admin/users', label: 'Users', description: 'Manage user accounts' })
  }

  return links
}

function ProfileEditor() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    setForm({ full_name: user.full_name || '', email: user.email || '', password: '', confirm_password: '' })
  }, [user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateProfile(form)
    if (validationError) {
      showError('Invalid input', validationError)
      return
    }
    setSaving(true)
    try {
      const multipart = new FormData()
      multipart.append('full_name', form.full_name.trim())
      multipart.append('email', form.email.trim())
      if (form.password.trim()) multipart.append('password', form.password)
      if (avatarFile) multipart.append('avatar_file', avatarFile)
      await updateProfile(multipart)
      showSuccess('Profile updated', 'Your changes have been saved.')
      setForm((current) => ({ ...current, password: '', confirm_password: '' }))
      setAvatarFile(null)
    } catch (error) {
      showError('Update failed', extractError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-card profile-card">
      <div>
        <p className="eyebrow">Profile</p>
        <h2>Edit your account</h2>
        <p className="muted">Update your name, email, and password. Role changes are reserved for admins.</p>
      </div>

      <div className="profile-avatar-row">
        <AvatarBadge name={user?.full_name} avatarUrl={user?.avatar_url} size={84} />
        <div className="profile-avatar-copy">
          <strong>{user?.full_name}</strong>
          <span className="muted">Upload an image to personalize your account.</span>
          {user?.role_id && (
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>
              {user.role_id}
            </span>
          )}
          {user?.institution && (
            <span className="muted" style={{ fontSize: '0.8rem' }}>{user.institution}</span>
          )}
        </div>
      </div>

      <form className="form-card profile-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input name="full_name" value={form.full_name} onChange={handleChange} type="text" />
        </label>

        <label>
          Email
          <input name="email" value={form.email} onChange={handleChange} type="email" />
        </label>

        <label>
          Avatar upload
          <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
        </label>

        <PasswordField label="New password" name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current password" autoComplete="new-password" />

        <PasswordField label="Confirm new password" name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="Repeat the new password" autoComplete="new-password" />

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardShell links={buildLinks(user?.role || 'student')}>
        <div className="page-shell dashboard-shell">
          <ProfileEditor />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}