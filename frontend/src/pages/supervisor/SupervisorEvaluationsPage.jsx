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
            <div key={r.id} className="mini-card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem' }}>{r.payload.student_id}</strong>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>Score: {r.payload.score}/10</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                "{r.payload.feedback?.slice(0, 100)}{r.payload.feedback?.length > 100 ? '…' : ''}"
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
          <InternshipSearchField name="internship_id" callerRole="supervisor" />
          <UserSearchField
            label="Student *"
            role="student"
            callerRole="supervisor"
            name="student_id"
            placeholder="Search student by name or ID…"
            onChange={setSelectedStudent}
          />
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
