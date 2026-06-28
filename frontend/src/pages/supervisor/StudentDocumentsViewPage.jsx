import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { fetchSupervisorStudentDocuments, fetchInstructorStudentDocuments, approveStudentOJT } from '../../api/records'
import { showError, showSuccess, extractError, showLoading, closeAlert } from '../../utils/alerts'
import { SUPERVISOR_LINKS, INSTRUCTOR_LINKS } from '../../utils/links'

const REQUIRED_DOCUMENTS = [
  'Resume',
  'Endorsement Letter',
  'Waiver',
  'Medical Certificate'
]

function StudentDocumentsViewPanel() {
  const { studentId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDocuments = async () => {
    try {
      const apiCall = user.role === 'supervisor' ? fetchSupervisorStudentDocuments : fetchInstructorStudentDocuments
      const { data } = await apiCall(studentId)
      setDocuments(data.documents || [])
    } catch (err) {
      showError('Failed to load documents', extractError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [studentId])

  const getDocStatus = (docType) => {
    const doc = documents.find(d => d.document_type === docType)
    return doc ? doc.status : 'Pending'
  }

  const getDocUrl = (docType) => {
    const doc = documents.find(d => d.document_type === docType)
    return doc ? doc.file_url : null
  }

  const allRequiredDone = REQUIRED_DOCUMENTS.every(docType => getDocStatus(docType) !== 'Pending')

  const handleApproveOJT = async () => {
    if (!allRequiredDone) {
      showError('Cannot Approve', 'Student has not submitted all required documents.')
      return
    }
    try {
      showLoading('Approving OJT...')
      await approveStudentOJT(studentId)
      closeAlert()
      showSuccess('OJT Approved', 'Approval letter has been generated and saved to the blockchain.')
      navigate('/supervisor/interns')
    } catch (err) {
      closeAlert()
      showError('Failed to approve', extractError(err))
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">{user.role === 'supervisor' ? 'Supervisor' : 'Instructor'}</p>
        <h2>Student Documents</h2>
        <p className="muted" style={{ maxWidth: 600 }}>
          Review the OJT documents uploaded by the student. {user.role === 'supervisor' && 'Once all documents are uploaded, you can approve their OJT.'}
        </p>
      </div>

      <div className="dashboard-card">
        {loading ? (
          <p className="muted">Loading documents...</p>
        ) : (
          <div className="users-table">
            {REQUIRED_DOCUMENTS.map((docType) => {
              const status = getDocStatus(docType)
              const fileUrl = getDocUrl(docType)
              const isDone = status !== 'Pending'

              return (
                <div key={docType} className="users-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--input-bg)', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 600 }}>{docType}</h4>
                    <span className="role-chip" style={{ background: isDone ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
                      {status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="secondary-button" style={{ textDecoration: 'none', padding: '6px 16px', fontSize: '0.8rem', minHeight: 'unset' }}>
                        View Document
                      </a>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.85rem' }}>No File</span>
                    )}
                  </div>
                </div>
              )
            })}

            {user.role === 'supervisor' && (
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {allRequiredDone ? (
                  <button className="primary-button" onClick={handleApproveOJT}>
                    Approve OJT
                  </button>
                ) : (
                  <button className="primary-button" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                    Pending Documents
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentDocumentsViewPage() {
  const { user } = useAuth()
  const links = user?.role === 'supervisor' ? SUPERVISOR_LINKS : INSTRUCTOR_LINKS

  return (
    <ProtectedRoute allowedRoles={['supervisor', 'instructor']}>
      <DashboardShell links={links}>
        <div className="page-shell dashboard-shell">
          <StudentDocumentsViewPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
