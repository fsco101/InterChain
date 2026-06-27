import { useEffect, useRef, useState } from 'react'
import { useSessionStorage } from '../../hooks/useSessionStorage'
import { Link } from 'react-router-dom'
import AvatarBadge from '../../components/AvatarBadge'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { createTask, fetchTasks, fetchPositions, createPosition, deletePosition, deleteTask, updateTaskStatus, fetchSupervisorStudents } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { SUPERVISOR_LINKS } from '../../utils/links'

const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#38bdf8', completed: '#22c55e', cancelled: '#94a3b8' }

function PositionManager({ positions, onRefresh }) {
  const [name, setName] = useSessionStorage('sup-pos-name', '')
  const [desc, setDesc] = useSessionStorage('sup-pos-desc', '')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) { showError('Required', 'Position name is required.'); return }
    setAdding(true)
    try {
      await createPosition({ name: name.trim(), description: desc.trim() || null })
      showSuccess('Position created', `"${name}" has been added.`)
      setName(''); setDesc('')
      onRefresh?.()
    } catch (err) { showError('Failed', extractError(err)) }
    finally { setAdding(false) }
  }

  const handleDelete = async (id, pName) => {
    const ok = await confirmAction({ title: `Delete position "${pName}"?`, confirmButtonText: 'Delete' })
    if (!ok) return
    try { await deletePosition(id); showSuccess('Deleted'); onRefresh?.() }
    catch (err) { showError('Failed', extractError(err)) }
  }

  return (
    <div className="dashboard-card">
      <h3>Manage Positions</h3>
      <p className="muted" style={{ marginBottom: 12, fontSize: '0.85rem' }}>Define OJT positions that students can be assigned to.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Position name (e.g. Web Developer)" style={{ flex: 1 }} />
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" style={{ flex: 1 }} />
        <button className="primary-button" onClick={handleAdd} disabled={adding} style={{ whiteSpace: 'nowrap' }}>{adding ? '…' : '+ Add'}</button>
      </div>
      {positions.length === 0 ? <p className="muted">No positions defined yet.</p> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {positions.map((p) => (
            <span key={p.id} className="role-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
              {p.name}
              <button onClick={() => handleDelete(p.id, p.name)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function TaskForm({ positions, students, onSuccess }) {
  const [mode, setMode] = useSessionStorage('sup-task-mode', 'position') // position | individual
  const [title, setTitle] = useSessionStorage('sup-task-title', '')
  const [desc, setDesc] = useSessionStorage('sup-task-desc', '')
  const [position, setPosition] = useSessionStorage('sup-task-pos', '')
  const [selectedStudents, setSelectedStudents] = useSessionStorage('sup-task-students', [])
  const [dueDate, setDueDate] = useSessionStorage('sup-task-due', '')
  const [creating, setCreating] = useState(false)

  const positionStudents = students.filter((s) => s.ojt_position && s.ojt_position.toLowerCase() === position.toLowerCase())

  const toggleStudent = (id) => setSelectedStudents((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const handleSubmit = async () => {
    if (!title.trim()) { showError('Required', 'Task title is required.'); return }
    if (!desc.trim()) { showError('Required', 'Task description is required.'); return }
    if (!position) { showError('Required', 'Please select a position.'); return }

    const payload = { title: title.trim(), description: desc.trim(), position, due_date: dueDate || null }
    if (mode === 'individual') {
      if (selectedStudents.length === 0) { showError('Required', 'Select at least one student.'); return }
      payload.student_ids = selectedStudents
    }

    setCreating(true)
    try {
      await createTask(payload)
      showSuccess('Task created', mode === 'position' ? `Assigned to all ${position} interns.` : `Assigned to ${selectedStudents.length} student(s).`)
      setTitle(''); setDesc(''); setPosition(''); setSelectedStudents([]); setDueDate('')
      onSuccess?.()
    } catch (err) { showError('Failed', extractError(err)) }
    finally { setCreating(false) }
  }

  return (
    <div className="dashboard-card form-card">
      <h3>Create Task</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={mode === 'position' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => { setMode('position'); setSelectedStudents([]) }}>By Position</button>
        <button className={mode === 'individual' ? 'primary-button' : 'secondary-button'} style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setMode('individual')}>Individual</button>
      </div>

      <label>Position *
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="">Select position…</option>
          {positions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </label>

      {mode === 'position' && position && (
        <p className="muted" style={{ fontSize: '0.82rem' }}>
          This task will be assigned to <strong>{positionStudents.length}</strong> student(s) with position "{position}".
        </p>
      )}

      {mode === 'individual' && position && (
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10, padding: 8 }}>
          {positionStudents.length === 0 ? <p className="muted" style={{ fontSize: '0.82rem' }}>No students with this position.</p> : (
            positionStudents.map((s) => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 8 }}>
                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                <Link to={`/profile/${s.id}`} style={{ flexShrink: 0, display: 'block' }}>
                  <AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={28} />
                </Link>
                <div style={{ minWidth: 0 }}>
                  <span>{s.full_name}</span>
                  <span className="muted" style={{ fontSize: '0.75rem', display: 'block' }}>{s.role_id}</span>
                </div>
              </label>
            ))
          )}
          {/* Also allow selecting students without matching position */}
          {students.filter((s) => !positionStudents.includes(s)).length > 0 && (
            <>
              <p className="muted" style={{ margin: '8px 0 4px', fontSize: '0.75rem' }}>Other students:</p>
              {students.filter((s) => !positionStudents.includes(s)).map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 8, opacity: 0.7 }}>
                  <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                  <Link to={`/profile/${s.id}`} style={{ flexShrink: 0, display: 'block' }}>
                    <AvatarBadge name={s.full_name} avatarUrl={s.avatar_url} size={28} />
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <span>{s.full_name}</span>
                    <span className="muted" style={{ fontSize: '0.75rem', display: 'block' }}>{s.role_id} · {s.ojt_position || 'No position'}</span>
                  </div>
                </label>
              ))}
            </>
          )}
        </div>
      )}

      <label>Task Title *<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Complete UI mockups" /></label>
      <label>Description *<textarea rows="4" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Detailed description of the task…" /></label>
      <label>Due Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>

      <button className="primary-button" onClick={handleSubmit} disabled={creating}>{creating ? 'Creating…' : 'Create Task'}</button>
    </div>
  )
}

