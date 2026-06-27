import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import AvatarBadge from '../../components/AvatarBadge'
import { fetchInstructorRankings } from '../../api/records'
import { showError } from '../../utils/alerts'
import { INSTRUCTOR_LINKS } from '../../utils/links'

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
      <div className="rank-table">
        <div className="rank-header">
          <span>#</span><span>Student</span><span>Position</span><span>School</span><span>Avg Score</span><span>Evals</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.student_id} className={`rank-row${i === 0 ? ' rank-first' : i === 1 ? ' rank-second' : i === 2 ? ' rank-third' : ''}`}>
            <span className="rank-pos">{r.rank}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to={`/profile/${r.user_id || r.student_id}`} style={{ flexShrink: 0, display: 'block' }}>
                <AvatarBadge name={r.full_name} avatarUrl={r.avatar_url} size={28} />
              </Link>
              <div>
                <Link to={`/profile/${r.user_id || r.student_id}`} style={{ textDecoration: 'none' }}>
                  <span>{r.full_name}</span>
                </Link>
                <span className="muted" style={{ display: 'block', fontSize: '0.72rem' }}>{r.student_id}</span>
              </div>
            </span>
            <span>{r.ojt_position || '—'}</span>
            <span>{r.institution || '—'}</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{r.avg_score}/10</span>
            <span>{r.eval_count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InstructorRankingsPanel() {
  const [data, setData] = useState({ overall: [], by_position: {} })
  const [view, setView] = useState('overall')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchInstructorRankings(startDate, endDate)
      .then(({ data }) => setData(data))
      .catch(() => showError('Failed to load rankings'))
  }, [startDate, endDate])

  return (
    <div className="dashboard-stack">
      <div className="dashboard-card">
        <p className="eyebrow">Instructor</p>
        <h2>Student Rankings</h2>
        <p className="muted">View how your students rank based on supervisor evaluations. Filter by date range to see performance in a specific period.</p>
        
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
              Start Date
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--muted)' }}>
              End Date
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }} />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[['overall', 'Overall'], ['position', 'By Position']].map(([k, l]) => (
            <button key={k} className={view === k ? 'primary-button' : 'secondary-button'} onClick={() => setView(k)}>{l}</button>
          ))}
        </div>
      </div>

      {view === 'overall' && <RankTable title="Overall Rankings" rows={data.overall} />}

      {view === 'position' && (
        !data.by_position || Object.keys(data.by_position).length === 0
          ? <div className="dashboard-card"><p className="muted">No position-based ranking data yet.</p></div>
          : Object.entries(data.by_position).map(([pos, rows]) => <RankTable key={pos} title={`💼 ${pos}`} rows={rows} />)
      )}
    </div>
  )
}

export default function InstructorRankingsPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <DashboardShell links={INSTRUCTOR_LINKS}>
        <div className="page-shell dashboard-shell">
          <InstructorRankingsPanel />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
