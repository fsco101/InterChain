import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { issueCertificate, fetchCertificates } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { useAuth } from '../../context/AuthContext'
import { UserSearchField } from '../../components/SearchFields'

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', description: 'Dashboard summary', end: true },
  { to: '/employer/approvals', label: 'Approvals', description: 'Approve completions' },
  { to: '/employer/history', label: 'History', description: 'All approval records' },
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

// A4 landscape at 96dpi: 1122 x 794 px
const CERT_W = 1122
const CERT_H = 794

function CertLayout({ form, logoSrc, id }) {
  return (
    <div
      id={id}
      style={{
        width: CERT_W,
        height: CERT_H,
        background: '#ffffff',
        color: '#1e293b',
        fontFamily: 'Georgia, Times New Roman, serif',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* outer border */}
      <div style={{
        position: 'absolute', inset: 0,
        border: '16px solid #0ea5e9',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }} />
      {/* inner border */}
      <div style={{
        position: 'absolute', inset: 20,
        border: '2px solid #bae6fd',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }} />

      {/* decorative corner accents */}
      {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
        <div key={v + h} style={{
          position: 'absolute',
          [v]: 28, [h]: 28,
          width: 32, height: 32,
          borderTop: v === 'top' ? '3px solid #0ea5e9' : 'none',
          borderBottom: v === 'bottom' ? '3px solid #0ea5e9' : 'none',
          borderLeft: h === 'left' ? '3px solid #0ea5e9' : 'none',
          borderRight: h === 'right' ? '3px solid #0ea5e9' : 'none',
          pointerEvents: 'none',
        }} />
      ))}

      {/* content wrapper */}
      <div style={{ padding: '48px 80px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {/* header */}
        <div style={{ textAlign: 'center' }}>
          {logoSrc && (
            <img
              src={logoSrc}
              alt="logo"
              crossOrigin="anonymous"
              style={{ maxHeight: 72, maxWidth: 220, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }}
            />
          )}
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: '#0ea5e9', fontFamily: 'Arial, sans-serif' }}>
            Certificate of Completion
          </p>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>
            {form.company_name || 'Company Name'}
          </h1>
          {form.company_address && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', fontFamily: 'Arial, sans-serif' }}>
              {form.company_address}
            </p>
          )}
        </div>

        {/* body */}
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px', fontFamily: 'Arial, sans-serif' }}>
            This is to certify that
          </p>
          <p style={{
            fontSize: 36, fontWeight: 700, color: '#0f172a',
            margin: '0 0 6px', lineHeight: 1.2,
            borderBottom: '2px solid #e2e8f0', paddingBottom: 10,
            fontFamily: 'Georgia, serif',
          }}>
            {form.recipient_name || 'Recipient Name'}
          </p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0', fontFamily: 'Arial, sans-serif' }}>
            {form.recipient_type === 'student' ? 'Student' : 'Instructor'}&nbsp;·&nbsp;{form.recipient_role_id || '—'}
          </p>

          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, margin: '20px auto 0', maxWidth: 700, fontFamily: 'Georgia, serif' }}>
            has successfully completed the internship program{' '}
            <strong>"{form.internship_title || 'Internship Title'}"</strong>
            {form.start_date && form.end_date && (
              <> from <strong>{form.start_date}</strong> to <strong>{form.end_date}</strong></>
            )}.
          </p>

          {form.remarks && (
            <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', margin: '12px auto 0', maxWidth: 620, fontFamily: 'Georgia, serif' }}>
              "{form.remarks}"
            </p>
          )}
        </div>

        {/* footer: date + signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: 'Arial, sans-serif' }}>
              Blockchain-verified · InterChain
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: 220 }}>
            <div style={{ borderTop: '2px solid #334155', paddingTop: 6 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, fontFamily: 'Arial, sans-serif' }}>
                {form.signatory_name || 'Signatory Name'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'Arial, sans-serif' }}>
                {form.signatory_title || 'Title'}
              </p>
            </div>
          </div>
        </div>

      </div>
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
        <a
          href={cert.blockchain.explorer_url}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}
        >
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
  const [tab, setTab] = useState('form')
  const [recipientResetKey, setRecipientResetKey] = useState(0)

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

  // capture the hidden full-size element, not the scaled preview
  const captureCert = async () => {
    const el = document.getElementById('cert-hidden')
    return await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: CERT_W,
      height: CERT_H,
    })
  }

  const downloadPDF = async () => {
    try {
      const canvas = await captureCert()
      const imgData = canvas.toDataURL('image/png')
      // A4 landscape in mm: 297 x 210
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210)
      pdf.save(`certificate-${form.recipient_role_id || 'draft'}.pdf`)
    } catch (err) {
      showError('PDF export failed', err.message)
    }
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

    const certEl = document.getElementById('cert-hidden')
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
      setRecipientResetKey((k) => k + 1)
      await loadHistory()
      setTab('history')
    } catch (err) {
      showError('Could not issue certificate', extractError(err))
    } finally {
      setIssuing(false)
    }
  }

  // scale factor to fit 1122px cert into the preview card (~480px available)
  const previewScale = 0.42

  return (
    <div className="dashboard-stack">
      {/* hidden full-size cert used for PDF capture only */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
        <CertLayout id="cert-hidden" form={form} logoSrc={logoSrc} />
      </div>

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
              <select value={form.recipient_type} onChange={(e) => {
                set('recipient_type', e.target.value)
                set('recipient_role_id', '')
                set('recipient_name', '')
                set('recipient_email', '')
                setRecipientResetKey((k) => k + 1)
              }}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </label>
            <UserSearchField
              label="Recipient (search by name or ID) *"
              role={form.recipient_type}
              callerRole="employer"
              name="_recipient_search"
              placeholder={`Search ${form.recipient_type} by name or ID…`}
              resetKey={recipientResetKey}
              onChange={(u) => {
                if (u) {
                  set('recipient_role_id', u.role_id)
                  set('recipient_name', u.full_name)
                  if (u.email) set('recipient_email', u.email)
                } else {
                  set('recipient_role_id', '')
                  set('recipient_name', '')
                }
              }}
            />
            <label>Recipient Full Name *
              <input type="text" value={form.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} placeholder="Juan Dela Cruz" />
            </label>
            <label>Recipient Email *
              <input type="email" value={form.recipient_email} onChange={(e) => set('recipient_email', e.target.value)} placeholder="juan@email.com" />
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

          {/* Scaled preview — visual only, not used for capture */}
          <div className="dashboard-card" style={{ overflow: 'hidden' }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Live Preview</p>
            <div style={{
              width: '100%',
              height: Math.round(CERT_H * previewScale),
              overflow: 'hidden',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.15)',
            }}>
              <div style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                width: CERT_W,
                height: CERT_H,
                pointerEvents: 'none',
              }}>
                <CertLayout id="cert-preview" form={form} logoSrc={logoSrc} />
              </div>
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
