import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

import PasswordField from './PasswordField'
import InstitutionField from './InstitutionField'
import { useAuth } from '../context/AuthContext'
import { showError, showSuccess, extractError } from '../utils/alerts'

function validateAuth(formData, isSignup) {
  const full_name = formData.get('full_name')?.trim() || ''
  const email = formData.get('email')?.trim() || ''
  const password = formData.get('password') || ''
  const confirm_password = formData.get('confirm_password') || ''
  const role = formData.get('role') || ''
  const institution = formData.get('institution')?.trim() || ''
  const company = formData.get('company')?.trim() || ''
  
  if (isSignup && full_name.length < 2) return 'Full name must be at least 2 characters'
  if (email.length < 5 || !email.includes('@')) return 'Please enter a valid email address'
  if (isSignup && password.length < 8) return 'Password must be at least 8 characters'
  if (!isSignup && !password) return 'Password is required'
  if (isSignup && password !== confirm_password) return 'Passwords do not match'
  if (isSignup && (role === 'student' || role === 'instructor') && !institution)
    return 'Please select your school'
  if (isSignup && role === 'supervisor' && !company)
    return 'Please enter your company name'
  return ''
}

export default function AuthForm({ mode }) {
  const navigate = useNavigate()
  const { login, signup, verifyEmail, resendVerification, forgotPassword, resetPassword } = useAuth()
  
  const [flowState, setFlowState] = useState(mode)
  const [emailForFlow, setEmailForFlow] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [role, setRole] = useState('student')

  useEffect(() => {
    setFlowState(mode)
  }, [mode])

  const isSignup = flowState === 'signup'
  const isLogin = flowState === 'login'
  const isVerify = flowState === 'verify'
  const isForgot = flowState === 'forgot-password'
  const isReset = flowState === 'reset-password'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    if (isSignup || isLogin) {
      const validationError = validateAuth(formData, isSignup)
      if (validationError) {
        showError(validationError)
        return
      }
      try {
        const email = formData.get('email')
        if (isSignup) {
          const response = await signup(buildSignupPayload(formData, avatarFile))
          if (response.requires_verification) {
            setEmailForFlow(email)
            setFlowState('verify')
            showSuccess('Verification Required', response.message || 'Please check your email.')
            return
          }
        } else {
          try {
            const response = await login({ email, password: formData.get('password') })
            showSuccess('Welcome back!', 'Redirecting to your dashboard')
            navigate(`/${response.user.role}/dashboard`)
          } catch (error) {
             const msg = extractError(error)
             if (msg === 'not_verified' || msg === 'Not verified' || msg.includes('not verified')) {
                setEmailForFlow(email)
                setFlowState('verify')
                showError('Account not verified', 'Please verify your email address to continue.')
                return
             }
             throw error
          }
        }
      } catch (error) {
        showError(isSignup ? 'Sign up failed' : 'Login failed', extractError(error))
      }
    } else if (isVerify) {
        const code = formData.get('code')
        if (code.length !== 6) return showError('Code must be 6 digits')
        try {
            const response = await verifyEmail({ email: emailForFlow, code })
            showSuccess('Verified!', 'Your account has been verified.')
            navigate(`/${response.user.role}/dashboard`)
        } catch(error) {
            showError('Verification failed', extractError(error))
        }
    } else if (isForgot) {
        const email = formData.get('email')
        if (!email || !email.includes('@')) return showError('Enter a valid email')
        try {
            await forgotPassword({ email })
            setEmailForFlow(email)
            setFlowState('reset-password')
            showSuccess('Code Sent', 'If the email is registered, a reset code was sent.')
        } catch(error) {
            showError('Request failed', extractError(error))
        }
    } else if (isReset) {
        const code = formData.get('code')
        const newPassword = formData.get('new_password')
        if (code.length !== 6) return showError('Code must be 6 digits')
        if (newPassword.length < 8) return showError('Password must be at least 8 characters')
        try {
            await resetPassword({ email: emailForFlow, code, new_password: newPassword })
            showSuccess('Password Reset', 'You can now login with your new password.')
            setFlowState('login')
            navigate('/login')
        } catch(error) {
            showError('Reset failed', extractError(error))
        }
    }
  }

  const handleResend = async () => {
    try {
        await resendVerification({ email: emailForFlow })
        showSuccess('Code Resent', 'Please check your email.')
    } catch(error) {
        showError('Resend failed', extractError(error))
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
        <h2>
            {isSignup && 'Create account'}
            {isLogin && 'Welcome back'}
            {isVerify && 'Verify Email'}
            {isForgot && 'Forgot Password'}
            {isReset && 'Reset Password'}
        </h2>
        <p>
            {isSignup && 'Register the role that matches your access level.'}
            {isLogin && 'Sign in to continue to your role dashboard.'}
            {isVerify && `Enter the 6-digit code sent to ${emailForFlow}.`}
            {isForgot && 'Enter your email to receive a password reset code.'}
            {isReset && 'Enter the reset code and your new password.'}
        </p>

        {(isSignup || isLogin) && (
          <>
            {isSignup && (
              <label>
                Full name
                <input name="full_name" type="text" placeholder="Alex Johnson" />
              </label>
            )}

            <label>
              Email
              <input name="email" type="email" placeholder="name@school.edu" />
            </label>

            {isSignup && (
              <label>
                Contact Number
                <input name="contact_number" type="tel" placeholder="+63 912 345 6789" />
              </label>
            )}

            <PasswordField 
              label="Password" 
              name="password" 
              placeholder="At least 8 characters" 
              autoComplete={isSignup ? 'new-password' : 'current-password'} 
            />

            {isSignup && (
              <PasswordField label="Confirm password" name="confirm_password" placeholder="Repeat your password" autoComplete="new-password" />
            )}

            {isSignup && (
              <label>
                Avatar upload
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </label>
            )}

            {isSignup && (
              <label>
                Role
                <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </label>
            )}

            {isSignup && <InstitutionField role={role} />}
          </>
        )}

        {isVerify && (
            <label>
              6-Digit Code
              <input name="code" type="text" placeholder="123456" maxLength={6} />
            </label>
        )}

        {isForgot && (
            <label>
              Email
              <input name="email" type="email" placeholder="name@school.edu" />
            </label>
        )}

        {isReset && (
            <>
              <label>
                6-Digit Code
                <input name="code" type="text" placeholder="123456" maxLength={6} />
              </label>
              <PasswordField label="New Password" name="new_password" placeholder="At least 8 characters" />
            </>
        )}

        <button className="primary-button" type="submit">
          {isSignup && 'Sign up'}
          {isLogin && 'Login'}
          {isVerify && 'Verify Account'}
          {isForgot && 'Send Reset Code'}
          {isReset && 'Update Password'}
        </button>

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button type="button" onClick={() => setFlowState('forgot-password')} style={{ fontSize: '0.9rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Forgot password?
            </button>
          </div>
        )}

        {isVerify && (
             <button type="button" className="secondary-button" onClick={handleResend} style={{ marginTop: '12px' }}>
                Resend Code
             </button>
        )}

        {(isVerify || isForgot || isReset) && (
            <p className="auth-switch" style={{ marginTop: '16px' }}>
                <button type="button" onClick={() => setFlowState('login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                    Back to login
                </button>
            </p>
        )}

        {(isSignup || isLogin) && (
            <p className="auth-switch">
              {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
              {isSignup ? <Link to="/login">Login</Link> : <Link to="/signup">Sign up</Link>}
            </p>
        )}
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
  const institution = formData.get('institution')
  if (institution) payload.append('institution', institution)
  const company = formData.get('company')
  if (company) payload.append('company', company)
  const contact_number = formData.get('contact_number')
  if (contact_number) payload.append('contact_number', contact_number)
  if (avatarFile) payload.append('avatar_file', avatarFile)
  return payload
}

