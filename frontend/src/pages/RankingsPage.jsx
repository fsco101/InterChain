import { useEffect, useState } from 'react'
import { useSessionStorage } from '../hooks/useSessionStorage'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardShell from '../components/DashboardShell'
import AvatarBadge from '../components/AvatarBadge'
import { fetchGlobalRankings } from '../api/records'
import { showError } from '../utils/alerts'
import { STUDENT_LINKS, INSTRUCTOR_LINKS, SUPERVISOR_LINKS, ADMIN_LINKS } from '../utils/links'

function RankTable({ title, rows }) {
  if (!rows || rows.length === 0) return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <p className="muted">No evaluation data yet.</p>
    </div>
  )

  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 14 }}>{title}</h3>
      <div className="rank-table" style={{ overflowX: 'auto' }}>
        <div className="rank-header">
          <span>#</span><span>Student</span><span>Position</span><span>Company</span><span>School</span><span>Avg Score</span><span>Recent Feedback</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.student_id} className={`rank-row${i === 0 ? ' rank-first' : i === 1 ? ' rank-second' : i === 2 ? ' rank-third' : ''}`}>
            <span className="rank-pos">{r.rank}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to={`/profile/${r.user_id || r.student_id}`} style={{ flexShrink: 0, display: 'block' }}>
                <AvatarBadge name={r.full_name} avatarUrl={r.avatar_url} size={28} />
              </Link>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <Link to={`/profile/${r.user_id || r.student_id}`} style={{ textDecoration: 'none' }}>
                  <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{r.full_name}</span>
                </Link>
                <span className="muted" style={{ display: 'block', fontSize: '0.72rem' }}>{r.student_id}</span>
              </div>
            </span>
            <span>{r.ojt_position || '—'}</span>
            <span>{r.company || '—'}</span>
            <span>{r.institution || '—'}</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{r.avg_score}/10</span>
            <span style={{ fontSize: '0.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} title={r.recent_feedback}>
              <span className="muted" style={{ fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.recent_feedback ? `"${r.recent_feedback}"` : '—'}
              </span>
              {r.recent_supervisor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AvatarBadge name={r.recent_supervisor.full_name} avatarUrl={r.recent_supervisor.avatar_url} size={16} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.recent_supervisor.full_name}
                  </span>
                </div>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GlobalRankingsPanel() {
  const [data, setData] = useState({ overall: [] })
  const [startDate, setStartDate] = useSessionStorage('rank-start', '')
  const [endDate, setEndDate] = useSessionStorage('rank-end', '')
  const [companyFilter, setCompanyFilter] = useSessionStorage('rank-company', 'all')
  const [institutionFilter, setInstitutionFilter] = useSessionStorage('rank-inst', 'all')
  const [positionFilter, setPositionFilter] = useSessionStorage('rank-pos', 'all')

  useEffect(() => {
    fetchGlobalRankings({ start_date: startDate || undefined, end_date: endDate || undefined })
      .then(({ data }) => setData(data))
      .catch(() => showError('Failed to load global rankings'))
  }, [startDate, endDate])

  const companies = Array.from(new Set(data.overall.map(r => r.company).filter(Boolean))).sort()
  const institutions = Array.from(new Set(data.overall.map(r => r.institution).filter(Boolean))).sort()
  const positions = Array.from(new Set(data.overall.map(r => r.ojt_position).filter(Boolean))).sort()

  const filteredOverall = data.overall
    .filter(r => companyFilter === 'all' || r.company === companyFilter)
    .filter(r => institutionFilter === 'all' || r.institution === institutionFilter)
    .filter(r => positionFilter === 'all' || r.ojt_position === positionFilter)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">System-Wide</p>
        <h2>Global Rankings</h2>
        <p className="muted">See how students rank across all companies, institutions, and positions based on supervisor evaluations.</p>
        
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Start Date
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
            End Date
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }} />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Institution
            <select value={institutionFilter} onChange={e => setInstitutionFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}>
              <option value="all">All Institutions</option>
              {institutions.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Company
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}>
              <option value="all">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Position
            <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}>
              <option value="all">All Positions</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </div>

      <RankTable title="Top Students" rows={filteredOverall} />
    </div>
  )
}

export default function RankingsPage() {
  const { user } = useAuth()
  
  let links = []
  if (user?.role === 'student') links = STUDENT_LINKS
  else if (user?.role === 'instructor') links = INSTRUCTOR_LINKS
  else if (user?.role === 'supervisor') links = SUPERVISOR_LINKS
  else if (user?.role === 'admin') links = ADMIN_LINKS

  return (
    <ProtectedRoute allowedRoles={['student', 'instructor', 'supervisor', 'admin']}>
      <DashboardShell links={links}>
        <div className="page-shell dashboard-shell">
          <GlobalRankingsPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
