import { useEffect, useState, useRef } from 'react'
import DashboardShell from '../../components/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'
import { fetchStudentDocuments, uploadStudentDocument, removeStudentDocument } from '../../api/records'
import { showError, showSuccess, extractError, showLoading, closeAlert, confirmAction } from '../../utils/alerts'
import { STUDENT_LINKS } from '../../utils/links'

const REQUIRED_DOCUMENTS = [
  'Resume',
  'Endorsement Letter',
  'Waiver',
  'Medical Certificate'
]

function StudentDocumentsPanel() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const fileInputRefs = useRef({})

  const loadDocuments = async () => {
    try {
      const { data } = await fetchStudentDocuments()
      setDocuments(data.documents || [])
    } catch (err) {
      showError('Failed to load documents', extractError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])

  const handleUpload = async (docType) => {
    const fileInput = fileInputRefs.current[docType]
    const file = fileInput?.files?.[0]

    if (!file) {
      showError('File required', `Please attach a file for ${docType}.`)
      return
    }

    const formData = new FormData()
    formData.append('document_type', docType)
    formData.append('file', file)

    try {
      showLoading(`Uploading ${docType}...`)
      await uploadStudentDocument(formData)
      closeAlert()
      showSuccess('Uploaded', `${docType} uploaded successfully.`)
      if (fileInput) fileInput.value = ''
      await loadDocuments()
    } catch (err) {
      closeAlert()
      showError('Failed to upload', extractError(err))
    }
  }

  const handleRemove = async (docType) => {
    const ok = await confirmAction({ title: 'Remove Image?', text: `Are you sure you want to remove your uploaded image for ${docType}?` })
    if (!ok) return
    try {
      showLoading(`Removing image...`)
      await removeStudentDocument(docType)
      closeAlert()
      showSuccess('Removed', `${docType} removed successfully.`)
      await loadDocuments()
    } catch (err) {
      closeAlert()
      showError('Failed to remove', extractError(err))
    }
  }

  const getDocStatus = (docType) => {
    const doc = documents.find(d => d.document_type === docType)
    return doc ? doc.status : 'Pending'
  }

  const getDocUrl = (docType) => {
    const doc = documents.find(d => d.document_type === docType)
    return doc ? doc.file_url : null
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Student</p>
        <h2>OJT Documents</h2>
        <p className="muted" style={{ maxWidth: 600 }}>
          Upload all the necessary documents for your internship/OJT. You must upload an image of the document to mark it as done.
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
                    {fileUrl && (
                      <a href={fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                        View Upload
                      </a>
                    )}
                    {isDone ? (
                      <button className="secondary-button" style={{ padding: '6px 16px', fontSize: '0.8rem', minHeight: 'unset', color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }} onClick={() => handleRemove(docType)}>
                        Remove
                      </button>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => fileInputRefs.current[docType] = el}
                          style={{ fontSize: '0.75rem', width: 200 }}
                        />
                        <button className="primary-button" style={{ padding: '6px 16px', fontSize: '0.8rem', minHeight: 'unset' }} onClick={() => handleUpload(docType)}>
                          Upload Image & Mark Done
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentDocumentsPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardShell links={STUDENT_LINKS}>
        <div className="page-shell dashboard-shell">
          <StudentDocumentsPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
