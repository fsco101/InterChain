import { createContext, useContext, useEffect, useState } from 'react'

import { 
  loginRequest, meRequest, signupRequest, updateProfileRequest,
  verifyEmailRequest, resendVerificationRequest, forgotPasswordRequest, resetPasswordRequest
} from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('internchain_token'))
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await meRequest()
        setUser(data)
        localStorage.setItem('internchain_user', JSON.stringify(data))
      } catch {
        localStorage.removeItem('internchain_token')
        localStorage.removeItem('internchain_user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [token])

  const persistSession = (accessToken, nextUser) => {
    localStorage.setItem('internchain_token', accessToken)
    localStorage.setItem('internchain_user', JSON.stringify(nextUser))
    setToken(accessToken)
    setUser(nextUser)
  }

  const login = async (payload) => {
    const { data } = await loginRequest(payload)
    persistSession(data.access_token, data.user)
    return data
  }

  const signup = async (payload) => {
    const { data } = await signupRequest(payload)
    if (!data.requires_verification) {
      persistSession(data.access_token, data.user)
    }
    return data
  }

  const verifyEmail = async (payload) => {
    const { data } = await verifyEmailRequest(payload)
    persistSession(data.access_token, data.user)
    return data
  }

  const resendVerification = async (payload) => {
    const { data } = await resendVerificationRequest(payload)
    return data
  }

  const forgotPassword = async (payload) => {
    const { data } = await forgotPasswordRequest(payload)
    return data
  }

  const resetPassword = async (payload) => {
    const { data } = await resetPasswordRequest(payload)
    return data
  }

  const updateProfile = async (payload) => {
    const { data } = await updateProfileRequest(payload)
    localStorage.setItem('internchain_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('internchain_token')
    localStorage.removeItem('internchain_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, 
      login, signup, updateProfile, logout,
      verifyEmail, resendVerification, forgotPassword, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
