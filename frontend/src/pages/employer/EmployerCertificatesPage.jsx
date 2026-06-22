import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { issueCertificate, fetchCertificates } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/rankings', label: 'Rankings', description: 'Student performance ranks' },
  { to: '/employer/roster', label: 'Roster', description: 'Instructors & their students' },
  { to: '/employer/certificates', label: 'Certificates', description: 'Issue e-certificates' },
  { to: '/profile', label: 'Profile', description: 'Edit your account' },
]

const EMPTY = {
  recipient_name: '', recipient_email: '', recipient_role_id: '', recipient_type: 'student',
  internship_title: '', company_name: '', company_address: '', signatory_name: '',
  signatory_title: '', start_date: '', end_date: '', remarks: '', send_email: true,
}

function CertPreview({ form, logoSrc }) {
  return (
    <div id="cert-preview" style={{
      width: 794, minHeight: 560, background: '#fff', color: '#1e293b',
      fontFamily: 'Georgia, serif', padding: '48px 64px', position: 'relative',
      border: '12px solid #0ea5e9', borderRadius: 4, boxSizing: 'border-box',
    }}>
      {/* inner border */}
      <div style={{ position: 'absolute', inset: 8, border: '2px solid #bae6fd', borderRadius: 2, pointerEvents: 'none' }} />

      {/* header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        {logoSrc && <img src={logoSrc} alt="logo" style={{ maxHeight: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 12 }} />}
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#0ea5e9' }}>
          Certificate of Completion
        </p>
        <h1 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
          {form.company_name || 'Company Name'}
        </h1>
        {form.company_address && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{form.company_address}</p>
        )}
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>This is to certify that</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '8px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
          {form.recipient_name || 'Recipient Name'}
        </p>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
          {form.recipient_type === 'student' ? 'Student' : 'Instructor'} · {form.recipient_role_id || '—'}
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#334155', lineHeight: 1.7, margin: '16px 0' }}>
        has successfully completed the internship program{' '}
        <strong>"{form.internship_title || 'Internship Title'}"</strong>{' '}
        from <strong>{form.start_date || '—'}</strong> to <strong>{form.end_date || '—'}</strong>.
      </p>

      {form.remarks && (
        <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', fontStyle: 'italic', margin: '12px 0' }}>
          "{form.remarks}"
        </p>
      )}

      {/* signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
        <div style={{ textAlign: 'center', minWidth: 200 }}>
          <div style={{ borderTop: '2px solid #334155', paddingTop: 6 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{form.signatory_name || 'Signatory Name'}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{form.signatory_title || 'Title'}</p>
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 24 }}>
        Blockchain-verified · InterChain
      </p>
    </div>
  )
}

function CertHistoryRow({ cert }) {
  return (
    <div className="users-row">
      <div>
        <strong>{cert.payload.recipient_name}</strong>
        <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>{cert.payload.internship_title}</p>
        <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>{cert.payload.company_name}</p>
      </div>
      <span className="role-chip">{cert.payload.recipient_role_id}</span>
      <span className="muted" style={{ fontSize: '0.75rem' }}>{new Date(cert.created_at).toLocaleDateString()}</span>
      {cert.blockchain?.tx_hash && (
        <a href={cert.blockchain.explorer_url} target="_blank" rel="noreferrer"
          style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
          {cert.blockchain.tx_hash.slice(0, 18)}…
        </a>
      )}
    </div>
  )
}

function EmployerCertificatesPanel() {
  const { user } = useAuth()
  const [form, setForm] = useState({ ...EMPTY, company_name: user?.institution || '' })
  const [logoSrc, setLogoSrc] = useState(null)
  const [issuing, setIssuing] = useState(false)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('form') // 'form' | 'history'

  const loadHistory = async () => {
    try {
      const { data } = await fetchCertificates()
      setHistory(data.certificates || [])
    } catch { /* silent */ }
  }

  useEffect(() => { loadHistory() }, [])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogoSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  const downloadPDF = async () => {
    const el = document.getElementById('cert-preview')
    const canvas = await html2canvas(el, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [794, canvas.height / 2] })
    pdf.addImage(imgData, 'PNG', 0, 0, 794, canvas.height / 2)
    pdf.save(`certificate-${form.recipient_role_id || 'draft'}.pdf`)
  }

  const handleIssue = async () => {
    const required = ['recipient_name', 'recipient_email', 'recipient_role_id', 'internship_title', 'company_name', 'signatory_name', 'signatory_title', 'start_date', 'end_date']
    for (const k of required) {
      if (!form[k]?.trim()) {
        showError('Missing field', `"${k.replace(/_/g, ' ')}" is required`)
        return
      }
    }
    const ok = await confirmAction({
      title: 'Issue certificate?',
      text: `This will save to blockchain${form.send_email ? ' and send an email to ' + form.recipient_email : ''}.`,
      confirmButtonText: 'Issue',
    })
    if (!ok) return

    // get cert HTML
    const certEl = document.getElementById('cert-preview')
    const certHtml = certEl ? certEl.outerHTML : ''

    setIssuing(true)
    try {
      const { data } = await issueCertificate({
        ...form,
        send_email: Boolean(form.send_email),
        company_logo_b64: logoSrc || null,
        cert_html: certHtml,
      })
      showSuccess('Certificate issued', data.email_sent ? 'Email sent successfully.' : data.email_error ? `Saved (email error: ${data.email_error})` : 'Saved to blockchain.')
      setForm({ ...EMPTY, company_name: user?.institution || '' })
      setLogoSrc(null)
      await loadHistory()
      setTab('history')
    } catch (err) {
      showError('Could not issue certificate', extractError(err))
    } finally {
      setIssuing(false)
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Employer</p>
        <h2>E-Certificates</h2>
        <p className="muted">Generate blockchain-verified internship certificates and send them directly to the recipient's email.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className={tab === 'form' ? 'primary-button' : 'secondary-button'} onClick={() => setTab('form')}>Issue New</button>
          <button className={tab === 'history' ? 'primary-button' : 'secondary-button'} onClick={() => setTab('history')}>History ({history.length})</button>
        </div>
      </div>

      {tab === 'history' && (
        <div className="dashboard-card">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Issued Certificates</p>
          {history.length === 0
            ? <p className="muted">No certificates issued yet.</p>
            : <div className="users-table">{history.map((c) => <CertHistoryRow key={c.id} cert={c} />)}</div>
          }
        </div>
      )}

      {tab === 'form' && (
        <div className="grid-two" style={{ alignItems: 'start' }}>
          {/* Form */}
          <div className="dashboard-card form-card">
            <h3>Certificate Details</h3>

            <label>Recipient Type
              <select value={form.recipient_type} onChange={(e) => set('recipient_type', e.target.value)}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </label>
            <label>Recipient Full Name *
              <input type="text" value={form.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} placeholder="Juan Dela Cruz" />
            </label>
            <label>Recipient Email *
              <input type="email" value={form.recipient_email} onChange={(e) => set('recipient_email', e.target.value)} placeholder="juan@email.com" />
            </label>
            <label>Recipient ID (STU-/INS-) *
              <input type="text" value={form.recipient_role_id} onChange={(e) => set('recipient_role_id', e.target.value.toUpperCase())} placeholder="STU-12345" />
            </label>
            <label>Internship Title *
              <input type="text" value={form.internship_title} onChange={(e) => set('internship_title', e.target.value)} placeholder="Software Development Internship" />
            </label>
            <label>Company Name *
              <input type="text" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="Acme Corporation" />
            </label>
            <label>Company Address
              <input type="text" value={form.company_address} onChange={(e) => set('company_address', e.target.value)} placeholder="123 Main St, City, Country" />
            </label>
            <label>Company Logo
              <input type="file" accept="image/*" onChange={handleLogo} />
            </label>
            <label>Start Date *
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </label>
            <label>End Date *
              <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </label>
            <label>Signatory Name *
              <input type="text" value={form.signatory_name} onChange={(e) => set('signatory_name', e.target.value)} placeholder="Maria Santos" />
            </label>
            <label>Signatory Title *
              <input type="text" value={form.signatory_title} onChange={(e) => set('signatory_title', e.target.value)} placeholder="HR Manager" />
            </label>
            <label>Remarks / Notes
              <textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Outstanding performance throughout the internship." />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.send_email} onChange={(e) => set('send_email', e.target.checked)} style={{ width: 18, height: 18, minHeight: 'unset' }} />
              Send certificate to recipient's email
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <button className="secondary-button" type="button" onClick={downloadPDF}>⬇ Download PDF</button>
              <button className="primary-button" type="button" onClick={handleIssue} disabled={issuing}>
                {issuing ? 'Issuing…' : '✦ Issue & Save to Blockchain'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="dashboard-card" style={{ overflow: 'auto' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Live Preview</p>
            <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left', width: 794, pointerEvents: 'none' }}>
              <CertPreview form={form} logoSrc={logoSrc} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmployerCertificatesPage() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={LINKS}>
        <div className="page-shell dashboard-shell">
          <EmployerCertificatesPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
