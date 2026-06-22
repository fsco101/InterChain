import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { fetchEmployerRoster, addInstructorToRoster, removeInstructorFromRoster } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { UserSearchField } from '../../components/SearchFields'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
  { to: '/employer/roster', label: 'Roster', description: 'Instructors & their students' },
  { to: '/employer/certificates', label: 'Certificates', description: 'Issue e-certificates' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

function StudentList({ students }) {
  if (!students || students.length === 0)
    return <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.82rem' }}>No students linked yet.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
      {students.map((s) => (
        <div key={s.role_id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>{s.role_id}</span>
          <span style={{ flex: 1, fontSize: '0.85rem' }}>{s.full_name}</span>
          {s.institution && <span className="muted" style={{ fontSize: '0.75rem' }}>🏫 {s.institution}</span>}
        </div>
      ))}
    </div>
  )
}

function EmployerRosterPanel() {
  const [instructors, setInstructors] = useState([])
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [resetKey, setResetKey] = useState(0)

  const load = async () => {
    try {
      const { data } = await fetchEmployerRoster()
      setInstructors(data.instructors || [])
    } catch (err) {
      const status = err?.response?.status
      if (status !== 404) showError('Failed to load roster', extractError(err))
      setInstructors([])
    }
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
      const { data } = await addInstructorToRoster(selectedInstructor.role_id)
      showSuccess('Instructor added', `${data.instructor.full_name} is now in your roster.`)
      setSelectedInstructor(null)
      setResetKey((k) => k + 1)
      await load()
    } catch (err) {
      showError('Could not add instructor', extractError(err))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (ins) => {
    const ok = await confirmAction({
      title: 'Remove instructor?',
      text: `Remove ${ins.full_name} from your roster?`,
      confirmButtonText: 'Remove',
    })
    if (!ok) return
    try {
      await removeInstructorFromRoster(ins.role_id)
      showSuccess('Instructor removed')
      await load()
    } catch (err) {
      showError('Could not remove instructor', extractError(err))
    }
  }

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const totalStudents = instructors.reduce((s, i) => s + (i.students?.length || 0), 0)

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Employer</p>
        <h2>Instructor Roster</h2>
        <p className="muted">Add instructors by their Instructor ID to view the students they handle and their school.</p>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <UserSearchField
            label="Instructor"
            role="instructor"
            callerRole="employer"
            name="instructor_id"
            placeholder="Search instructor by name or ID…"
            onChange={setSelectedInstructor}
            resetKey={resetKey}
          />
          <button className="primary-button" type="submit" disabled={adding} style={{ alignSelf: 'flex-start' }}>
            {adding ? 'Adding…' : 'Add Instructor'}
          </button>
        </form>
      </div>

      {instructors.length === 0 ? (
        <div className="dashboard-card">
          <p className="muted">No instructors yet. Add one using their Instructor ID above.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
              <p className="stat-label">Instructors</p>
              <p className="stat-value">{instructors.length}</p>
            </div>
            <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
              <p className="stat-label">Total Students</p>
              <p className="stat-value">{totalStudents}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <p className="eyebrow" style={{ marginBottom: 12 }}>Instructors ({instructors.length})</p>
            <div className="users-table">
              {instructors.map((ins) => (
                <div key={ins.role_id} style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.62)', padding: 16, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{ins.full_name}</strong>
                      <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{ins.email}</p>
                      {ins.institution && <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>🏫 {ins.institution}</p>}
                    </div>
                    <span className="role-chip">{ins.role_id}</span>
                    <button className="secondary-button" onClick={() => toggle(ins.role_id)}>
                      {expanded[ins.role_id] ? 'Hide' : `Students (${ins.students?.length || 0})`}
                    </button>
                    <button className="secondary-button danger-button" onClick={() => handleRemove(ins)}>Remove</button>
                  </div>
                  {expanded[ins.role_id] && <StudentList students={ins.students} />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function EmployerRosterPage() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <EmployerRosterPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
