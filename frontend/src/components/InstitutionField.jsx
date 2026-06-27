import { useEffect, useRef, useState } from 'react'
import PH_SCHOOLS from '../data/phSchools'

export default function InstitutionField({ role }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const ref = useRef(null)

  const isPhRole = role === 'student' || role === 'instructor'

  const filtered = isPhRole
    ? PH_SCHOOLS.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (role === 'supervisor') {
    return (
      <label>
        Company Name *
        <input name="company" type="text" placeholder="e.g. Acme Corporation" required />
      </label>
    )
  }

  if (!isPhRole) {
    return (
      <label>
        Organization / Company
        <input name="institution" type="text" placeholder="e.g. Acme Corp (optional)" />
      </label>
    )
  }

  const pick = (school) => {
    setSelected(school)
    setQuery(school)
    setOpen(false)
  }

  return (
    <label style={{ position: 'relative' }} ref={ref}>
      School / University
      <input
        type="text"
        placeholder="Search Philippine schools..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSelected(''); setOpen(true) }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {/* hidden input carries the value for FormData */}
      <input type="hidden" name="institution" value={selected} />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'rgba(10,18,36,0.98)', border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: 14, marginTop: 4, maxHeight: 240, overflowY: 'auto',
          backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(2,6,23,0.6)',
        }}>
          {filtered.map((s) => (
            <div
              key={s}
              onMouseDown={() => pick(s)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: '0.88rem',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </label>
  )
}
