import { useEffect, useState } from 'react'

import { createEmployerApproval, fetchEmployerRecords } from '../../api/records'
import { confirmAction, showError, showSuccess } from '../../utils/alerts'
import { validateEmployerApproval } from '../../utils/validation'

function RecordList({ title, records }) {
  return (
    <div className="dashboard-card compact-card">
      <h3>{title}</h3>
      <div className="stack-list">
        {records.length === 0 ? <p className="muted">No records yet.</p> : records.map((record) => <div key={record.id} className="mini-card">{record.payload.student_id} • {record.payload.approved ? 'Approved' : 'Pending'}</div>)}
      </div>
    </div>
  )
}

function toFormValues(formData) {
  return Object.fromEntries(formData.entries())
}

export default function EmployerActions() {
  const [approvals, setApprovals] = useState([])

  const loadRecords = async () => {
    try {
      const { data } = await fetchEmployerRecords()
      setApprovals(data.approvals || [])
    } catch {
      showError('Unable to load employer approvals')
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const submitApproval = async (event) => {
    event.preventDefault()
    const values = toFormValues(new FormData(event.currentTarget))
    const validationError = validateEmployerApproval(values)

    if (validationError) {
      showError(validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Approve internship completion?', text: 'This will save the completion approval to MongoDB.' })
    if (!confirmed) {
      return
    }

    try {
      await createEmployerApproval({
        internship_id: values.internship_id,
        student_id: values.student_id,
        approval_date: values.approval_date,
        approved: values.approved === 'true',
        notes: values.notes || null,
      })
      showSuccess('Completion approval saved successfully')
      event.currentTarget.reset()
      await loadRecords()
    } catch (error) {
      showError(error?.response?.data?.detail || 'Could not save completion approval')
    }
  }

  return (
    <div className="dashboard-stack">
      <form className="dashboard-card form-card single-form" onSubmit={submitApproval}>
        <h3>Completion Approval</h3>
        <label>
          Internship ID
          <input name="internship_id" type="text" placeholder="INT-1001" required />
        </label>
        <label>
          Student ID
          <input name="student_id" type="text" placeholder="STU-204" required />
        </label>
        <label>
          Approval date
          <input name="approval_date" type="date" required />
        </label>
        <label>
          Approval status
          <select name="approved" defaultValue="true" required>
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
