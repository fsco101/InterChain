import { useEffect, useRef, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { createSupervisorEvaluation, fetchSupervisorEvaluations } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { UserSearchField, InternshipSearchField } from '../../components/SearchFields'
import { SUPERVISOR_LINKS } from '../../utils/links'

function RecordList({ title, records }) {
  return (
    <div className="dashboard-card compact-card">
      <h3>{title}</h3>
      <div className="stack-list">
        {records.length === 0
          ? <p className="muted">No evaluations yet.</p>
          : records.map((r) => (
            <div key={r.id} className="mini-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'block' }}>{r.user_name || r.payload.student_id}</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)' }}>Student ID: {r.payload.student_id}</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(167,139,250,0.15)', padding: '2px 6px', borderRadius: 4, color: '#c4b5fd' }}>Intern ID: {r.payload.internship_id || 'N/A'}</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(56,189,248,0.15)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: '#7dd3fc', letterSpacing: 0.5 }}>Score</span>
                  <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{r.payload.score}<span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'normal' }}>/10</span></strong>
                </div>
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem', lineHeight: 1.5, fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6 }}>
                "{r.payload.feedback}"
              </p>
            </div>
          ))}
      </div>
    </div>
  )
}

function SupervisorEvaluationsPanel() {
  const [evaluations, setEvaluations] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const formRef = useRef(null)

  const load = async () => {
    try {
      const { data } = await fetchSupervisorEvaluations()
      setEvaluations(data.evaluations || [])
    } catch { /* silent */ }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget).entries())
    if (!values.student_id) { showError('Missing', 'Please select a student.'); return }
    if (!values.score || Number(values.score) < 1 || Number(values.score) > 10) { showError('Invalid', 'Score must be 1–10.'); return }
    if (!values.feedback || values.feedback.length < 10) { showError('Invalid', 'Feedback must be at least 10 characters.'); return }

    const ok = await confirmAction({ title: 'Submit evaluation?', text: `Score ${values.score}/10 for student ${values.student_id}.` })
    if (!ok) return

    try {
      await createSupervisorEvaluation({
        internship_id: values.internship_id || 'N/A',
        student_id: values.student_id,
        score: Number(values.score),
        feedback: values.feedback,
      })
      showSuccess('Evaluation submitted', `Score ${values.score}/10 saved.`)
      formRef.current?.reset()
      setSelectedStudent(null)
      await load()
    } catch (err) {
      showError('Failed', extractError(err))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Supervisor</p>
        <h2>Student Evaluations</h2>
        <p className="muted">Evaluate student performance with a score (1–10) and feedback.</p>
      </div>

      <div className="grid-two">
        <form className="dashboard-card form-card" style={{ zIndex: 10 }} onSubmit={handleSubmit} ref={formRef}>
          <h3>New Evaluation</h3>
          <UserSearchField
            label="Student / Intern *"
            role="student"
            callerRole="supervisor"
            name="student_id"
            placeholder="Search student by name, student ID, or intern ID…"
            onChange={setSelectedStudent}
          />
          {selectedStudent && (
            <label style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Intern ID
              <input 
                type="text" 
                name="internship_id" 
                readOnly 
                value={selectedStudent.internship_id || 'N/A'} 
                style={{ 
                  width: '100%', minHeight: 44, borderRadius: 14, 
                  border: '1px solid rgba(148,163,184,0.28)', 
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text)', 
                  padding: '0 14px', marginTop: 8, cursor: 'not-allowed' 
                }} 
              />
            </label>
          )}
          <label>
            Score (1–10) *
            <input name="score" type="number" min="1" max="10" step="1" placeholder="8" />
          </label>
          <label>
            Feedback *
            <textarea name="feedback" rows="5" placeholder="Describe the student's performance (min 10 chars)" />
          </label>
          <button className="primary-button" type="submit">Submit Evaluation</button>
        </form>

        <RecordList title="Recent Evaluations" records={evaluations} />
      </div>
    </div>
  )
}

export default function SupervisorEvaluationsPage() {
  return (
    <ProtectedRoute allowedRoles={['supervisor']}>
      <DashboardShell links={SUPERVISOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <SupervisorEvaluationsPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
