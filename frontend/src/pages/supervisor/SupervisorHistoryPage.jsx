import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import DashboardShell from '../../components/DashboardShell'
import HistoryPanel from '../../components/HistoryPanel'
import {
  fetchSupervisorHistory, fetchSupervisorEvaluationsHistory,
  deleteSupervisorApproval, bulkDeleteSupervisorApproval,
  deleteSupervisorEvaluation, bulkDeleteSupervisorEvaluation
} from '../../api/records'
import { showError } from '../../utils/alerts'
import { SUPERVISOR_LINKS } from '../../utils/links'

function SupervisorHistoryContent() {
  const [approvals, setApprovals] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [histRes, evalRes] = await Promise.all([
        fetchSupervisorHistory(),
        fetchSupervisorEvaluationsHistory()
      ])
      setApprovals(histRes.data.approvals || [])
      setEvaluations(evalRes.data.evaluations || [])
    } catch { showError('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const removeApproval = async (id) => { await deleteSupervisorApproval(id); setApprovals((p) => p.filter((r) => r.id !== id)) }
  const removeBulkApproval = async (ids) => { await bulkDeleteSupervisorApproval(ids); setApprovals((p) => p.filter((r) => !ids.includes(r.id))) }
  const removeEvaluation = async (id) => { await deleteSupervisorEvaluation(id); setEvaluations((p) => p.filter((r) => r.id !== id)) }
  const removeBulkEvaluation = async (ids) => { await bulkDeleteSupervisorEvaluation(ids); setEvaluations((p) => p.filter((r) => !ids.includes(r.id))) }

  return (
    <DashboardShell links={SUPERVISOR_LINKS}>
      <div className="page-shell dashboard-shell">
        <div className="dashboard-topbar">
          <div><p className="eyebrow">Supervisor</p><h2>History</h2></div>
        </div>
        <div className="dashboard-stack">
          <HistoryPanel title="Completion Approvals" records={approvals} loading={loading} onDelete={removeApproval} onBulkDelete={removeBulkApproval} />
          <HistoryPanel title="Evaluations" records={evaluations} loading={loading} onDelete={removeEvaluation} onBulkDelete={removeBulkEvaluation} />
        </div>
      </div>
    </DashboardShell>
  )
}

export default function SupervisorHistoryPage() {
  return <ProtectedRoute allowedRoles={['supervisor']}><SupervisorHistoryContent /></ProtectedRoute>
}