function TaskList({ tasks, onRefresh }) {
  const [now, setNow] = useState(Date.now())

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

  const handleStatus = async (taskId, newStatus) => {
    try { await updateTaskStatus(taskId, newStatus); showSuccess('Task updated'); onRefresh?.() }
    catch (err) { showError('Failed', extractError(err)) }
  }

  const handleDelete = async (taskId) => {
    const ok = await confirmAction({ title: 'Delete this task?', confirmButtonText: 'Delete' })
    if (!ok) return
    try { await deleteTask(taskId); showSuccess('Deleted'); onRefresh?.() }
    catch (err) { showError('Failed', extractError(err)) }
  }

  return (
    <div className="dashboard-card">
      <p className="eyebrow" style={{ marginBottom: 12 }}>Tasks ({tasks.length})</p>
      {tasks.length === 0 ? <p className="muted">No tasks created yet.</p> : (
        <div className="users-table">
          {tasks.map((t) => {
            let isLocked = false
            let remainingSeconds = 0
            if (t.status === 'completed' && t.completed_at) {
              const completedTime = new Date(t.completed_at).getTime()
              const diff = now - completedTime
              if (diff > 20000) isLocked = true
              else remainingSeconds = Math.ceil((20000 - diff) / 1000)
            }

            let currentSeconds = t.accumulated_seconds || 0
            if (t.status === 'pending' && t.last_active_start) {
              const start = new Date(t.last_active_start).getTime()
              if (!isNaN(start)) currentSeconds += Math.floor((now - start) / 1000)
            }

            return (
              <div key={t.id} className="users-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, padding: '16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 600 }}>{t.title}</h4>
                    <p className="muted" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{t.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span className="role-chip" style={{ background: (STATUS_COLORS[t.status] || '#94a3b8') + '22', color: STATUS_COLORS[t.status] || '#94a3b8', fontSize: '0.8rem', padding: '4px 10px' }}>
                      {t.status}
                    </span>
                    {remainingSeconds > 0 && !isLocked && (
                      <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>Locks in {remainingSeconds}s...</span>
                    )}
                    {isLocked && <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>Locked</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p className="muted" style={{ margin: '0 0 8px', fontSize: '0.8rem' }}>
                      <strong>Position:</strong> {t.position} {t.due_date ? <span style={{ marginLeft: 8 }}><strong>Due:</strong> {t.due_date}</span> : ''}
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
                      ⏳ Tracked Time: {formatTime(currentSeconds)}
                    </p>
                    {t.assigned_students && t.assigned_students.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {t.assigned_students.map((student) => (
                          <Link key={student.user_id} to={`/profile/${student.user_id}`} title={student.full_name} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>
                            <AvatarBadge name={student.full_name} avatarUrl={student.avatar_url} size={20} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{student.full_name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {t.attachment_url && (
                      <a href={t.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#38bdf8', marginRight: '8px' }}>
                        View Attachment
                      </a>
                    )}
                    <select 
                      value={t.status} 
                      onChange={(e) => handleStatus(t.id, e.target.value)} 
                      disabled={isLocked}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, minHeight: 'unset', opacity: isLocked ? 0.6 : 1, background: '#ffffff', color: '#0f172a' }}
                    >
                      <option value="pending">Pending (Redo)</option>
                      <option value="done">Done (Waiting)</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="secondary-button danger-button" style={{ fontSize: '0.75rem', padding: '6px 12px', minHeight: 'unset' }} onClick={() => handleDelete(t.id)}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SupervisorTasksPanel() {
  const [positions, setPositions] = useState([])
  const [tasks, setTasks] = useState([])
  const [students, setStudents] = useState([])

  const loadPositions = async () => { try { const { data } = await fetchPositions(); setPositions(data.positions || []) } catch { /* silent */ } }
  const loadTasks = async () => { try { const { data } = await fetchTasks(); setTasks(data.tasks || []) } catch { /* silent */ } }
  const loadStudents = async () => { try { const { data } = await fetchSupervisorStudents(); setStudents(data.students || []) } catch { /* silent */ } }

  useEffect(() => { loadPositions(); loadTasks(); loadStudents() }, [])

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Supervisor</p>
        <h2>Task Assignment</h2>
        <p className="muted">Create positions, then assign tasks to students by position or individually.</p>
      </div>
      <PositionManager positions={positions} onRefresh={loadPositions} />
      <div className="grid-two" style={{ alignItems: 'start' }}>
        <TaskForm positions={positions} students={students} onSuccess={loadTasks} />
        <TaskList tasks={tasks} onRefresh={loadTasks} />
      </div>
    </div>
  )
}

export default function SupervisorTasksPage() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <DashboardShell links={SUPERVISOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <SupervisorTasksPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
