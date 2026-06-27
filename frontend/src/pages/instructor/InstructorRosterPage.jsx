import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchInstructorRoster, addStudentToRoster, removeStudentFromRoster, fetchInstructorSupervisors, unlinkSupervisor } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError, showLoading, closeAlert } from '../../utils/alerts'
import { UserSearchField } from '../../components/SearchFields'
import AvatarBadge from '../../components/AvatarBadge'
import { INSTRUCTOR_LINKS } from '../../utils/links'

function InstructorRosterPanel() {
  const [students, setStudents] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [adding, setAdding] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const load = async () => {
    try {
      const { data } = await fetchInstructorRoster()
      setStudents(data.students || [])
    } catch (err) {
      const status = err?.response?.status
      if (status !== 404) showError('Failed to load roster', extractError(err))
      setStudents([])
    }
    try {
      const { data } = await fetchInstructorSupervisors()
      setSupervisors(data.supervisors || [])
    } catch {
      setSupervisors([])
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selectedStudent?.role_id) {
      showError('No student selected', 'Please search and select a student first.')
      return
    }
    setAdding(true)
    try {
      const { data } = await addStudentToRoster(selectedStudent.role_id)
      showSuccess('Student added', `${data.student.full_name} is now in your roster.`)
      setSelectedStudent(null)
      setResetKey((k) => k + 1)
      await load()
    } catch (err) {
      showError('Could not add student', extractError(err))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (student) => {
    const ok = await confirmAction({
      title: 'Remove student?',
      text: `Remove ${student.full_name} from your roster?`,
      confirmButtonText: 'Remove',
    })
    if (!ok) return
    try {
      showLoading('Removing student...')
      await removeStudentFromRoster(student.role_id)
      closeAlert()
      showSuccess('Student removed')
      await load()
    } catch (err) {
      closeAlert()
      showError('Could not remove student', extractError(err))
    }
  }

  const handleUnlinkSupervisor = async (supervisor) => {
    const ok = await confirmAction({
      title: 'Unlink supervisor?',
      text: `Are you sure you want to unlink from ${supervisor.full_name}? You will no longer be on their roster.`,
      confirmButtonText: 'Unlink'
    })
    if (!ok) return

    try {
      showLoading('Unlinking supervisor...')
      await unlinkSupervisor(supervisor.id)
      closeAlert()
      showSuccess('Supervisor unlinked')
      await load()
    } catch (err) {
      closeAlert()
      showError('Could not unlink supervisor', extractError(err))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Instructor</p>
        <h2>My Students</h2>
        <p className="muted">Add students by their Student ID. Supervisors can see this roster and the school they belong to.</p>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <UserSearchField
            label="Student"
            role="student"
            callerRole="instructor"
            name="student_id"
            placeholder="Search student by name or ID…"
            onChange={setSelectedStudent}
            resetKey={resetKey}
          />
          <button className="primary-button" type="submit" disabled={adding} style={{ alignSelf: 'flex-start' }}>
            {adding ? 'Adding…' : 'Add Student'}
          </button>
        </form>
      </div>

      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Roster ({students.length})</p>
        {students.length === 0 ? (
          <p className="muted">No students yet. Add a student using their Student ID above.</p>
        ) : (
          <div className="users-table">
            {students.map((s) => (
              <div key={s.role_id} className="users-row">
                <Link to={`/profile/${s.user_id || s.id}`} style={{ flexShrink: 0, display: 'block' }}>
                  <AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={42} />
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <Link to={`/profile/${s.user_id || s.id}`} style={{ textDecoration: 'none' }}>
                    <strong>{s.full_name}</strong>
                  </Link>
                  <span className="muted" style={{ fontSize: '0.82rem' }}>{s.email}</span>
                  {s.institution && <span className="muted" style={{ fontSize: '0.75rem' }}>🏫 {s.institution}</span>}
                  {s.internship_id && <span className="muted" style={{ fontSize: '0.75rem' }}>💼 Internship ID: {s.internship_id}</span>}
                </div>
                <span className="role-chip">{s.role_id}</span>
                <button className="secondary-button" onClick={() => handleRemove(s)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card" style={{ padding: '16px 20px', minWidth: 260, alignSelf: 'start', position: 'sticky', top: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>Connected Supervisors ({supervisors.length})</p>
        <p className="muted" style={{ marginBottom: 12, fontSize: '0.85rem' }}>Supervisors who have added you to their roster.</p>
        {supervisors.length === 0 ? (
          <p className="muted">No supervisors linked yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {supervisors.map((sup) => (
              <div key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(148,163,184,0.04)', padding: '8px 12px', borderRadius: 10 }}>
                <Link to={`/profile/${sup.id}`}><AvatarBadge name={sup.full_name} avatarUrl={sup.avatar_url} size={28} /></Link>
                <div style={{ flex: 1 }}>
                  <Link to={`/profile/${sup.id}`} style={{ textDecoration: 'none' }}><strong>{sup.full_name}</strong></Link>
                  <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>{sup.company || 'Unknown Company'}</p>
                </div>
                <button className="secondary-button" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleUnlinkSupervisor(sup)}>Unlink</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function InstructorRosterPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <DashboardShell links={INSTRUCTOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <InstructorRosterPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
