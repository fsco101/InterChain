import { useEffect, useMemo, useState } from 'react'

import { fetchAdminReview } from '../../api/admin'
import { confirmAction, showError, showInfo, showSuccess } from '../../utils/alerts'

function ReviewCard({ record }) {
  const blockchain = record.blockchain || {}

  return (
    <div className="review-card">
      <div className="review-card-head">
        <div>
          <p className="review-label">{record.collection}</p>
          <h3>{record.record_type}</h3>
        </div>
        <span className={`review-status ${blockchain.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>
          {blockchain.status || 'pending'}
        </span>
      </div>

      <p className="muted">Submitted by {record.user_name || record.user_id} on {new Date(record.created_at).toLocaleString()}</p>
      <pre className="review-payload">{JSON.stringify(record.payload, null, 2)}</pre>
      <div className="review-blockchain">
        <span>{blockchain.network || 'unknown network'}</span>
        <span>{blockchain.tx_hash || 'no tx hash'}</span>
      </div>
    </div>
  )
}

export default function RecordReviewPanel() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadReview = async () => {
      try {
        const { data } = await fetchAdminReview()
        setRecords(data.records || [])
      } catch (error) {
        showError(error?.response?.data?.detail || 'Unable to load review data')
      }
    }

    loadReview()
  }, [])

  const filteredRecords = useMemo(() => {
    let result = records

    if (filter !== 'all') {
      result = result.filter((record) => record.collection === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((record) => {
        return (
          (record.user_name || '').toLowerCase().includes(q) ||
          (record.user_id || '').toLowerCase().includes(q) ||
          (record.record_type || '').toLowerCase().includes(q) ||
          (record.blockchain?.tx_hash || '').toLowerCase().includes(q) ||
          JSON.stringify(record.payload).toLowerCase().includes(q)
        )
      })
    }

    return result
  }, [filter, search, records])

  const copyTip = async () => {
    const confirmed = await confirmAction({
      title: 'Copy blockchain note?',
      text: 'This will show a confirmation toast for the current filter state.',
      confirmButtonText: 'Continue',
    })

    if (confirmed) {
      showInfo(`Viewing ${filteredRecords.length} records`)
      showSuccess('Review panel ready')
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="review-toolbar">
        <label>
          Filter by collection
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All records</option>
            <option value="activity_logs">Activity logs</option>
            <option value="student_reports">Student reports</option>
            <option value="attendance_records">Attendance</option>
            <option value="performance_evaluations">Evaluations</option>
            <option value="completion_approvals">Approvals</option>
          </select>
        </label>
        <label style={{ flex: 1, marginLeft: 12, marginRight: 12 }}>
          Search Records
          <input 
            type="text" 
            placeholder="Search by name, ID, payload, or hash..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.5)', color: 'var(--text)', outline: 'none' }}
          />
        </label>
        <button className="secondary-button" onClick={copyTip} type="button" style={{ alignSelf: 'flex-end', padding: '9px 16px' }}>
          Review status
        </button>
      </div>

      <div className="review-grid">
        {filteredRecords.length === 0 ? <div className="dashboard-card">No records found.</div> : filteredRecords.map((record) => <ReviewCard key={record.id} record={record} />)}
      </div>
    </div>
  )
}
