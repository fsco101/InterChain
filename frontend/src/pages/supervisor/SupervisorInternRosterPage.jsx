import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchSupervisorInternHours } from '../../api/records'
import { SUPERVISOR_LINKS } from '../../utils/links'

function SupervisorInternRosterPanel() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSupervisorInternHours()
      .then(({ data }) => setStudents(data.students || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Supervisor</p>
        <h2>Intern Roster</h2>
        <p className="muted" style={{ maxWidth: 600 }}>
          Manage and track the progress of all interns linked to you or under the instructors in your roster.
          Monitor their required and consumed hours. When an intern finishes their required hours, you can issue an approval for certification.
        </p>
      </div>

      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Interns ({students.length})</p>
        {loading ? (
          <p className="muted">Loading interns...</p>
        ) : students.length === 0 ? (
          <p className="muted">No interns assigned or managed by your instructors.</p>
        ) : (
          <div className="users-table">
            <div className="users-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr', gap: 16, fontWeight: 600, background: 'transparent', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>Intern</div>
              <div>Instructor</div>
              <div style={{ textAlign: 'right' }}>Required</div>
              <div style={{ textAlign: 'right' }}>Consumed</div>
              <div style={{ textAlign: 'right' }}>Remaining</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            {students.map((s) => (
              <div key={s.user_id} className="users-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Link to={`/profile/${s.user_id}`}>
                    <AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={36} />
                  </Link>
                  <div style={{ overflow: 'hidden' }}>
                    <Link to={`/profile/${s.user_id}`} style={{ textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      <strong>{s.full_name}</strong>
                    </Link>
                    <p className="muted" style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>{s.role_id}</p>
                  </div>
                </div>

                <div style={{ color: 'var(--text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {s.instructor_id ? (
                    <Link to={`/profile/${s.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                      <AvatarBadge name={s.instructor_name} avatarUrl={s.instructor_avatar} size={28} />
                      <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.instructor_name}</span>
                    </Link>
                  ) : (
                    <span className="muted" style={{ fontSize: '0.8rem' }}>{s.instructor_name}</span>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: 6 }}>{s.required_hours}h</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 10px', borderRadius: 6 }}>{s.consumed_hours}h</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, background: s.remaining_hours <= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: s.remaining_hours <= 0 ? '#22c55e' : '#f59e0b', padding: '4px 10px', borderRadius: 6 }}>
                    {s.remaining_hours}h
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {s.remaining_hours <= 0 && s.required_hours > 0 ? (
                    <button
                      className="primary-button"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'unset' }}
                      onClick={() => navigate('/supervisor/completion', { state: { student_id: s.role_id } })}
                    >
                      Approve Certification
                    </button>
                  ) : (
                    <span className="muted" style={{ fontSize: '0.8rem' }}>In Progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SupervisorInternRosterPage() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <DashboardShell links={SUPERVISOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <SupervisorInternRosterPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
