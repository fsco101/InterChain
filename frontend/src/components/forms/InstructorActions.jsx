import { useEffect, useState } from 'react'

import { createInstructorAttendance, createInstructorEvaluation, fetchInstructorRecords } from '../../api/records'
import { confirmAction, showError, showSuccess } from '../../utils/alerts'
import { validateInstructorAttendance, validateInstructorEvaluation } from '../../utils/validation'

function RecordList({ title, records }) {
  return (
    <div className="dashboard-card compact-card">
      <h3>{title}</h3>
      <div className="stack-list">
        {records.length === 0 ? <p className="muted">No records yet.</p> : records.map((record) => <div key={record.id} className="mini-card">{record.payload.student_id} • {record.payload.status || record.payload.score}</div>)}
      </div>
    </div>
  )
}

function toFormValues(formData) {
  return Object.fromEntries(formData.entries())
}

export default function InstructorActions() {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [evaluationRecords, setEvaluationRecords] = useState([])

  const loadRecords = async () => {
    try {
      const { data } = await fetchInstructorRecords()
      setAttendanceRecords(data.attendance || [])
      setEvaluationRecords(data.evaluations || [])
    } catch {
      showError('Unable to load instructor records')
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const submitAttendance = async (event) => {
    event.preventDefault()
    const values = toFormValues(new FormData(event.currentTarget))
    const validationError = validateInstructorAttendance(values)

    if (validationError) {
      showError(validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Validate attendance?', text: 'This will record attendance for the student internship.' })
    if (!confirmed) {
      return
    }

    try {
      await createInstructorAttendance({
        internship_id: values.internship_id,
        student_id: values.student_id,
        attendance_date: values.attendance_date,
        status: values.status,
        notes: values.notes || null,
      })
      showSuccess('Attendance recorded successfully')
      event.currentTarget.reset()
      await loadRecords()
    } catch (error) {
      showError(error?.response?.data?.detail || 'Could not record attendance')
    }
  }

  const submitEvaluation = async (event) => {
    event.preventDefault()
    const values = toFormValues(new FormData(event.currentTarget))
    const validationError = validateInstructorEvaluation(values)

    if (validationError) {
      showError(validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Submit evaluation?', text: 'This will save the performance evaluation to MongoDB.' })
    if (!confirmed) {
      return
    }

    try {
      await createInstructorEvaluation({
        internship_id: values.internship_id,
        student_id: values.student_id,
        score: Number(values.score),
        feedback: values.feedback,
      })
      showSuccess('Evaluation submitted successfully')
      event.currentTarget.reset()
      await loadRecords()
    } catch (error) {
      showError(error?.response?.data?.detail || 'Could not submit evaluation')
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="grid-two">
        <form className="dashboard-card form-card" onSubmit={submitAttendance}>
          <h3>Attendance Validation</h3>
          <label>
            Internship ID
            <input name="internship_id" type="text" placeholder="INT-1001" required />
          </label>
          <label>
            Student ID
            <input name="student_id" type="text" placeholder="STU-204" required />
          </label>
          <label>
            Attendance date
            <input name="attendance_date" type="date" required />
          </label>
          <label>
            Status
            <select name="status" defaultValue="present" required>
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

        <form className="dashboard-card form-card" onSubmit={submitEvaluation}>
          <h3>Performance Evaluation</h3>
          <label>
            Internship ID
            <input name="internship_id" type="text" placeholder="INT-1001" required />
          </label>
          <label>
            Student ID
            <input name="student_id" type="text" placeholder="STU-204" required />
          </label>
          <label>
            Score
            <input name="score" type="number" min="1" max="10" step="1" placeholder="8" required />
          </label>
          <label>
            Feedback
            <textarea name="feedback" rows="6" placeholder="Explain the student performance" required />
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
