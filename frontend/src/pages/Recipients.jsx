import React, { useEffect, useState, useMemo } from 'react'
import api from '../api/axiosInstance'
import Modal from '../components/ui/Modal'
import { Users, Plus, Search, Mail, Phone, MapPin } from 'lucide-react'

export default function Recipients() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    recipient_name: '',
    recipient_type: 'individual_farmer',
    region: '',
    contact_phone: '',
    contact_email: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/recipients')
      setItems(res.data?.data || [])
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
    return items.filter((r) => {
      const name = r.recipient_name || r.name || ''
      if (!term) return true
      return (
        name.toLowerCase().includes(term) ||
        (r.region || '').toLowerCase().includes(term) ||
        (r.recipient_type || '').toLowerCase().includes(term) ||
        (r.contact_email || '').toLowerCase().includes(term)
      )
    })
  }, [items, q])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/recipients', form)
      setShowModal(false)
      setForm({
        recipient_name: '',
        recipient_type: 'individual_farmer',
        region: '',
        contact_phone: '',
        contact_email: ''
      })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add recipient')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recipients & Seed Partners</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Directory of farming cooperatives, agronomy researchers, and seed banks receiving material.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recipient</span>
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
            placeholder="Search by recipient name, region, or email..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
      </div>

      {/* Recipients Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Recipient Name</th>
                <th className="py-3 px-4">Organization Type</th>
                <th className="py-3 px-4">Region / Location</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Email Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading partners...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.recipient_id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {r.recipient_name || r.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-800 capitalize">
                        {(r.recipient_type || 'farmer').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{r.region || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono">
                      {r.contact_phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {r.contact_email ? (
                        <a href={`mailto:${r.contact_email}`} className="text-[#2D6A4F] hover:underline">
                          {r.contact_email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No recipients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Recipient Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register Seed Recipient">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">Recipient / Entity Name *</label>
            <input
              type="text"
              required
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="e.g. Kaveri Organic Farmers Collective"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Recipient Type *</label>
              <select
                value={form.recipient_type}
                onChange={(e) => setForm({ ...form, recipient_type: e.target.value })}
                className="form-select"
              >
                <option value="individual_farmer">Individual Farmer</option>
                <option value="cooperative">Farmer Cooperative</option>
                <option value="research_institute">Research Institute / Univ</option>
                <option value="ngo">Conservation NGO</option>
              </select>
            </div>
            <div>
              <label className="form-label">Region / State *</label>
              <input
                type="text"
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="e.g. Karnataka, India"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="partner@example.org"
                className="form-input"
              />
            </div>
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
              {submitting ? 'Registering...' : 'Save Recipient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
