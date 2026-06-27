import { useEffect, useRef, useState } from 'react'

import { createStudentActivity, createStudentReport, fetchStudentRecords } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { validateStudentActivity, validateStudentReport } from '../../utils/validation'
import { InternshipSearchField } from '../SearchFields'

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
  const [activityReset, setActivityReset] = useState(0)
  const [reportReset, setReportReset] = useState(0)

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
    const formElement = event.currentTarget
    const values = toFormValues(new FormData(formElement))
    const validationError = validateStudentActivity(values)

    if (validationError) {
      showError('Invalid input', validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Submit activity log?', text: 'This will save the internship activity to MongoDB.' })
    if (!confirmed) return

    try {
      await createStudentActivity({
        internship_id: values.internship_id,
        activity_date: values.activity_date,
        title: values.title,
        description: values.description,
        hours_spent: Number(values.hours_spent),
      })
      showSuccess('Activity logged', 'Your internship activity has been saved.')
      formElement.reset()
      setActivityReset((k) => k + 1)
      await loadRecords()
    } catch (error) {
      showError('Could not save activity', extractError(error))
    }
  }

  const submitReport = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const values = toFormValues(new FormData(formElement))
    const validationError = validateStudentReport(values)

    if (validationError) {
      showError('Invalid input', validationError)
      return
    }

    const confirmed = await confirmAction({ title: 'Submit report?', text: 'This will save the internship report to MongoDB.' })
    if (!confirmed) return

    try {
      await createStudentReport({
        internship_id: values.internship_id,
        report_title: values.report_title,
        summary: values.summary,
      })
      showSuccess('Report submitted', 'Your internship report has been saved.')
      formElement.reset()
      setReportReset((k) => k + 1)
      await loadRecords()
    } catch (error) {
      showError('Could not submit report', extractError(error))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="grid-two">
        <form className="dashboard-card form-card" onSubmit={submitActivity}>
          <h3>Daily Activity</h3>
          <InternshipSearchField name="internship_id" callerRole="student" resetKey={activityReset} />
          <label>
            Activity date
            <input name="activity_date" type="date" />
          </label>
          <label>
            Title
            <input name="title" type="text" placeholder="Client onboarding (min 3 chars)" />
          </label>
          <label>
            Description
            <textarea name="description" rows="4" placeholder="Describe the work completed (min 10 chars)" />
          </label>
          <label>
            Hours spent
            <input name="hours_spent" type="number" step="0.5" min="0.5" max="24" placeholder="6" />
          </label>
          <button className="primary-button" type="submit">Save activity</button>
        </form>

        <form className="dashboard-card form-card" onSubmit={submitReport}>
          <h3>Internship Report</h3>
          <InternshipSearchField name="internship_id" callerRole="student" resetKey={reportReset} />
          <label>
            Report title
            <input name="report_title" type="text" placeholder="Weekly summary (min 3 chars)" />
          </label>
          <label>
            Summary
            <textarea name="summary" rows="6" placeholder="Summarize your progress and outcomes (min 20 chars)" />
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
