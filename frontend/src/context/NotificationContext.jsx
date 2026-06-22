import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { fetchNotifications, markRead, markAllRead, deleteNotification, bulkDeleteNotifications } from '../api/notifications'

const NotifContext = createContext(null)

export function NotificationProvider({ children }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const intervalRef = useRef(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await fetchNotifications()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch { /* silent */ }
  }, [token])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 30000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  const doMarkRead = async (id) => {
    await markRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((c) => Math.max(0, c - 1))
  }

  const doMarkAllRead = async () => {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  const doDelete = async (id) => {
    const n = notifications.find((x) => x.id === id)
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((x) => x.id !== id))
    if (n && !n.read) setUnread((c) => Math.max(0, c - 1))
  }

  const doBulkDelete = async (ids) => {
    const deletedUnread = notifications.filter((n) => ids.includes(n.id) && !n.read).length
    await bulkDeleteNotifications(ids)
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)))
    setUnread((c) => Math.max(0, c - deletedUnread))
  }

  return (
    <NotifContext.Provider value={{ notifications, unread, load, doMarkRead, doMarkAllRead, doDelete, doBulkDelete }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotifContext)
}
