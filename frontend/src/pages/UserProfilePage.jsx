import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import AvatarBadge from '../components/AvatarBadge'
import ProtectedRoute from '../components/ProtectedRoute'
import { fetchUserProfile } from '../api/records'
import { ROLE_LINKS } from '../utils/links'
import { useAuth } from '../context/AuthContext'

function UserProfileContent() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUserProfile(userId)
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.status === 404 ? 'User not found' : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [userId])

  const links = ROLE_LINKS[currentUser?.role] || []

  return (
    <DashboardShell links={links}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Profile</p><h2>Public View</h2></div>
        </div>
        <div className="dashboard-stack">
          {loading ? <p className="muted">Loading profile…</p> : error ? <p className="muted">{error}</p> : (
            <>
              <div className="dashboard-card" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <AvatarBadge name={profile.full_name} avatarUrl={profile.avatar_url} size={120} />
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '2rem', fontWeight: 800 }}>{profile.full_name}</h1>
                  <p className="muted" style={{ margin: 0, fontSize: '1rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span className="role-chip">{profile.role_id || profile.role}</span>
                    {profile.internship_id && <span>Internship ID: {profile.internship_id}</span>}
                    {profile.institution && <span>{profile.institution}</span>}
                    {profile.ojt_position && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{profile.ojt_position}</span>}
                  </p>
                </div>
              </div>

              {profile.role === 'student' && (
                <div className="grid-two">
                  {/* Attendance Summary */}
                  <div className="dashboard-card">
                    <p className="eyebrow">Attendance Summary</p>
                    {profile.attendance_summary ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, marginTop: 16 }}>
                        <div>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Total Days</p>
                          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.attendance_summary.total_days}</p>
                        </div>
                        <div>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Total Hours</p>
                          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.attendance_summary.total_hours}h</p>
                        </div>
                        <div>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Validated</p>
                          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{profile.attendance_summary.validated_hours}h</p>
                        </div>
                      </div>
                    ) : <p className="muted">No attendance data.</p>}
                  </div>

                  {/* Ranking Summary */}
                  <div className="dashboard-card">
                    <p className="eyebrow">Performance</p>
                    {profile.evaluation_summary ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, marginTop: 16 }}>
                        <div>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Avg Score</p>
                          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0ea5e9' }}>{profile.evaluation_summary.avg_score}/10</p>
                        </div>
                        <div>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Evaluations</p>
                          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.evaluation_summary.eval_count}</p>
                        </div>
                      </div>
                    ) : <p className="muted">No evaluations yet.</p>}
                  </div>
                </div>
              )}

              {profile.role === 'student' && profile.supervisors && (
                <div className="grid-two" style={{ marginBottom: 18 }}>
                  <div className="dashboard-card">
                    <p className="eyebrow" style={{ marginBottom: 12 }}>Instructor</p>
                    {profile.supervisors.instructor ? (
                      <Link to={`/profile/${profile.supervisors.instructor.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <AvatarBadge name={profile.supervisors.instructor.full_name} avatarUrl={profile.supervisors.instructor.avatar_url} size={40} />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{profile.supervisors.instructor.full_name}</p>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace' }}>{profile.supervisors.instructor.role_id}</p>
                        </div>
                      </Link>
                    ) : <p className="muted">No instructor assigned.</p>}
                  </div>

                  <div className="dashboard-card">
                    <p className="eyebrow" style={{ marginBottom: 12 }}>Employer</p>
                    {profile.supervisors.employer ? (
                      <Link to={`/profile/${profile.supervisors.employer.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <AvatarBadge name={profile.supervisors.employer.full_name} avatarUrl={profile.supervisors.employer.avatar_url} size={40} />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{profile.supervisors.employer.full_name}</p>
                          <p className="muted" style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace' }}>{profile.supervisors.employer.role_id}</p>
                        </div>
                      </Link>
                    ) : <p className="muted">No employer assigned.</p>}
                  </div>
                </div>
              )}

              {profile.role === 'student' && profile.tasks && profile.tasks.length > 0 && (
                <div className="dashboard-card">
                  <p className="eyebrow" style={{ marginBottom: 12 }}>Assigned Tasks</p>
                  <div className="users-table">
                    {profile.tasks.map((t) => (
                      <div key={t.id} className="users-row">
                        <strong>{t.title}</strong>
                        <span className="muted" style={{ fontSize: '0.8rem' }}>{t.position}</span>
                        <span className="role-chip">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.role === 'instructor' && profile.instructor_summary && (
                <div className="dashboard-card">
                  <p className="eyebrow">Instructor Overview</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 16, marginBottom: 16 }}>
                    <div>
                      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Students Handled</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{profile.instructor_summary.student_count}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Employer Partners</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.instructor_summary.employer_count}</p>
                    </div>
                  </div>
                  {profile.instructor_summary.students && profile.instructor_summary.students.length > 0 && (
                    <>
                      <p className="muted" style={{ margin: '16px 0 8px', fontSize: '0.85rem' }}>Students in Roster</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {profile.instructor_summary.students.map((student) => (
                          <Link key={student.role_id} to={student.user_id ? `/profile/${student.user_id}` : '#'} title={student.full_name} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20 }}>
                            <AvatarBadge name={student.full_name} avatarUrl={student.avatar_url} size={24} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{student.full_name || student.role_id}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {profile.role === 'employer' && profile.employer_summary && (
                <div className="dashboard-card">
                  <p className="eyebrow">Employer Overview</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 16 }}>
                    <div>
                      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>OJT Positions</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa' }}>{profile.employer_summary.position_count}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Tasks Created</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.employer_summary.task_count}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Instructors Linked</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{profile.employer_summary.instructor_count}</p>
                    </div>
                  </div>

                  {profile.employer_summary.instructors && profile.employer_summary.instructors.length > 0 && (
                    <>
                      <p className="muted" style={{ margin: '16px 0 8px', fontSize: '0.85rem' }}>Instructors in Roster</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {profile.employer_summary.instructors.map((ins) => (
                          <Link key={ins.role_id} to={ins.user_id ? `/profile/${ins.user_id}` : '#'} title={ins.full_name} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20 }}>
                            <AvatarBadge name={ins.full_name} avatarUrl={ins.avatar_url} size={24} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{ins.full_name || ins.role_id}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfileContent />
    </ProtectedRoute>
  )
}
