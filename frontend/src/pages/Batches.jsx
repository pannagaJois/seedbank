import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import { Package, Plus, Search, Eye, Clock, Calendar } from 'lucide-react'

const STATUS_TABS = ['all', 'active', 'expired', 'distributed', 'quarantine']

export default function Batches() {
  const [rows, setRows] = useState([])
  const [varieties, setVarieties] = useState([])
  const [facilities, setFacilities] = useState([])
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    variety_id: '',
    contributor_id: 1,
    facility_id: 1,
    collection_date: new Date().toISOString().split('T')[0],
    quantity_kg: 50,
    notes: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [bRes, vRes, fRes, cRes] = await Promise.all([
        api.get('/batches'),
        api.get('/varieties').catch(() => ({ data: { data: [] } })),
        api.get('/facilities').catch(() => ({ data: { data: [] } })),
        api.get('/contributors').catch(() => ({ data: { data: [] } }))
      ])
      setRows(bRes.data?.data || [])
      setVarieties(vRes.data?.data || [])
      setFacilities(fRes.data?.data || [])
      setContributors(cRes.data?.data || [])
      if (vRes.data?.data?.length > 0 && !form.variety_id) {
        setForm(f => ({ ...f, variety_id: vRes.data.data[0].variety_id }))
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
      const bStatus = (r.batch_status || r.status || '').toLowerCase()
      if (status !== 'all' && bStatus !== status) return false
      if (!term) return true
      return (
        String(r.batch_id).includes(term) ||
        (r.common_name || '').toLowerCase().includes(term) ||
        (r.facility_name || '').toLowerCase().includes(term)
      )
    })
  }, [rows, q, status])

  async function handleCreateBatch(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/batches', form)
      setShowModal(false)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create batch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Seed Batches & Inventory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Physical seed lots under active refrigeration, remaining inventory, and viability schedules.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Batch</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by batch ID, variety name, or facility..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition capitalize whitespace-nowrap cursor-pointer ${
                status === tab
                  ? 'bg-[#D8F3DC] text-[#1B4332] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Variety</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Collection Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Remaining (kg)</th>
                <th className="py-3 px-4">Germination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading batches...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((b) => {
                  const bStatus = b.batch_status || b.status || 'active'
                  const expiryDate = b.expiry_date ? new Date(b.expiry_date) : null
                  const isExpiringSoon = expiryDate && (expiryDate - new Date()) / (1000 * 60 * 60 * 24) < 30

                  return (
                    <tr key={b.batch_id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                        <Link to={`/batches/${b.batch_id}`} className="text-[#2D6A4F] hover:underline font-bold">
                          #{b.batch_id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{b.common_name || '—'}</div>
                        <div className="text-[11px] text-gray-400 capitalize">{b.crop_type || ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">{b.facility_name || 'Main Vault'}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {b.collection_date ? b.collection_date.slice(0, 10) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-medium ${
                            isExpiringSoon ? 'text-amber-700 font-bold' : 'text-gray-700'
                          }`}
                        >
                          {b.expiry_date ? b.expiry_date.slice(0, 10) : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {Number(b.remaining_kg || 0).toFixed(1)} kg
                      </td>
                      <td className="py-3.5 px-4">
                        {b.germination_rate_pct != null ? (
                          <span className="font-semibold text-gray-900">{b.germination_rate_pct}%</span>
                        ) : (
                          <span className="text-gray-400 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={bStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/batches/${b.batch_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2D6A4F] hover:bg-[#D8F3DC] rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No batches found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Incoming Seed Batch">
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="form-label">Seed Variety *</label>
            <select
              value={form.variety_id}
              onChange={(e) => setForm({ ...form, variety_id: Number(e.target.value) })}
              className="form-select"
              required
            >
              {varieties.map((v) => (
                <option key={v.variety_id} value={v.variety_id}>
                  {v.common_name} ({v.crop_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Storage Facility *</label>
              <select
                value={form.facility_id}
                onChange={(e) => setForm({ ...form, facility_id: Number(e.target.value) })}
                className="form-select"
                required
              >
                {facilities.length > 0 ? (
                  facilities.map((f) => (
                    <option key={f.facility_id} value={f.facility_id}>
                      {f.facility_name}
                    </option>
                  ))
                ) : (
                  <option value={1}>Main Cold Vault</option>
                )}
              </select>
            </div>

            <div>
              <label className="form-label">Quantity Received (kg) *</label>
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

          <div>
            <label className="form-label">Collection Date *</label>
            <input
              type="date"
              required
              value={form.collection_date}
              onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Collection / Accession Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Harvested from farmer cooperative in Mandya district"
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
              {submitting ? 'Creating...' : 'Register Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
