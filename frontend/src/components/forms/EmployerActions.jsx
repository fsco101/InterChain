import { useEffect, useRef, useState } from 'react'

import { createEmployerApproval, fetchEmployerRecords } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { validateEmployerApproval } from '../../utils/validation'
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
              {r.payload.student_id} • {r.payload.approved ? 'Approved' : 'Pending'}
            </div>
          ))}
      </div>
    </div>
  )
}

export default function EmployerActions() {
  const [approvals, setApprovals] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const formRef = useRef(null)

  const loadRecords = async () => {
    try {
      const { data } = await fetchEmployerRecords()
      setApprovals(data.approvals || [])
    } catch {
      showError('Unable to load employer approvals')
    }
  }

  useEffect(() => { loadRecords() }, [])

  const submitApproval = async (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const validationError = validateEmployerApproval(values)
    if (validationError) { showError('Invalid input', validationError); return }
    const confirmed = await confirmAction({ title: 'Approve internship completion?', text: 'This will save the completion approval to MongoDB.' })
    if (!confirmed) return
    try {
      await createEmployerApproval({
        internship_id: values.internship_id,
        student_id: values.student_id,
        approval_date: values.approval_date,
        approved: values.approved === 'true',
        notes: values.notes || null,
      })
      const status = values.approved === 'true' ? 'Approved' : 'Not approved'
      showSuccess('Approval saved', `${status} for student ${values.student_id}.`)
      formRef.current?.reset()
      setSelectedStudent(null)
      await loadRecords()
    } catch (error) {
      showError('Could not save approval', extractError(error))
    }
  }

  return (
    <div className="dashboard-stack">
      <form className="dashboard-card form-card single-form" onSubmit={submitApproval} ref={formRef}>
        <h3>Completion Approval</h3>
        <InternshipSearchField name="internship_id" callerRole="employer" />
        <UserSearchField
          label="Student"
          role="student"
          callerRole="employer"
          name="student_id"
          placeholder="Search student by name or ID…"
          onChange={setSelectedStudent}
        />
        <label>
          Approval date
          <input name="approval_date" type="date" />
        </label>
        <label>
          Approval status
          <select name="approved" defaultValue="true">
            <option value="true">Approved</option>
            <option value="false">Not approved</option>
          </select>
        </label>
        <label>
          Notes
          <textarea name="notes" rows="5" placeholder="Optional approval notes" />
        </label>
        <button className="primary-button" type="submit">Save approval</button>
      </form>

      <RecordList title="Recent approvals" records={approvals} />
    </div>
  )
}
