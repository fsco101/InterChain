import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchInstructorRoster, addStudentToRoster, removeStudentFromRoster } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'

const LINKS = [
  { to: '/instructor/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/instructor/attendance', label: 'Attendance', description: 'Validate student attendance' },
  { to: '/instructor/evaluations', label: 'Evaluations', description: 'Submit evaluations' },
  { to: '/instructor/roster', label: 'My Students', description: 'Manage student roster' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function InstructorRosterPanel() {
  const [students, setStudents] = useState([])
  const [roleId, setRoleId] = useState('')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    try {
      const { data } = await fetchInstructorRoster()
      setStudents(data.students || [])
    } catch {
      showError('Failed to load roster')
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const id = roleId.trim().toUpperCase()
    if (!id.startsWith('STU-') || id.length < 9) {
      showError('Invalid Student ID', 'Format must be STU-XXXXX')
      return
    }
    setAdding(true)
    try {
      const { data } = await addStudentToRoster(id)
      showSuccess('Student added', `${data.student.full_name} is now in your roster.`)
      setRoleId('')
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
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            placeholder="Student ID  e.g. STU-12345"
            style={{ flex: 1, minWidth: 200, minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.7)', color: 'var(--text)', padding: '0 14px' }}
          />
          <button className="primary-button" type="submit" disabled={adding}>
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
