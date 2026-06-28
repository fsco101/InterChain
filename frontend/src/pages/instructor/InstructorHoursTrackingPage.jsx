import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchInstructorRosterHours, setStudentRequiredHours } from '../../api/records'
import { showError, showSuccess, extractError, showLoading, closeAlert } from '../../utils/alerts'
import AvatarBadge from '../../components/AvatarBadge'
import { INSTRUCTOR_LINKS } from '../../utils/links'

function HoursTrackingPanel() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState('alphabetical') // alphabetical, remaining_few, remaining_many, latest
  const [editId, setEditId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await fetchInstructorRosterHours()
      setStudents(data.students || [])
    } catch (err) {
      showError('Failed to load hours', extractError(err))
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSaveHours = async (roleId) => {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      showError('Invalid input', 'Please enter a valid number of hours.')
      return
    }
    showLoading('Saving hours...')
    try {
      await setStudentRequiredHours(roleId, val)
      closeAlert()
      showSuccess('Saved', 'Required hours updated.')
      setEditId(null)
      // update local state to avoid full reload
      setStudents(prev => prev.map(s => 
        s.role_id === roleId ? { 
          ...s, 
          required_hours: val, 
          remaining_hours: Math.max(0, val - s.consumed_hours)
        } : s
      ))
    } catch (err) {
      closeAlert()
      showError('Failed to save hours', extractError(err))
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    if (sortMode === 'alphabetical') {
      return a.full_name.localeCompare(b.full_name)
    } else if (sortMode === 'remaining_few') {
      return a.remaining_hours - b.remaining_hours
    } else if (sortMode === 'remaining_many') {
      return b.remaining_hours - a.remaining_hours
    } else if (sortMode === 'latest') {
      const dateA = new Date(a.updated_at || 0).getTime()
      const dateB = new Date(b.updated_at || 0).getTime()
      return dateB - dateA
    }
    return 0
  })

  const filteredStudents = sortedStudents.filter(s => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (s.full_name?.toLowerCase().includes(q) || s.role_id?.toLowerCase().includes(q))
  })

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Instructor</p>
        <h2>Required Hours Tracking</h2>
        <p className="muted">Set the required hours for your students and monitor their consumed and remaining hours based on validated attendance.</p>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>Sort by:</span>
          <select 
            value={sortMode} 
            onChange={e => setSortMode(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
          >
            <option value="alphabetical">Alphabetical Name</option>
            <option value="remaining_few">Fewer Remaining Hours</option>
            <option value="remaining_many">More Remaining Hours</option>
            <option value="latest">Latest Updated</option>
          </select>
          <input 
            type="text" 
            placeholder="Search student name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', flex: 1, maxWidth: 300 }}
          />
        </div>
      </div>

      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Student Hours ({students.length})</p>
        {loading ? (
          <p className="muted">Loading hours...</p>
        ) : students.length === 0 ? (
          <p className="muted">No students in your roster.</p>
        ) : (
          <div className="users-table">
            <div className="users-row" style={{ fontWeight: 600, background: 'transparent', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ flex: 2 }}>Student</div>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>Required</div>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>Consumed</div>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>Remaining</div>
            </div>
            {filteredStudents.map((s) => (
              <div key={s.role_id} className="users-row" style={{ alignItems: 'center' }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={36} />
                  <div>
                    <strong>{s.full_name}</strong>
                    <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>{s.role_id}</p>
                  </div>
                </div>

                <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>
                  {editId === s.role_id ? (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <input 
                        type="number" 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)}
                        style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--accent)' }}
                        min="0"
                      />
                      <button className="primary-button" style={{ padding: '4px 8px', minHeight: 'unset' }} onClick={() => handleSaveHours(s.role_id)}>Save</button>
                      <button className="secondary-button" style={{ padding: '4px 8px', minHeight: 'unset' }} onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: 6 }}>{s.required_hours}h</span>
                      <button 
                        className="secondary-button" 
                        style={{ padding: '2px 8px', minHeight: 'unset', fontSize: '0.75rem' }} 
                        onClick={() => { setEditId(s.role_id); setEditValue(s.required_hours) }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 10px', borderRadius: 6 }}>{s.consumed_hours}h</span>
                </div>

                <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, background: s.remaining_hours <= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: s.remaining_hours <= 0 ? '#22c55e' : '#f59e0b', padding: '4px 10px', borderRadius: 6 }}>
                    {s.remaining_hours}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function InstructorHoursTrackingPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <DashboardShell links={INSTRUCTOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <HoursTrackingPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
