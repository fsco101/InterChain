import { useEffect, useState, useMemo } from 'react'
import { useSessionStorage } from '../../hooks/useSessionStorage'
import { Link, useNavigate } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchSupervisorInternHours, linkSupervisorIntern, unlinkStudentFromCompany, fetchPositions, assignStudentPosition } from '../../api/records'
import { showError, showSuccess, extractError, showLoading, closeAlert, confirmAction } from '../../utils/alerts'
import { SUPERVISOR_LINKS } from '../../utils/links'

function SupervisorInternRosterPanel() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useSessionStorage('sup-roster-search', '')
  const [docFilter, setDocFilter] = useSessionStorage('sup-roster-doc', 'All') // 'All', 'Done', 'Processing'
  const [positions, setPositions] = useState([])
  const navigate = useNavigate()

  const loadStudents = () => {
    fetchSupervisorInternHours()
      .then(({ data }) => setStudents(data.students || []))
      .catch(() => { })
      .finally(() => setLoading(false))

    fetchPositions()
      .then(({ data }) => setPositions(data.positions || []))
      .catch(() => { })
  }

  useEffect(() => { loadStudents() }, [])

  const handlePositionChange = async (studentId, position) => {
    try {
      showLoading('Assigning position...')
      await assignStudentPosition(studentId, position)
      closeAlert()
      showSuccess('Position Assigned', `Updated to ${position}`)
      loadStudents()
    } catch (err) {
      closeAlert()
      showError('Failed', extractError(err))
    }
  }

  const handleLinkIntern = async (studentId, force = false) => {
    const ok = await confirmAction({
      title: force ? 'Force Approve?' : 'Approve Intern?',
      text: force ? 'This intern has incomplete documents. Are you sure you want to force approve them to start OJT?' : 'Approve this intern to officially start their OJT.',
      confirmButtonText: force ? 'Force Approve' : 'Approve'
    })
    if (!ok) return

    try {
      showLoading('Linking intern...')
      await linkSupervisorIntern(studentId)
      closeAlert()
      showSuccess('Linked Successfully', 'The intern is now officially linked to you.')
      loadStudents()
    } catch (err) {
      closeAlert()
      showError('Failed to link', extractError(err))
    }
  }

  const handleRemovePending = async (studentId, studentName) => {
    const ok = await confirmAction({
      title: `Remove ${studentName}?`,
      text: 'This will remove the student from your pending intern roster.',
      confirmButtonText: 'Remove'
    })
    if (!ok) return

    try {
      showLoading('Removing...')
      await unlinkStudentFromCompany(studentId)
      closeAlert()
      showSuccess('Removed', 'The student has been removed from your pending list.')
      loadStudents()
    } catch (err) {
      closeAlert()
      showError('Failed to remove', extractError(err))
    }
  }

  const filteredStudents = useMemo(() => {
    let list = students.filter(s => {
      const q = search.toLowerCase()
      const matchesSearch = !q || s.full_name?.toLowerCase().includes(q) || s.role_id?.toLowerCase().includes(q)
      let matchesDocs = true
      if (docFilter === 'Done') matchesDocs = s.docs_complete === true
      if (docFilter === 'Processing') matchesDocs = s.docs_complete === false
      return matchesSearch && matchesDocs
    })

    // Sort: Pending & Docs Complete at top, then Pending, then Linked
    return list.sort((a, b) => {
      const getScore = (s) => {
        if (s.link_status === 'pending' && s.docs_complete) return 3
        if (s.link_status === 'pending') return 2
        return 1
      }
      return getScore(b) - getScore(a)
    })
  }, [students, search, docFilter])

  const pendingReadyCount = students.filter(s => s.link_status === 'pending' && s.docs_complete).length

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            Interns ({filteredStudents.length})
            {pendingReadyCount > 0 && <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 'bold' }}>{pendingReadyCount} pending approval</span>}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search interns..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
            />
            <select 
              value={docFilter} 
              onChange={e => setDocFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
            >
              <option value="All">All Docs</option>
              <option value="Done">Docs Done</option>
              <option value="Processing">Docs Processing</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading interns...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="muted">No interns assigned or managed by your instructors.</p>
        ) : (
          <div className="users-table">
            <div className="users-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr 2fr', gap: 16, fontWeight: 600, background: 'transparent', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>Intern</div>
              <div>Instructor</div>
              <div>Position</div>
              <div style={{ textAlign: 'center' }}>Required</div>
              <div style={{ textAlign: 'center' }}>Consumed</div>
              <div style={{ textAlign: 'center' }}>Remaining</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            {filteredStudents.map((s) => (
              <div key={s.user_id} className="users-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr 2fr', gap: 16, alignItems: 'center', padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Link to={`/profile/${s.user_id}`} style={{ position: 'relative' }}>
                    <AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={36} />
                    {s.link_status === 'pending' && (
                      <span title="Pending Link Approval" style={{ position: 'absolute', top: -4, right: -4, background: '#f59e0b', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--bg-lighter)' }} />
                    )}
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
                    <Link to={`/profile/${s.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 20 }}>
                      <AvatarBadge name={s.instructor_name} avatarUrl={s.instructor_avatar} size={24} />
                      <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.85rem' }}>{s.instructor_name}</span>
                    </Link>
                  ) : (
                    <span className="muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>{s.instructor_name || 'Directly Linked'}</span>
                  )}
                </div>

                <div style={{ textAlign: 'left' }}>
                  <select 
                    value={s.ojt_position || ''} 
                    onChange={(e) => handlePositionChange(s.user_id, e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.6)', color: '#fff', fontSize: '0.85rem', width: '100%', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Assign Position</option>
                    {positions.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: 6 }}>{s.required_hours}h</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 10px', borderRadius: 6 }}>{s.consumed_hours}h</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, background: s.remaining_hours <= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: s.remaining_hours <= 0 ? '#22c55e' : '#f59e0b', padding: '4px 10px', borderRadius: 6 }}>
                    {s.remaining_hours}h
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                  <button
                    className="secondary-button"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'unset', borderColor: s.docs_complete ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)' }}
                    onClick={() => navigate(`/supervisor/interns/${s.user_id}/documents`)}
                    title={s.docs_complete ? 'Docs Complete' : 'Docs Processing'}
                  >
                    Docs {s.docs_complete ? '✓' : '...'}
                  </button>

                  {s.link_status === 'pending' ? (
                    <>
                      {s.docs_complete ? (
                        <button className="primary-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleLinkIntern(s.user_id)}>
                          Approve Intern
                        </button>
                      ) : (
                        <button className="secondary-button" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => handleLinkIntern(s.user_id, true)}>
                          Force Approve
                        </button>
                      )}
                      <button className="secondary-button danger-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleRemovePending(s.user_id, s.full_name)}>
                        Remove
                      </button>
                    </>
                  ) : (
                    s.remaining_hours <= 0 && s.required_hours > 0 ? (
                      <button
                        className="primary-button"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'unset' }}
                        onClick={() => navigate('/supervisor/completion', { state: { student_id: s.role_id } })}
                      >
                        Approve OJT
                      </button>
                    ) : (
                      <button className="primary-button" style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 'unset', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                        Linked
                      </button>
                    )
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
