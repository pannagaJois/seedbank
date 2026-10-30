import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import Modal from '../components/ui/Modal'
import { Leaf, Plus, Search, Filter, ArrowRight, Eye, Thermometer, Droplets } from 'lucide-react'

const CROP_TYPES = ['all', 'cereal', 'millets', 'pulses', 'vegetable', 'oilseed']

export default function Varieties() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [cropFilter, setCropFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    common_name: '',
    scientific_name: '',
    crop_type: 'cereal',
    origin_region: '',
    genetic_traits: '',
    viability_days: 365,
    optimal_temp_c: 15,
    optimal_humidity_pct: 45
  })

  const loadVarieties = async () => {
    try {
      setLoading(true)
      const res = await api.get('/varieties')
      setItems(res.data?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load varieties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVarieties()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return items.filter((v) => {
      if (cropFilter !== 'all' && (v.crop_type || '').toLowerCase() !== cropFilter) {
        return false
      }
      if (!term) return true
      return (
        (v.common_name || '').toLowerCase().includes(term) ||
        (v.scientific_name || '').toLowerCase().includes(term) ||
        (v.origin_region || '').toLowerCase().includes(term) ||
        (v.crop_type || '').toLowerCase().includes(term)
      )
    })
  }, [items, q, cropFilter])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/varieties', form)
      setShowModal(false)
      setForm({
        common_name: '',
        scientific_name: '',
        crop_type: 'cereal',
        origin_region: '',
        genetic_traits: '',
        viability_days: 365,
        optimal_temp_c: 15,
        optimal_humidity_pct: 45
      })
      await loadVarieties()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create variety')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Seed Varieties & Genetics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Catalog of conserved crop accessions, origin regions, and physiological storage parameters.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Seed Variety</span>
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
            placeholder="Search by variety name, scientific name, or region..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>

        {/* Crop Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Crop:</span>
          {CROP_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setCropFilter(type)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition capitalize whitespace-nowrap cursor-pointer ${
                cropFilter === type
                  ? 'bg-[#D8F3DC] text-[#1B4332] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Varieties Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Common Name</th>
                <th className="py-3 px-4">Scientific Name</th>
                <th className="py-3 px-4">Crop Type</th>
                <th className="py-3 px-4">Origin Region</th>
                <th className="py-3 px-4">Viability</th>
                <th className="py-3 px-4">Optimal Temp / Humidity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading germplasm catalog...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((v) => (
                  <tr key={v.variety_id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/varieties/${v.variety_id}`}
                        className="font-bold text-gray-900 hover:text-[#2D6A4F] flex items-center gap-2"
                      >
                        <Leaf className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        <span>{v.common_name}</span>
                      </Link>
                      {v.genetic_traits && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{v.genetic_traits}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 italic text-gray-600 font-serif">{v.scientific_name || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-[#2D6A4F] uppercase tracking-wider">
                        {v.crop_type || 'cereal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{v.origin_region || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{v.viability_days} days</td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                          {v.optimal_temp_c}°C
                        </span>
                        <span className="flex items-center gap-1 text-gray-700">
                          <Droplets className="w-3.5 h-3.5 text-teal-500" />
                          {v.optimal_humidity_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/varieties/${v.variety_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2D6A4F] hover:bg-[#D8F3DC] rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No matching varieties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Variety Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register New Seed Variety">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">Common Name *</label>
            <input
              type="text"
              required
              value={form.common_name}
              onChange={(e) => setForm({ ...form, common_name: e.target.value })}
              placeholder="e.g. Navara Red Rice"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Scientific Name</label>
              <input
                type="text"
                value={form.scientific_name}
                onChange={(e) => setForm({ ...form, scientific_name: e.target.value })}
                placeholder="e.g. Oryza sativa"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Crop Type</label>
              <select
                value={form.crop_type}
                onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                className="form-select"
              >
                <option value="cereal">Cereal</option>
                <option value="millets">Millets</option>
                <option value="pulses">Pulses</option>
                <option value="vegetable">Vegetable</option>
                <option value="oilseed">Oilseed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Origin Region / Indigenous Source</label>
            <input
              type="text"
              value={form.origin_region}
              onChange={(e) => setForm({ ...form, origin_region: e.target.value })}
              placeholder="e.g. Palakkad, Kerala, India"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Key Genetic Traits</label>
            <textarea
              rows={2}
              value={form.genetic_traits}
              onChange={(e) => setForm({ ...form, genetic_traits: e.target.value })}
              placeholder="e.g. Drought-tolerant, high iron & zinc content, pest-hardy"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Viability (Days)</label>
              <input
                type="number"
                value={form.viability_days}
                onChange={(e) => setForm({ ...form, viability_days: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Opt. Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={form.optimal_temp_c}
                onChange={(e) => setForm({ ...form, optimal_temp_c: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Opt. Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.optimal_humidity_pct}
                onChange={(e) => setForm({ ...form, optimal_humidity_pct: Number(e.target.value) })}
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
              {submitting ? 'Registering...' : 'Save Variety'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
