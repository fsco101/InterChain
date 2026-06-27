import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchSupervisorRoster, addInstructorToRoster, removeInstructorFromRoster, assignStudentPosition, fetchPositions, linkStudentToCompany, unlinkStudentFromCompany } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { UserSearchField } from '../../components/SearchFields'
import { SUPERVISOR_LINKS } from '../../utils/links'
import { useAuth } from '../../context/AuthContext'

function InstructorCard({ instructor, onRefresh, positions }) {
  const { user: currentUser } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const students = instructor.students || []

  const handleRemove = async () => {
    const ok = await confirmAction({ title: `Remove ${instructor.full_name}?`, text: 'This will remove the instructor and all their students from your roster.' })
    if (!ok) return
    try { await removeInstructorFromRoster(instructor.role_id); showSuccess('Removed'); onRefresh?.() }
    catch (err) { showError('Failed', extractError(err)) }
  }

  const handleLinkStudent = async (studentId, studentName) => {
    try {
      await linkStudentToCompany(studentId)
      showSuccess('Added to Roster', `${studentName} is now pending in your Intern Roster. Please review their documents.`)
      onRefresh?.()
    } catch (err) {
      showError('Failed to add', extractError(err))
    }
  }

  const handleUnlinkStudent = async (studentId, studentName) => {
    const ok = await confirmAction({ title: `Unlink ${studentName}?`, text: 'This will remove the student from your company.' })
    if (!ok) return
    try {
      await unlinkStudentFromCompany(studentId)
      showSuccess('Student Unlinked', `${studentName} has been removed from your company.`)
      onRefresh?.()
    } catch (err) {
      showError('Failed to unlink', extractError(err))
    }
  }

  return (
    <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(148,163,184,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to={`/profile/${instructor.user_id}`}><AvatarBadge name={instructor.full_name} avatarUrl={instructor.avatar_url} size={42} /></Link>
          <div>
            <Link to={`/profile/${instructor.user_id}`} style={{ textDecoration: 'none' }}><strong>{instructor.full_name}</strong></Link>
            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>{instructor.role_id} · {instructor.institution || 'Unknown School'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide Students' : `View Students (${students.length})`}</button>
          <button className="secondary-button danger-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleRemove}>Remove</button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}>
          {students.length === 0 ? <p className="muted" style={{ padding: '16px 20px', margin: 0 }}>No students assigned to this instructor.</p> : (
            <div className="users-table">
              {students.map((s) => (
                <div key={s.role_id} className="users-row" style={{ padding: '12px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <Link to={`/profile/${s.user_id}`}><AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={32} /></Link>
                    <div>
                      <Link to={`/profile/${s.user_id}`} style={{ textDecoration: 'none' }}><strong>{s.full_name}</strong></Link>
                      <p className="muted" style={{ margin: 0, fontSize: '0.75rem', display: 'flex', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{s.role_id}</span>
                        {s.internship_id && (
                          <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>· {s.internship_id}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s.supervisor_id === currentUser.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>Linked</span>
                        <button className="secondary-button danger-button" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleUnlinkStudent(s.user_id, s.full_name)}>Unlink</button>
                      </div>
                    ) : s.supervisor_id ? (
                      <span className="muted" style={{ fontSize: '0.8rem' }}>Unavailable</span>
                    ) : (
                      <button className="primary-button" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleLinkStudent(s.user_id, s.full_name)}>Add to Intern Roster</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SupervisorRosterPanel() {
  const [instructors, setInstructors] = useState([])
  const [positions, setPositions] = useState([])
  const [adding, setAdding] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [resetKey, setResetKey] = useState(0)

  const load = async () => {
    try {
      const { data } = await fetchSupervisorRoster()
      setInstructors(data.instructors || [])
    } catch { /* silent */ }
    try {
      const { data } = await fetchPositions()
      setPositions(data.positions || [])
    } catch { /* silent */ }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selectedInstructor?.role_id) {
      showError('No instructor selected', 'Please search and select an instructor first.')
      return
    }
    setAdding(true)
    try {
      await addInstructorToRoster(selectedInstructor.role_id)
      showSuccess('Added')
      setSelectedInstructor(null)
      setResetKey((k) => k + 1)
      await load()
    } catch (err) {
      showError('Failed', extractError(err))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card" style={{ zIndex: 10 }}>
        <p className="eyebrow">Supervisor</p>
        <h2>Instructor Roster</h2>
        <p className="muted" style={{ maxWidth: 500 }}>Add university instructors to your roster using their Instructor ID. This gives you access to their students for attendance validation and evaluations.</p>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <UserSearchField
            label="Instructor"
            role="instructor"
            callerRole="supervisor"
            name="instructor_id"
            placeholder="Search instructor by name or ID…"
            onChange={setSelectedInstructor}
            resetKey={resetKey}
          />
          <button type="submit" className="primary-button" disabled={adding} style={{ alignSelf: 'flex-start' }}>
            {adding ? 'Adding…' : 'Add Instructor'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {instructors.length === 0 ? <div className="dashboard-card"><p className="muted" style={{ margin: 0 }}>No instructors in your roster.</p></div>
          : instructors.map((i) => <InstructorCard key={i.role_id} instructor={i} onRefresh={load} positions={positions} />)}
      </div>
    </div>
  )
}

export default function SupervisorRosterPage() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <DashboardShell links={SUPERVISOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <SupervisorRosterPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
