import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { loginRequest, meRequest, signupRequest, updateProfileRequest } from '../api/auth'

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
    toast.success('Login successful')
    return data
  }

  const signup = async (payload) => {
    const { data } = await signupRequest(payload)
    persistSession(data.access_token, data.user)
    toast.success('Account created')
    return data
  }

  const updateProfile = async (payload) => {
    const { data } = await updateProfileRequest(payload)
    localStorage.setItem('internchain_user', JSON.stringify(data))
    setUser(data)
    toast.success('Profile updated')
    return data
  }

  const logout = () => {
    localStorage.removeItem('internchain_token')
    localStorage.removeItem('internchain_user')
    setToken(null)
    setUser(null)
    toast.message('Signed out')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, updateProfile, logout }}>
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
