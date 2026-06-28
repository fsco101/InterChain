import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import ProtectedRoute from '../../components/ProtectedRoute'
import { fetchStudentTasks, studentMarkTaskDone } from '../../api/records'
import { showError, showSuccess, extractError, showLoading, closeAlert } from '../../utils/alerts'
import { STUDENT_LINKS } from '../../utils/links'
import { useAuth } from '../../context/AuthContext'

function StudentTasksPanel() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const fileInputRefs = useRef({})

  const loadTasks = async () => {
    try {
      const { data } = await fetchStudentTasks()
      setTasks(data.tasks || [])
    } catch (err) {
      showError('Failed to load tasks', extractError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTasks() }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '0h 0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const handleMarkDone = async (task) => {
    const fileInput = fileInputRefs.current[task.id]
    const file = fileInput?.files?.[0]

    if (!file) {
      showError('Photo required', 'Please attach a photo as proof of completion.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      showLoading('Uploading photo and marking done...')
      await studentMarkTaskDone(task.id, formData)
      closeAlert()
      showSuccess('Task completed', 'Your task has been sent to your supervisor for review.')
      if (fileInput) fileInput.value = ''
      await loadTasks()
    } catch (err) {
      closeAlert()
      showError('Failed to mark done', extractError(err))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Student</p>
        <h2>Given Tasks</h2>
        <p className="muted" style={{ maxWidth: 600 }}>
          View and complete tasks assigned to you by your supervisor.
          When completing a task, you must attach a photo as proof.
        </p>
      </div>

      <div className="dashboard-card">
        {!user?.supervisor_id && (
          <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: 16, marginBottom: 20 }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 8px' }}>Not Approved Yet</h3>
            <p className="muted" style={{ margin: 0 }}>You cannot perform OJT tasks until your supervisor has approved your link.</p>
          </div>
        )}
        
        {loading ? (
          <p className="muted">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="muted">You have no assigned tasks.</p>
        ) : (
          <div className="users-table">
            {tasks.map((task) => {
              let currentSeconds = task.accumulated_seconds || 0
              if (task.status === 'pending' && task.last_active_start) {
                const start = new Date(task.last_active_start).getTime()
                if (!isNaN(start)) currentSeconds += Math.floor((now - start) / 1000)
              }

              return (
                <div key={task.id} className="users-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, padding: '16px', background: 'var(--input-bg)', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 600 }}>{task.title}</h4>
                      <p className="muted" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{task.description}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span className="role-chip" style={{ background: task.status === 'done' ? 'rgba(34, 197, 94, 0.15)' : undefined }}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p className="muted" style={{ margin: '0 0 8px', fontSize: '0.8rem' }}>
                        <strong>Position:</strong> {task.position} {task.due_date ? <span style={{ marginLeft: 8 }}><strong>Due:</strong> {task.due_date}</span> : ''}
                      </p>
                      <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
                        ⏳ Tracked Time: {formatTime(currentSeconds)}
                      </p>
                      {task.employer_id ? (
                        <div style={{ marginTop: 8 }}>
                          <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supervisor</p>
                          <Link to={`/profile/${task.employer_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                            <AvatarBadge name={task.employer_name} avatarUrl={task.employer_avatar_url} size={32} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>{task.employer_name}</span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>View Profile</span>
                            </div>
                          </Link>
                        </div>
                      ) : task.employer_name && (
                        <div style={{ marginTop: 8 }}>
                          <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supervisor</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>{task.employer_name}</p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      {task.attachment_url && (
                        <a href={task.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>View Attachment</a>
                      )}

                      {task.status === 'pending' && user?.supervisor_id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={(el) => (fileInputRefs.current[task.id] = el)}
                            style={{ fontSize: '0.75rem' }}
                          />
                          <button className="primary-button" style={{ fontSize: '0.8rem', padding: '6px 16px', minHeight: 'unset' }} onClick={() => handleMarkDone(task)}>
                            Mark as Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentTasksPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardShell links={STUDENT_LINKS}>
        <div className="page-shell dashboard-shell">
          <StudentTasksPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
