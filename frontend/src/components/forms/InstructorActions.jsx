import { useEffect, useRef, useState } from 'react'

import { createInstructorAttendance, createInstructorEvaluation, fetchInstructorRecords } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { validateInstructorAttendance, validateInstructorEvaluation } from '../../utils/validation'
import { UserSearchField, InternshipSearchField } from '../SearchFields'

function RecordList({ title, records }) {
  return (
    <div className="dashboard-card compact-card">
      <h3>{title}</h3>
      <div className="stack-list">
        {records.length === 0
          ? <p className="muted">No records yet.</p>
          : records.map((r) => (
            <div key={r.id} className="mini-card">
              {r.payload.student_id} • {r.payload.status || r.payload.score}
            </div>
          ))}
      </div>
    </div>
  )
}

export default function InstructorActions() {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [evaluationRecords, setEvaluationRecords] = useState([])
  const [attendStudent, setAttendStudent] = useState(null)
  const [evalStudent, setEvalStudent] = useState(null)
  const attendFormRef = useRef(null)
  const evalFormRef = useRef(null)

  const loadRecords = async () => {
    try {
      const { data } = await fetchInstructorRecords()
      setAttendanceRecords(data.attendance || [])
      setEvaluationRecords(data.evaluations || [])
    } catch {
      showError('Unable to load instructor records')
    }
  }

  useEffect(() => { loadRecords() }, [])

  const submitAttendance = async (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const validationError = validateInstructorAttendance(values)
    if (validationError) { showError('Invalid input', validationError); return }
    const confirmed = await confirmAction({ title: 'Validate attendance?', text: 'This will record attendance for the student internship.' })
    if (!confirmed) return
    try {
      await createInstructorAttendance({
        internship_id: values.internship_id,
        student_id: values.student_id,
        attendance_date: values.attendance_date,
        status: values.status,
        notes: values.notes || null,
      })
      showSuccess('Attendance recorded', `Marked as ${values.status} for student ${values.student_id}.`)
      attendFormRef.current?.reset()
      setAttendStudent(null)
      await loadRecords()
    } catch (error) {
      showError('Could not record attendance', extractError(error))
    }
  }

  const submitEvaluation = async (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const validationError = validateInstructorEvaluation(values)
    if (validationError) { showError('Invalid input', validationError); return }
    const confirmed = await confirmAction({ title: 'Submit evaluation?', text: 'This will save the performance evaluation to MongoDB.' })
    if (!confirmed) return
    try {
      await createInstructorEvaluation({
        internship_id: values.internship_id,
        student_id: values.student_id,
        score: Number(values.score),
        feedback: values.feedback,
      })
      showSuccess('Evaluation submitted', `Score ${values.score}/10 saved for student ${values.student_id}.`)
      evalFormRef.current?.reset()
      setEvalStudent(null)
      await loadRecords()
    } catch (error) {
      showError('Could not submit evaluation', extractError(error))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="grid-two">
        <form className="dashboard-card form-card" onSubmit={submitAttendance} ref={attendFormRef}>
          <h3>Attendance Validation</h3>
          <InternshipSearchField name="internship_id" callerRole="instructor" />
          <UserSearchField
            label="Student"
            role="student"
            callerRole="instructor"
            name="student_id"
            placeholder="Search student by name or ID…"
            onChange={setAttendStudent}
          />
          <label>
            Attendance date
            <input name="attendance_date" type="date" />
          </label>
          <label>
            Status
            <select name="status" defaultValue="present">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </label>
          <label>
            Notes
            <textarea name="notes" rows="3" placeholder="Optional notes" />
          </label>
          <button className="primary-button" type="submit">Save attendance</button>
        </form>

        <form className="dashboard-card form-card" onSubmit={submitEvaluation} ref={evalFormRef}>
          <h3>Performance Evaluation</h3>
          <InternshipSearchField name="internship_id" callerRole="instructor" />
          <UserSearchField
            label="Student"
            role="student"
            callerRole="instructor"
            name="student_id"
            placeholder="Search student by name or ID…"
            onChange={setEvalStudent}
          />
          <label>
            Score
            <input name="score" type="number" min="1" max="10" step="1" placeholder="1–10" />
          </label>
          <label>
            Feedback
            <textarea name="feedback" rows="6" placeholder="Explain the student performance (min 10 chars)" />
          </label>
          <button className="primary-button" type="submit">Submit evaluation</button>
        </form>
      </div>

      <div className="grid-two">
        <RecordList title="Recent attendance" records={attendanceRecords} />
        <RecordList title="Recent evaluations" records={evaluationRecords} />
      </div>
    </div>
  )
}
