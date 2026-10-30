import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import Modal from '../components/ui/Modal'
import { Truck, Plus, Search, Calendar, User, Package, AlertCircle } from 'lucide-react'

export default function Distributions() {
  const [rows, setRows] = useState([])
  const [batches, setBatches] = useState([])
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    batch_id: '',
    recipient_id: '',
    distribution_date: new Date().toISOString().split('T')[0],
    quantity_kg: 5,
    purpose: 'cultivation',
    distributed_by: 'Vault Dispatch',
    remarks: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [dRes, bRes, rRes] = await Promise.all([
        api.get('/distributions'),
        api.get('/batches').catch(() => ({ data: { data: [] } })),
        api.get('/recipients').catch(() => ({ data: { data: [] } }))
      ])
      setRows(dRes.data?.data || [])
      const bList = bRes.data?.data || []
      const rList = rRes.data?.data || []
      setBatches(bList)
      setRecipients(rList)
      if (bList.length > 0 && !form.batch_id) {
        setForm(f => ({ ...f, batch_id: bList[0].batch_id }))
      }
      if (rList.length > 0 && !form.recipient_id) {
        setForm(f => ({ ...f, recipient_id: rList[0].recipient_id }))
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
    return rows.filter((r) => {
      if (!term) return true
      return (
        String(r.distribution_id).includes(term) ||
        (r.seed_variety || r.common_name || '').toLowerCase().includes(term) ||
        (r.recipient_name || '').toLowerCase().includes(term) ||
        (r.purpose || '').toLowerCase().includes(term) ||
        String(r.batch_id).includes(term)
      )
    })
  }, [rows, q])

  // Selected batch remaining stock helper
  const selectedBatch = batches.find(b => String(b.batch_id) === String(form.batch_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/distributions', form)
      setShowModal(false)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to log distribution')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Distribution Records</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Outbound germplasm distribution to local farmers, research institutions, and community seed savers.
          </p>
        </div>
        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Distribution</span>
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
            placeholder="Search by recipient, seed variety, or batch ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
      </div>

      {/* Distributions Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Distribution Date</th>
                <th className="py-3 px-4">Seed Variety</th>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Quantity (kg)</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4 text-right">Distributed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading distribution history...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.distribution_id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {r.distribution_date ? r.distribution_date.slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {r.seed_variety || r.common_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <Link to={`/batches/${r.batch_id}`} className="text-[#2D6A4F] hover:underline font-bold">
                        #{r.batch_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-gray-900 font-medium">
                      {r.recipient_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#2D6A4F]">
                      {Number(r.quantity_kg || 0).toFixed(1)} kg
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 capitalize">
                        {r.purpose || 'cultivation'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-right">
                      {r.distributed_by || 'Staff'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No distributions recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Distribution Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Seed Distribution">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="form-label">Seed Batch to Distribute *</label>
            <select
              value={form.batch_id}
              onChange={(e) => setForm({ ...form, batch_id: Number(e.target.value) })}
              className="form-select"
              required
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  Batch #{b.batch_id} — {b.common_name} (Remaining: {Number(b.remaining_kg || 0).toFixed(1)} kg)
                </option>
              ))}
            </select>
            {selectedBatch && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                Available stock: <strong>{Number(selectedBatch.remaining_kg || 0).toFixed(1)} kg</strong>
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Recipient *</label>
            <select
              value={form.recipient_id}
              onChange={(e) => setForm({ ...form, recipient_id: Number(e.target.value) })}
              className="form-select"
              required
            >
              {recipients.map((r) => (
                <option key={r.recipient_id} value={r.recipient_id}>
                  {r.name} ({r.recipient_type || 'Farmer'}) — {r.region || 'Local'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Distribution Date *</label>
              <input
                type="date"
                required
                value={form.distribution_date}
                onChange={(e) => setForm({ ...form, distribution_date: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Quantity (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={form.quantity_kg}
                onChange={(e) => setForm({ ...form, quantity_kg: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Purpose *</label>
              <select
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="form-select"
              >
                <option value="cultivation">Cultivation / Farming</option>
                <option value="research">Research & Breeding</option>
                <option value="community_sharing">Community Sharing</option>
                <option value="emergency_relief">Emergency Relief</option>
              </select>
            </div>
            <div>
              <label className="form-label">Distributed By *</label>
              <input
                type="text"
                required
                value={form.distributed_by}
                onChange={(e) => setForm({ ...form, distributed_by: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Remarks / Dispatch Notes</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. Dispatched for monsoon seasonal sowing"
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
              {submitting ? 'Logging...' : 'Confirm Distribution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
