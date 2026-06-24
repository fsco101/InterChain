import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchInstructorRoster, addStudentToRoster, removeStudentFromRoster, fetchInstructorEmployers } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { UserSearchField } from '../../components/SearchFields'
import AvatarBadge from '../../components/AvatarBadge'

const LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
  { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
  { to: '/instructor/history', label: 'History', description: 'All attendance & evaluation records' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
  { to: '/notifications', label: 'Notifications', description: 'View all notifications' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function InstructorRosterPanel() {
  const [students, setStudents] = useState([])
  const [employers, setEmployers] = useState([])
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
      const { data } = await fetchInstructorEmployers()
      setEmployers(data.employers || [])
    } catch {
      setEmployers([])
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
      await removeStudentFromRoster(student.role_id)
      showSuccess('Student removed')
      await load()
    } catch (err) {
      showError('Could not remove student', extractError(err))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Instructor</p>
        <h2>My Students</h2>
        <p className="muted">Add students by their Student ID. Employers can see this roster and the school they belong to.</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <strong>{s.full_name}</strong>
                  <span className="muted" style={{ fontSize: '0.82rem' }}>{s.email}</span>
                  {s.institution && <span className="muted" style={{ fontSize: '0.75rem' }}>🏫 {s.institution}</span>}
                </div>
                <span className="role-chip">{s.role_id}</span>
                <button className="secondary-button" onClick={() => handleRemove(s)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Connected Employers ({employers.length})</p>
        <p className="muted" style={{ marginBottom: 12, fontSize: '0.85rem' }}>Employers who have added you to their roster.</p>
        {employers.length === 0 ? (
          <p className="muted">No employers linked yet.</p>
        ) : (
          <div className="users-table">
            {employers.map((emp) => (
              <div key={emp.id} className="users-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <strong>{emp.full_name}</strong>
                  <span className="muted" style={{ fontSize: '0.82rem' }}>{emp.email}</span>
                  {emp.institution && <span className="muted" style={{ fontSize: '0.75rem' }}>🏢 {emp.institution}</span>}
                </div>
                <span className="role-chip">{emp.role_id}</span>
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
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <InstructorRosterPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
