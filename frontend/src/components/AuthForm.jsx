import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'

import PasswordField from './PasswordField'
import { useAuth } from '../context/AuthContext'
import { showError } from '../utils/alerts'

export default function AuthForm({ mode }) {
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  const isSignup = mode === 'signup'
  const [avatarFile, setAvatarFile] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const response = isSignup ? await signup(buildSignupPayload(formData, avatarFile)) : await login({ email: formData.get('email'), password: formData.get('password') })
      navigate(`/${response.user.role}/dashboard`)
    } catch (error) {
      const message = error?.response?.data?.detail || 'Something went wrong'
      showError(message)
    }
  }

  return (
    <div className="page-shell auth-shell">
      <motion.form
        className="auth-card"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2>{isSignup ? 'Create account' : 'Welcome back'}</h2>
        <p>{isSignup ? 'Register the role that matches your access level.' : 'Sign in to continue to your role dashboard.'}</p>

        {isSignup && (
          <label>
            Full name
            <input name="full_name" type="text" placeholder="Alex Johnson" required />
          </label>
        )}

        <label>
          Email
          <input name="email" type="email" placeholder="name@school.edu" required />
        </label>

        <PasswordField label="Password" name="password" placeholder="At least 8 characters" required autoComplete={isSignup ? 'new-password' : 'current-password'} />

        {isSignup && (
          <label>
            Avatar upload
            <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
          </label>
        )}

        {isSignup && (
          <label>
            Role
            <select name="role" defaultValue="student" required>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        )}

        <button className="primary-button" type="submit">
          {isSignup ? 'Sign up' : 'Login'}
        </button>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'Need an account?'} {isSignup ? <Link to="/login">Login</Link> : <Link to="/signup">Sign up</Link>}
        </p>
      </motion.form>
    </div>
  )
}

function buildSignupPayload(formData, avatarFile) {
  const payload = new FormData()
  payload.append('full_name', formData.get('full_name'))
  payload.append('email', formData.get('email'))
  payload.append('password', formData.get('password'))
  payload.append('role', formData.get('role'))
  if (avatarFile) {
    payload.append('avatar_file', avatarFile)
  }
  return payload
}
