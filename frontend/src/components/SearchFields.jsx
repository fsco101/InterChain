import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarBadge from './AvatarBadge'
import { searchUsers, searchStudentsByInternshipId } from '../api/records'

const INPUT_STYLE = {
  width: '100%', minHeight: 44, borderRadius: 14,
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(15,23,42,0.7)', color: 'var(--text)',
  padding: '0 14px', font: 'inherit', boxSizing: 'border-box',
}

const DROP_STYLE = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
  background: 'rgba(10,18,36,0.98)', border: '1px solid rgba(56,189,248,0.25)',
  borderRadius: 14, marginTop: 4, maxHeight: 260, overflowY: 'auto',
  backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(2,6,23,0.7)',
}

function DropItem({ children, onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(148,163,184,0.08)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </div>
  )
}

// callerRole: 'instructor' | 'employer'
// role: 'student' | 'instructor'
// onChange: (user) => void  — called with the selected user object
// name: hidden input name for FormData
export function UserSearchField({ label, role, callerRole, name, onChange, placeholder, resetKey }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const ref = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    if (resetKey === undefined) return
    setQuery('')
    setSelected(null)
    setResults([])
    setOpen(false)
    setSearchError(null)
  }, [resetKey])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = (q) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const { data } = await searchUsers(role, q, callerRole)
        const users = data.users || []
        setResults(users)
        setSearchError(null)
        setOpen(users.length > 0)
      } catch (err) {
        const status = err?.response?.status
        setResults([])
        setOpen(false)
        setSearchError(
          status === 401 ? 'Session expired — please log in again' :
          status === 403 ? 'Not authorized to search' :
          'Search failed — check your connection'
        )
        console.error('[UserSearchField]', status, err?.response?.data || err?.message)
      }
    }, 220)
  }

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    setSelected(null)
    setSearchError(null)
    if (onChange) onChange(null)
    if (q.trim().length >= 1) doSearch(q)
    else { setResults([]); setOpen(false) }
  }

  const pick = (user) => {
    setSelected(user)
    setQuery(`${user.full_name} (${user.role_id})`)
    setOpen(false)
    if (onChange) onChange(user)
  }

  const handleFocus = () => { if (query.trim().length >= 1 && results.length) setOpen(true) }

  return (
    <label style={{ display: 'grid', gap: 8, color: 'var(--muted)', position: 'relative' }} ref={ref}>
      {label}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder || `Search by name or ID…`}
        autoComplete="off"
        style={INPUT_STYLE}
      />
      {/* hidden input for FormData */}
      <input type="hidden" name={name} value={selected?.role_id || ''} />

      {searchError && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#f87171' }}>{searchError}</p>
      )}

      {open && results.length > 0 && (
        <div style={DROP_STYLE}>
          {results.map((u) => (
            <DropItem key={u.id} onMouseDown={() => pick(u)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to={`/profile/${u.id}`} onMouseDown={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: 'block' }}>
                  <AvatarBadge name={u.full_name} avatarUrl={u.avatar_url} size={36} />
                </Link>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/profile/${u.id}`} onMouseDown={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</p>
                  </Link>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {u.role_id} {u.institution ? `· ${u.institution}` : ''}
                    {u.internship_id ? ` · ${u.internship_id}` : ''}
                    {u.ojt_position ? ` · ${u.ojt_position}` : ''}
                  </p>
                </div>
              </div>
            </DropItem>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <Link to={`/profile/${selected.id}`} style={{ flexShrink: 0, display: 'block' }}>
            <AvatarBadge name={selected.full_name} avatarUrl={selected.avatar_url} size={32} />
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link to={`/profile/${selected.id}`} style={{ textDecoration: 'none' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{selected.full_name}</p>
            </Link>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
              {selected.role_id}
              {selected.internship_id ? ` · ${selected.internship_id}` : ''}
              {selected.email ? ` · ${selected.email}` : ''}
              {selected.ojt_position ? ` · ${selected.ojt_position}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setSelected(null); setQuery(''); if (onChange) onChange(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
          >✕</button>
        </div>
      )}
    </label>
  )
}

// Internship ID search — searches students by their assigned internship_id
export function InternshipSearchField({ name, callerRole, resetKey }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null) // { internship_id, full_name, avatar_url, role_id }
  const [open, setOpen] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const ref = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    if (resetKey === undefined) return
    setQuery('')
    setSelected(null)
    setResults([])
    setOpen(false)
    setSearchError(null)
  }, [resetKey])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = (q) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const { data } = await searchStudentsByInternshipId(q)
        const users = (data.users || []).filter((u) => u.internship_id)
        setResults(users)
        setSearchError(null)
        setOpen(users.length > 0)
      } catch (err) {
        const status = err?.response?.status
        setResults([])
        setOpen(false)
        setSearchError(
          status === 401 ? 'Session expired — please log in again' :
          status === 403 ? 'Not authorized' :
          'Search failed'
        )
        console.error('[InternshipSearchField]', status, err?.response?.data || err?.message)
      }
    }, 220)
  }

  const pick = (user) => {
    setSelected(user)
    setQuery(user.internship_id)
    setOpen(false)
  }

  const clear = () => { setSelected(null); setQuery(''); setResults([]); setOpen(false); setSearchError(null) }

  return (
    <label style={{ display: 'grid', gap: 8, color: 'var(--muted)', position: 'relative' }} ref={ref}>
      Internship ID
      <input type="hidden" name={name} value={selected?.internship_id || ''} />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSearchError(null); doSearch(e.target.value) }}
        onFocus={() => { if (!results.length) doSearch(query) }}
        placeholder="Search by internship ID or student name…"
        autoComplete="off"
        style={INPUT_STYLE}
      />
      {searchError && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#f87171' }}>{searchError}</p>
      )}
      {open && results.length > 0 && (
        <div style={DROP_STYLE}>
          {results.map((u) => (
            <DropItem key={u.id} onMouseDown={() => pick(u)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to={`/profile/${u.id}`} onMouseDown={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: 'block' }}>
                  <AvatarBadge name={u.full_name} avatarUrl={u.avatar_url} size={36} />
                </Link>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/profile/${u.id}`} onMouseDown={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</p>
                  </Link>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{u.role_id}</span>
                    {' · '}
                    <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{u.internship_id}</span>
                    {u.institution ? ` · ${u.institution}` : ''}
                  </p>
                </div>
              </div>
            </DropItem>
          ))}
        </div>
      )}
      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <Link to={`/profile/${selected.id}`} style={{ flexShrink: 0, display: 'block' }}>
            <AvatarBadge name={selected.full_name} avatarUrl={selected.avatar_url} size={32} />
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link to={`/profile/${selected.id}`} style={{ textDecoration: 'none' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{selected.full_name}</p>
            </Link>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{selected.role_id}</span>
              {' · '}
              <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{selected.internship_id}</span>
              {selected.institution ? ` · ${selected.institution}` : ''}
              {selected.email ? ` · ${selected.email}` : ''}
            </p>
          </div>
          <button type="button" onClick={clear} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
        </div>
      )}
    </label>
  )
}
