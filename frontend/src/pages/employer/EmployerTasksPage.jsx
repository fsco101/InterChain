import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarBadge from '../../components/AvatarBadge'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { createTask, fetchTasks, fetchPositions, createPosition, deletePosition, deleteTask, updateTaskStatus, fetchEmployerStudents } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { EMPLOYER_LINKS } from '../../utils/links'

const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#38bdf8', completed: '#22c55e', cancelled: '#94a3b8' }

function PositionManager({ positions, onRefresh }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
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
  const [mode, setMode] = useState('position') // position | individual
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [position, setPosition] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [dueDate, setDueDate] = useState('')
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
          {tasks.map((t) => (
            <div key={t.id} className="users-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong>{t.title}</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{t.description.slice(0, 120)}{t.description.length > 120 ? '…' : ''}</p>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>
                  Position: {t.position} · {t.student_ids?.length || 0} student(s) · {t.due_date ? `Due: ${t.due_date}` : 'No due date'}
                </p>
                {t.assigned_students && t.assigned_students.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {t.assigned_students.map((student) => (
                      <Link key={student.user_id} to={`/profile/${student.user_id}`} title={student.full_name} style={{ display: 'block' }}>
                        <AvatarBadge name={student.full_name} avatarUrl={student.avatar_url} size={28} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <span className="role-chip" style={{ background: (STATUS_COLORS[t.status] || '#94a3b8') + '22', color: STATUS_COLORS[t.status] || '#94a3b8' }}>{t.status}</span>
              <select value={t.status} onChange={(e) => handleStatus(t.id, e.target.value)} style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: 8, minHeight: 'unset' }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="secondary-button danger-button" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handleDelete(t.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmployerTasksPanel() {
  const [positions, setPositions] = useState([])
  const [tasks, setTasks] = useState([])
  const [students, setStudents] = useState([])

  const loadPositions = async () => { try { const { data } = await fetchPositions(); setPositions(data.positions || []) } catch { /* silent */ } }
  const loadTasks = async () => { try { const { data } = await fetchTasks(); setTasks(data.tasks || []) } catch { /* silent */ } }
  const loadStudents = async () => { try { const { data } = await fetchEmployerStudents(); setStudents(data.students || []) } catch { /* silent */ } }

  useEffect(() => { loadPositions(); loadTasks(); loadStudents() }, [])

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Employer</p>
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

export default function EmployerTasksPage() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={EMPLOYER_LINKS}>
        <div className="page-shell dashboard-shell">
          <EmployerTasksPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
