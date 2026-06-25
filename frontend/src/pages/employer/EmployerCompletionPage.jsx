import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import { createEmployerApproval, fetchEmployerRecords, fetchEmployerHistory, issueCertificate, fetchCertificates, fetchStudentHours } from '../../api/records'
import { showError, showSuccess, extractError, confirmAction } from '../../utils/alerts'
import { useAuth } from '../../context/AuthContext'
import { UserSearchField, InternshipSearchField } from '../../components/SearchFields'
import { EMPLOYER_LINKS } from '../../utils/links'
import { validateEmployerApproval } from '../../utils/validation'

// ── Certificate Layout (unchanged) ────────────────────────────────────────────
const CERT_W = 1122
const CERT_H = 794

function CertLayout({ form, logoSrc, id }) {
  return (
    <div id={id} style={{ width: CERT_W, height: CERT_H, background: '#ffffff', color: '#1e293b', fontFamily: 'Georgia, Times New Roman, serif', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, border: '16px solid #0ea5e9', boxSizing: 'border-box', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 20, border: '2px solid #bae6fd', boxSizing: 'border-box', pointerEvents: 'none' }} />
      {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h])=>(
        <div key={v+h} style={{ position:'absolute',[v]:28,[h]:28,width:32,height:32,borderTop:v==='top'?'3px solid #0ea5e9':'none',borderBottom:v==='bottom'?'3px solid #0ea5e9':'none',borderLeft:h==='left'?'3px solid #0ea5e9':'none',borderRight:h==='right'?'3px solid #0ea5e9':'none',pointerEvents:'none'}} />
      ))}
      <div style={{ padding: '48px 80px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          {logoSrc && <img src={logoSrc} alt="logo" crossOrigin="anonymous" style={{ maxHeight: 72, maxWidth: 220, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />}
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: '#0ea5e9', fontFamily: 'Arial, sans-serif' }}>Certificate of Completion</p>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>{form.company_name || 'Company Name'}</h1>
          {form.company_address && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', fontFamily: 'Arial, sans-serif' }}>{form.company_address}</p>}
        </div>
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px', fontFamily: 'Arial, sans-serif' }}>This is to certify that</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.2, borderBottom: '2px solid #e2e8f0', paddingBottom: 10, fontFamily: 'Georgia, serif' }}>{form.recipient_name || 'Recipient Name'}</p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0', fontFamily: 'Arial, sans-serif' }}>{form.recipient_type === 'student' ? 'Student' : 'Instructor'}&nbsp;·&nbsp;{form.recipient_role_id || '—'}</p>
          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, margin: '20px auto 0', maxWidth: 700, fontFamily: 'Georgia, serif' }}>
            has successfully completed the internship program <strong>"{form.internship_title || 'Internship Title'}"</strong>
            {form.start_date && form.end_date && <> from <strong>{form.start_date}</strong> to <strong>{form.end_date}</strong></>}.
          </p>
          {form.remarks && <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', margin: '12px auto 0', maxWidth: 620, fontFamily: 'Georgia, serif' }}>"{form.remarks}"</p>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'left' }}><p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: 'Arial, sans-serif' }}>Blockchain-verified · InterChain</p></div>
          <div style={{ textAlign: 'center', minWidth: 220 }}>
            <div style={{ borderTop: '2px solid #334155', paddingTop: 6 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, fontFamily: 'Arial, sans-serif' }}>{form.signatory_name || 'Signatory Name'}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontFamily: 'Arial, sans-serif' }}>{form.signatory_title || 'Title'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Approval ─────────────────────────────────────────────────────────────
function ApprovalTab({ onApprovalSaved }) {
  const [approvals, setApprovals] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const formRef = useRef(null)

  const load = async () => {
    try { const { data } = await fetchEmployerRecords(); setApprovals(data.approvals || []) } catch { /* silent */ }
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget).entries())
    const err = validateEmployerApproval(values)
    if (err) { showError('Invalid input', err); return }
    const ok = await confirmAction({ title: 'Approve internship completion?', text: 'This will save the completion approval.' })
    if (!ok) return
    try {
      await createEmployerApproval({ internship_id: values.internship_id, student_id: values.student_id, approval_date: values.approval_date, approved: values.approved === 'true', notes: values.notes || null })
      showSuccess('Approval saved', `${values.approved === 'true' ? 'Approved' : 'Not approved'} for student ${values.student_id}.`)
      formRef.current?.reset()
      setSelectedStudent(null)
      await load()
      onApprovalSaved?.()
    } catch (error) { showError('Could not save approval', extractError(error)) }
  }

  return (
    <div className="dashboard-stack">
      <form className="dashboard-card form-card single-form" onSubmit={submit} ref={formRef}>
        <h3>Completion Approval</h3>
        <InternshipSearchField name="internship_id" callerRole="employer" />
        <UserSearchField label="Student" role="student" callerRole="employer" name="student_id" placeholder="Search student by name or ID…" onChange={setSelectedStudent} />
        <label>Approval date<input name="approval_date" type="date" /></label>
        <label>Approval status
          <select name="approved" defaultValue="true"><option value="true">Approved</option><option value="false">Not approved</option></select>
        </label>
        <label>Notes<textarea name="notes" rows="5" placeholder="Optional approval notes" /></label>
        <button className="primary-button" type="submit">Save approval</button>
      </form>
      <div className="dashboard-card compact-card">
        <h3>Recent Approvals</h3>
        <div className="stack-list">
          {approvals.length === 0 ? <p className="muted">No records yet.</p>
            : approvals.map((r) => <div key={r.id} className="mini-card">{r.payload.student_id} • {r.payload.approved ? 'Approved' : 'Pending'}</div>)}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Certificate ──────────────────────────────────────────────────────────
const EMPTY = { recipient_name:'', recipient_email:'', recipient_role_id:'', recipient_type:'student', internship_title:'', company_name:'', company_address:'', signatory_name:'', signatory_title:'', start_date:'', end_date:'', remarks:'', send_email: true, override_hours: false }

function CertificateTab() {
  const { user } = useAuth()
  const [form, setForm] = useState({ ...EMPTY, company_name: user?.institution || '' })
  const [logoSrc, setLogoSrc] = useState(null)
  const [issuing, setIssuing] = useState(false)
  const [recipientResetKey, setRecipientResetKey] = useState(0)
  const [hoursInfo, setHoursInfo] = useState(null)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleLogo = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setLogoSrc(ev.target.result); reader.readAsDataURL(file) }

  // Check student hours when recipient changes
  useEffect(() => {
    if (form.recipient_role_id && form.recipient_type === 'student') {
      fetchStudentHours(form.recipient_role_id).then(({ data }) => setHoursInfo(data)).catch(() => setHoursInfo(null))
    } else { setHoursInfo(null) }
  }, [form.recipient_role_id, form.recipient_type])

  const captureCert = async () => {
    const el = document.getElementById('cert-hidden')
    return await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: CERT_W, height: CERT_H })
  }

  const downloadPDF = async () => {
    try { const canvas = await captureCert(); const img = canvas.toDataURL('image/png'); const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); pdf.addImage(img, 'PNG', 0, 0, 297, 210); pdf.save(`certificate-${form.recipient_role_id || 'draft'}.pdf`) }
    catch (err) { showError('PDF export failed', err.message) }
  }

  const handleIssue = async () => {
    const required = ['recipient_name','recipient_email','recipient_role_id','internship_title','company_name','signatory_name','signatory_title','start_date','end_date']
    for (const k of required) { if (!form[k]?.trim()) { showError('Missing field', `"${k.replace(/_/g,' ')}" is required`); return } }

    const certEl = document.getElementById('cert-hidden')
    const certHtml = certEl ? certEl.outerHTML : ''

    const ok = await confirmAction({
      title: 'Issue certificate?',
      text: `This will save to blockchain${form.send_email ? ' and send an email to ' + form.recipient_email : ''}.${form.override_hours ? ' (Hours check overridden)' : ''}`,
      confirmButtonText: 'Issue',
    })
    if (!ok) return

    setIssuing(true)
    try {
      const { data } = await issueCertificate({ ...form, send_email: Boolean(form.send_email), override_hours: Boolean(form.override_hours), company_logo_b64: logoSrc || null, cert_html: certHtml })
      showSuccess('Certificate issued', data.email_sent ? 'Email sent successfully.' : data.email_error ? `Saved (email error: ${data.email_error})` : 'Saved to blockchain.')
      setForm({ ...EMPTY, company_name: user?.institution || '' })
      setLogoSrc(null)
      setRecipientResetKey((k) => k + 1)
      setHoursInfo(null)
    } catch (err) { showError('Could not issue certificate', extractError(err)) }
    finally { setIssuing(false) }
  }

  const previewScale = 0.42

  return (
    <div className="dashboard-stack">
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}><CertLayout id="cert-hidden" form={form} logoSrc={logoSrc} /></div>

      {hoursInfo && (
        <div className="dashboard-card" style={{ borderLeft: `4px solid ${hoursInfo.validated_hours > 0 ? '#22c55e' : '#f59e0b'}` }}>
          <p className="eyebrow">Student Hours Check</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
            <div><span className="muted">Total Days:</span> <strong>{hoursInfo.total_days}</strong></div>
            <div><span className="muted">Total Hours:</span> <strong>{hoursInfo.total_hours}h</strong></div>
            <div><span className="muted">Validated Hours:</span> <strong style={{ color: '#22c55e' }}>{hoursInfo.validated_hours}h</strong></div>
            <div><span className="muted">Pending Hours:</span> <strong style={{ color: '#f59e0b' }}>{hoursInfo.pending_hours}h</strong></div>
          </div>
        </div>
      )}

      <div className="grid-two" style={{ alignItems: 'start' }}>
        <div className="dashboard-card form-card">
          <h3>Certificate Details</h3>
          <label>Recipient Type
            <select value={form.recipient_type} onChange={(e) => { set('recipient_type', e.target.value); set('recipient_role_id',''); set('recipient_name',''); set('recipient_email',''); setRecipientResetKey((k)=>k+1) }}>
              <option value="student">Student</option><option value="instructor">Instructor</option>
            </select>
          </label>
          <UserSearchField label="Recipient (search by name or ID) *" role={form.recipient_type} callerRole="employer" name="_recipient_search" placeholder={`Search ${form.recipient_type} by name or ID…`} resetKey={recipientResetKey}
            onChange={(u) => { if (u) { set('recipient_role_id', u.role_id); set('recipient_name', u.full_name); if (u.email) set('recipient_email', u.email) } else { set('recipient_role_id',''); set('recipient_name','') } }}
          />
          <label>Recipient Full Name *<input type="text" value={form.recipient_name} onChange={(e)=>set('recipient_name',e.target.value)} placeholder="Juan Dela Cruz" /></label>
          <label>Recipient Email *<input type="email" value={form.recipient_email} onChange={(e)=>set('recipient_email',e.target.value)} placeholder="juan@email.com" /></label>
          <label>Internship Title *<input type="text" value={form.internship_title} onChange={(e)=>set('internship_title',e.target.value)} placeholder="Software Development Internship" /></label>
          <label>Company Name *<input type="text" value={form.company_name} onChange={(e)=>set('company_name',e.target.value)} placeholder="Acme Corporation" /></label>
          <label>Company Address<input type="text" value={form.company_address} onChange={(e)=>set('company_address',e.target.value)} placeholder="123 Main St, City, Country" /></label>
          <label>Company Logo<input type="file" accept="image/*" onChange={handleLogo} /></label>
          <label>Start Date *<input type="date" value={form.start_date} onChange={(e)=>set('start_date',e.target.value)} /></label>
          <label>End Date *<input type="date" value={form.end_date} onChange={(e)=>set('end_date',e.target.value)} /></label>
          <label>Signatory Name *<input type="text" value={form.signatory_name} onChange={(e)=>set('signatory_name',e.target.value)} placeholder="Maria Santos" /></label>
          <label>Signatory Title *<input type="text" value={form.signatory_title} onChange={(e)=>set('signatory_title',e.target.value)} placeholder="HR Manager" /></label>
          <label>Remarks / Notes<textarea rows={3} value={form.remarks} onChange={(e)=>set('remarks',e.target.value)} placeholder="Outstanding performance." /></label>
          <label style={{ flexDirection:'row', alignItems:'center', gap:10, cursor:'pointer' }}>
            <input type="checkbox" checked={form.send_email} onChange={(e)=>set('send_email',e.target.checked)} style={{ width:18, height:18, minHeight:'unset' }} />
            Send certificate to recipient's email
          </label>
          <label style={{ flexDirection:'row', alignItems:'center', gap:10, cursor:'pointer' }}>
            <input type="checkbox" checked={form.override_hours} onChange={(e)=>set('override_hours',e.target.checked)} style={{ width:18, height:18, minHeight:'unset' }} />
            Override hours/approval check
          </label>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
            <button className="secondary-button" type="button" onClick={downloadPDF}>⬇ Download PDF</button>
            <button className="primary-button" type="button" onClick={handleIssue} disabled={issuing}>{issuing ? 'Issuing…' : '✦ Issue & Save to Blockchain'}</button>
          </div>
        </div>
        <div className="dashboard-card" style={{ overflow: 'hidden' }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Live Preview</p>
          <div style={{ width:'100%', height:Math.round(CERT_H*previewScale), overflow:'hidden', borderRadius:8, border:'1px solid rgba(148,163,184,0.15)' }}>
            <div style={{ transform:`scale(${previewScale})`, transformOrigin:'top left', width:CERT_W, height:CERT_H, pointerEvents:'none' }}>
              <CertLayout id="cert-preview" form={form} logoSrc={logoSrc} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: History ───────────────────────────────────────────────────────────────
function HistoryTab() {
  const [approvals, setApprovals] = useState([])
  const [certs, setCerts] = useState([])

  useEffect(() => {
    fetchEmployerHistory().then(({ data }) => setApprovals(data.approvals || [])).catch(() => {})
    fetchCertificates().then(({ data }) => setCerts(data.certificates || [])).catch(() => {})
  }, [])

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Completion Approvals ({approvals.length})</p>
        {approvals.length === 0 ? <p className="muted">No approvals yet.</p> : (
          <div className="users-table">{approvals.map((r) => (
            <div key={r.id} className="users-row">
              <div><strong>{r.payload.student_id}</strong><p className="muted" style={{ margin:0, fontSize:'0.8rem' }}>{r.payload.approved ? '✓ Approved' : '✕ Not approved'} · {r.payload.approval_date}</p></div>
              {r.blockchain?.tx_hash && <a href={r.blockchain.explorer_url} target="_blank" rel="noreferrer" style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--accent)' }}>{r.blockchain.tx_hash.slice(0,18)}…</a>}
            </div>
          ))}</div>
        )}
      </div>
      <div className="dashboard-card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Issued Certificates ({certs.length})</p>
        {certs.length === 0 ? <p className="muted">No certificates issued yet.</p> : (
          <div className="users-table">{certs.map((c) => (
            <div key={c.id} className="users-row">
              <div><strong>{c.payload.recipient_name}</strong><p className="muted" style={{ margin:0, fontSize:'0.8rem' }}>{c.payload.internship_title} · {c.payload.company_name}</p></div>
              <span className="role-chip">{c.payload.recipient_role_id}</span>
              <span className="muted" style={{ fontSize:'0.75rem' }}>{new Date(c.created_at).toLocaleDateString()}</span>
              {c.blockchain?.tx_hash && <a href={c.blockchain.explorer_url} target="_blank" rel="noreferrer" style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--accent)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }}>{c.blockchain.tx_hash.slice(0,18)}…</a>}
            </div>
          ))}</div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function CompletionPanel() {
  const [tab, setTab] = useState('approval')

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Employer</p>
        <h2>Completion & Certificates</h2>
        <p className="muted">Approve internship completion, issue blockchain-verified certificates, and view history — all in one place.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {[['approval','Approval'],['certificate','Certificate'],['history','History']].map(([k,l]) => (
            <button key={k} className={tab === k ? 'primary-button' : 'secondary-button'} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {tab === 'approval' && <ApprovalTab onApprovalSaved={() => {}} />}
      {tab === 'certificate' && <CertificateTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  )
}

export default function EmployerCompletionPage() {
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <DashboardShell links={EMPLOYER_LINKS}>
        <div className="page-shell dashboard-shell">
          <CompletionPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
