import { useEffect, useRef, useState } from 'react'

import { createStudentActivity, createStudentReport, fetchStudentRecords } from '../../api/records'
import { confirmAction, showError, showSuccess, extractError } from '../../utils/alerts'
import { validateStudentActivity, validateStudentReport } from '../../utils/validation'
import { useFormPersist } from '../../hooks/useFormPersist'

function ExpandableRecord({ record, title, content }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mini-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <span style={{ fontWeight: 600 }}>{title}</span>
          {record.payload.activity_date && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>{record.payload.activity_date} &middot; {record.payload.hours_spent}h</div>}
        </div>
        {record.payload.validation_status && (
          <span
            className="role-chip"
            style={{
              background:
                record.payload.validation_status === 'validated'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : record.payload.validation_status === 'rejected'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              color:
                record.payload.validation_status === 'validated'
                  ? '#22c55e'
                  : record.payload.validation_status === 'rejected'
                  ? '#ef4444'
                  : '#f59e0b',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexShrink: 0
            }}
          >
            {record.payload.validation_status}
          </span>
        )}
      </div>
      
      {content && (
        <div style={{ fontSize: '0.85rem' }}>
          {expanded ? (
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', marginTop: 4 }}>{content}</div>
          ) : (
            <div style={{ color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{content}</div>
          )}
          {content.length > 80 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px 0', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginTop: 4 }}
            >
              {expanded ? 'See Less' : 'See More'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RecordList({ title, records }) {
  const [showAll, setShowAll] = useState(false)
  const displayedRecords = showAll ? records : records.slice(0, 5)

  return (
    <div className="dashboard-card compact-card">
      <h3>{title}</h3>
      <div className="stack-list">
        {records.length === 0 ? (
          <p className="muted">No records yet.</p>
        ) : (
          <>
            {displayedRecords.map((record) => {
              const title = record.payload.title || record.payload.report_title
              const content = record.payload.description || record.payload.summary
              
              return (
                <ExpandableRecord key={record.id} record={record} title={title} content={content} />
              )
            })}
            
            {records.length > 5 && (
              <button 
                onClick={() => setShowAll(!showAll)}
                type="button"
                style={{
                  background: 'none',
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  padding: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  width: '100%',
                  marginTop: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)' }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'none' }}
              >
                {showAll ? 'See less' : `See more (${records.length - 5} hidden)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function toFormValues(formData) {
  return Object.fromEntries(formData.entries())
}

export default function StudentActions({ user }) {
  const [activityRecords, setActivityRecords] = useState([])
  const [reportRecords, setReportRecords] = useState([])
  const [activityReset, setActivityReset] = useState(0)
  const [reportReset, setReportReset] = useState(0)

  const { formRef: activityFormRef, clearForm: clearActivityForm } = useFormPersist('student-activity-form')
  const { formRef: reportFormRef, clearForm: clearReportForm } = useFormPersist('student-report-form')

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
      clearActivityForm()
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
      clearReportForm()
      setReportReset((k) => k + 1)
      await loadRecords()
    } catch (error) {
      showError('Could not submit report', extractError(error))
    }
  }

  return (
    <div className="dashboard-stack">
      {user?.supervisor_id && (
        <div className="grid-two">
          <form className="dashboard-card form-card" ref={activityFormRef} onSubmit={submitActivity}>
            <h3>Daily Activity</h3>
            <label>
              Internship ID (Auto-detected)
              <input name="internship_id" type="text" value={user?.internship_id || ''} readOnly style={{ background: 'var(--input-bg)', opacity: 0.7, cursor: 'not-allowed' }} />
            </label>
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

          <form className="dashboard-card form-card" ref={reportFormRef} onSubmit={submitReport}>
            <h3>Internship Report</h3>
            <label>
              Internship ID (Auto-detected)
              <input name="internship_id" type="text" value={user?.internship_id || ''} readOnly style={{ background: 'var(--input-bg)', opacity: 0.7, cursor: 'not-allowed' }} />
            </label>
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
      )}

      <div className="grid-two">
        <RecordList title="Recent activities" records={activityRecords} />
        <RecordList title="Recent reports" records={reportRecords} />
      </div>
    </div>
  )
}
