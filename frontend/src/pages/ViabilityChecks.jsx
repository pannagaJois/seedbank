import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import { FlaskConical, Plus, Search, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const RESULTS = ['all', 'pass', 'borderline', 'fail']

export default function ViabilityChecks() {
  const [items, setItems] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [resultFilter, setResultFilter] = useState('all')
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    batch_id: '',
    check_date: new Date().toISOString().split('T')[0],
    germination_rate_pct: 85,
    moisture_content_pct: 12,
    checked_by: 'Agronomist Lab 1',
    result: 'pass',
    action_taken: 'Batch approved for regular conservation'
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [vRes, bRes] = await Promise.all([
        api.get('/viability'),
        api.get('/batches').catch(() => ({ data: { data: [] } }))
      ])
      setItems(vRes.data?.data || [])
      const bList = bRes.data?.data || []
      setBatches(bList)
      if (bList.length > 0 && !form.batch_id) {
        setForm(f => ({ ...f, batch_id: bList[0].batch_id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return items.filter((item) => {
      const res = (item.result || '').toLowerCase()
      if (resultFilter !== 'all' && res !== resultFilter) return false
      if (!term) return true
      return (
        String(item.batch_id).includes(term) ||
        (item.checked_by || '').toLowerCase().includes(term) ||
        (item.action_taken || '').toLowerCase().includes(term)
      )
    })
  }, [items, q, resultFilter])

  async function handleCreateCheck(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/viability', form)
      setShowModal(false)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to record viability check')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Viability & Germination Checks</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Periodic laboratory germination assays, moisture content percentages, and quarantine actions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Viability Check</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by batch ID, tester, or action..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Result:</span>
          {RESULTS.map((res) => (
            <button
              key={res}
              onClick={() => setResultFilter(res)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition capitalize whitespace-nowrap cursor-pointer ${
                resultFilter === res
                  ? 'bg-[#D8F3DC] text-[#1B4332] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Viability Checks Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Check Date</th>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Germination Rate</th>
                <th className="py-3 px-4">Moisture Content</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Tester / Lab</th>
                <th className="py-3 px-4">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading viability records...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.check_id || `${item.batch_id}-${item.check_date}`} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {item.check_date ? item.check_date.slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <Link to={`/batches/${item.batch_id}`} className="text-[#2D6A4F] hover:underline font-bold">
                        #{item.batch_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {item.germination_rate_pct != null ? `${item.germination_rate_pct}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      {item.moisture_content_pct != null ? `${item.moisture_content_pct}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.result} />
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{item.checked_by || '—'}</td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">{item.action_taken || 'None'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No viability test records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Viability Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Seed Viability Test">
        <form onSubmit={handleCreateCheck} className="space-y-4">
          <div>
            <label className="form-label">Target Seed Batch *</label>
            <select
              value={form.batch_id}
              onChange={(e) => setForm({ ...form, batch_id: Number(e.target.value) })}
              className="form-select"
              required
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  Batch #{b.batch_id} — {b.common_name} ({b.remaining_kg} kg left)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Check Date *</label>
              <input
                type="date"
                required
                value={form.check_date}
                onChange={(e) => setForm({ ...form, check_date: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Tested By / Lab *</label>
              <input
                type="text"
                required
                value={form.checked_by}
                onChange={(e) => setForm({ ...form, checked_by: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Germination Rate (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={form.germination_rate_pct}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  let res = 'pass'
                  if (val < 65) res = 'fail'
                  else if (val < 80) res = 'borderline'
                  setForm({ ...form, germination_rate_pct: val, result: res })
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Moisture Content (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={form.moisture_content_pct}
                onChange={(e) => setForm({ ...form, moisture_content_pct: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Test Result</label>
            <select
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
              className="form-select"
            >
              <option value="pass">Pass (&gt;80% Germination)</option>
              <option value="borderline">Borderline (65-80% Germination)</option>
              <option value="fail">Fail (&lt;65% Germination)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Action Taken / Remarks</label>
            <textarea
              rows={2}
              value={form.action_taken}
              onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
              placeholder="e.g. Cleared for distribution or flagged for regeneration"
              className="form-input"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : 'Record Test Result'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
