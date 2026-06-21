import ProtectedRoute from '../../components/ProtectedRoute'
import RoleDashboard from '../../components/RoleDashboard'
import RecordReviewPanel from '../../components/review/RecordReviewPanel'
import { fetchAdminDashboard } from '../../api/admin'
import { useEffect, useState } from 'react'
import { showError } from '../../utils/alerts'

function AdminOverview() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await fetchAdminDashboard()
        setSummary(data)
      } catch (error) {
        showError(error?.response?.data?.detail || 'Unable to load admin summary')
      }
    }

    loadSummary()
  }, [])

  return (
    <div className="dashboard-card admin-summary-card">
      <h3>School Admin Overview</h3>
      <p className="muted">Use this panel to monitor registered users and review blockchain-backed internship records.</p>
      <div className="summary-grid">
        {Object.entries(summary?.counts || {}).map(([label, value]) => (
          <div key={label} className="mini-card">
            <strong>{value}</strong>
            <span>{label.replaceAll('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <RoleDashboard role="admin" title="Admin Dashboard" description="Review records and blockchain transactions">
        <AdminOverview />
        <RecordReviewPanel />
      </RoleDashboard>
    </ProtectedRoute>
  )
}
