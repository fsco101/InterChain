import { useEffect, useState } from 'react'

import { createStudentActivity, createStudentReport, fetchStudentRecords } from '../../api/records'
import { confirmAction, showError, showSuccess } from '../../utils/alerts'
import { validateStudentActivity, validateStudentReport } from '../../utils/validation'

function RecordList({ title, records }) {
  return (
    <div className="dashboard-card compact-card">
      <h3>{title}</h3>
      <div className="stack-list">
        {records.length === 0 ? <p className="muted">No records yet.</p> : records.map((record) => <div key={record.id} className="mini-card">{record.payload.title || record.payload.report_title}</div>)}
      </div>
    </div>
  )
}

function toFormValues(formData) {
  return Object.fromEntries(formData.entries())
}

export default function StudentActions() {
  const [activityRecords, setActivityRecords] = useState([])
  const [reportRecords, setReportRecords] = useState([])

  const loadRecords = async () => {
    try {
      const { data } = await fetchStudentRecords()
      setActivityRecords(data.activity_logs || [])
      setReportRecords(data.reports || [])
    } catch {
      showError('Unable to load student records')
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const submitActivity = async (event) => {
    event.preventDefault()
    const values = toFormValues(new FormData(event.currentTarget))
    const validationError = validateStudentActivity(values)

    if (validationError) {
      showError(validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Submit activity log?', text: 'This will save the internship activity to MongoDB.' })
    if (!confirmed) {
      return
    }

    try {
      await createStudentActivity({
        internship_id: values.internship_id,
        activity_date: values.activity_date,
        title: values.title,
        description: values.description,
        hours_spent: Number(values.hours_spent),
      })
      showSuccess('Activity logged successfully')
      event.currentTarget.reset()
      await loadRecords()
    } catch (error) {
      showError(error?.response?.data?.detail || 'Could not save activity log')
    }
  }

  const submitReport = async (event) => {
    event.preventDefault()
    const values = toFormValues(new FormData(event.currentTarget))
    const validationError = validateStudentReport(values)

    if (validationError) {
      showError(validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Submit report?', text: 'This will save the internship report to MongoDB.' })
    if (!confirmed) {
      return
    }

    try {
      await createStudentReport({
        internship_id: values.internship_id,
        report_title: values.report_title,
        summary: values.summary,
      })
      showSuccess('Report submitted successfully')
      event.currentTarget.reset()
      await loadRecords()
    } catch (error) {
      showError(error?.response?.data?.detail || 'Could not submit report')
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="grid-two">
        <form className="dashboard-card form-card" onSubmit={submitActivity}>
          <h3>Daily Activity</h3>
          <label>
            Internship ID
            <input name="internship_id" type="text" placeholder="INT-1001" required />
          </label>
          <label>
            Activity date
            <input name="activity_date" type="date" required />
          </label>
          <label>
            Title
            <input name="title" type="text" placeholder="Client onboarding" required />
          </label>
          <label>
            Description
            <textarea name="description" rows="4" placeholder="Describe the work completed" required />
          </label>
          <label>
            Hours spent
            <input name="hours_spent" type="number" step="0.5" min="0.5" max="24" placeholder="6" required />
          </label>
          <button className="primary-button" type="submit">Save activity</button>
        </form>

        <form className="dashboard-card form-card" onSubmit={submitReport}>
          <h3>Internship Report</h3>
          <label>
            Internship ID
            <input name="internship_id" type="text" placeholder="INT-1001" required />
          </label>
          <label>
            Report title
            <input name="report_title" type="text" placeholder="Weekly summary" required />
          </label>
          <label>
            Summary
            <textarea name="summary" rows="6" placeholder="Summarize your progress and outcomes" required />
          </label>
          <button className="primary-button" type="submit">Submit report</button>
        </form>
      </div>

      <div className="grid-two">
        <RecordList title="Recent activities" records={activityRecords} />
        <RecordList title="Recent reports" records={reportRecords} />
      </div>
    </div>
  )
}
