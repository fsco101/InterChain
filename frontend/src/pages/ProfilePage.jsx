import { useEffect, useState } from 'react'

import AvatarBadge from '../components/AvatarBadge'
import DashboardShell from '../components/DashboardShell'
import ProtectedRoute from '../components/ProtectedRoute'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/AuthContext'
import { showError, showSuccess, extractError } from '../utils/alerts'
import { validateProfile } from '../utils/validation'
import { UserProfileContent } from './UserProfilePage'

import { ROLE_LINKS } from '../utils/links'

function ProfileEditor() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', contact_number: '', password: '', confirm_password: '', social_links: { github: '', linkedin: '', website: '', facebook: '', instagram: '', twitter: '' } })
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    setForm({ full_name: user.full_name || '', email: user.email || '', contact_number: user.contact_number || '', password: '', confirm_password: '', social_links: user.social_links || { github: '', linkedin: '', website: '', facebook: '', instagram: '', twitter: '' } })
  }, [user])

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name.startsWith('social_links.')) {
      const key = name.split('.')[1]
      setForm((current) => ({ ...current, social_links: { ...current.social_links, [key]: value } }))
    } else {
      setForm((current) => ({ ...current, [name]: value }))
    }
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
      if (form.contact_number?.trim()) multipart.append('contact_number', form.contact_number.trim())
      if (form.password.trim()) multipart.append('password', form.password)
      if (avatarFile) multipart.append('avatar_file', avatarFile)
      multipart.append('social_links', JSON.stringify(form.social_links))
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
          {user?.role === 'student' && user?.internship_id && (
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#a78bfa', letterSpacing: '0.08em' }}>
              {user.internship_id}
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
          <input name="email" value={form.email} onChange={handleChange} type="email" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </label>

        <label>
          Contact Number
          <input name="contact_number" value={form.contact_number} onChange={handleChange} type="tel" placeholder="+63 912 345 6789" />
        </label>

        <label>
          Avatar upload
          <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
        </label>

        <p className="eyebrow" style={{ marginTop: 16 }}>Social Links</p>
        <label>
          GitHub
          <input name="social_links.github" value={form.social_links.github} onChange={handleChange} type="url" placeholder="https://github.com/username" />
        </label>
        <label>
          LinkedIn
          <input name="social_links.linkedin" value={form.social_links.linkedin} onChange={handleChange} type="url" placeholder="https://linkedin.com/in/username" />
        </label>
        <label>
          Website
          <input name="social_links.website" value={form.social_links.website || ''} onChange={handleChange} type="url" placeholder="https://yourportfolio.com" />
        </label>
        <label>
          Facebook
          <input name="social_links.facebook" value={form.social_links.facebook || ''} onChange={handleChange} type="url" placeholder="https://facebook.com/username" />
        </label>
        <label>
          Instagram
          <input name="social_links.instagram" value={form.social_links.instagram || ''} onChange={handleChange} type="url" placeholder="https://instagram.com/username" />
        </label>
        <label>
          Twitter / X
          <input name="social_links.twitter" value={form.social_links.twitter || ''} onChange={handleChange} type="url" placeholder="https://twitter.com/username" />
        </label>

        <p className="eyebrow" style={{ marginTop: 16 }}>Security</p>

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
      <DashboardShell links={ROLE_LINKS[user?.role || 'student']}>
        <div className="page-shell dashboard-shell" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <UserProfileContent providedUserId={user?.id} hideShell={true} />
          <ProfileEditor />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}