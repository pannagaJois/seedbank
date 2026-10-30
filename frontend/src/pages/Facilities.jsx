import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import Modal from '../components/ui/Modal'
import { Warehouse, Plus, Thermometer, Droplets, ArrowRight, ShieldCheck, MapPin } from 'lucide-react'

export default function Facilities() {
  const [facilities, setFacilities] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    facility_name: '',
    location: '',
    capacity_kg: 2000,
    facility_type: 'cold_storage',
    current_temp_c: 4.0,
    current_humidity_pct: 35.0
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [fRes, bRes] = await Promise.all([
        api.get('/facilities'),
        api.get('/batches').catch(() => ({ data: { data: [] } }))
      ])
      setFacilities(fRes.data?.data || [])
      setBatches(bRes.data?.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/facilities', form)
      setShowModal(false)
      setForm({
        facility_name: '',
        location: '',
        capacity_kg: 2000,
        facility_type: 'cold_storage',
        current_temp_c: 4.0,
        current_humidity_pct: 35.0
      })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add facility')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Storage Facilities & Vaults</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Atmospheric control zones, refrigeration chambers, and germplasm capacity utilization.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Storage Facility</span>
        </button>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="card text-center py-12 text-gray-500">
          <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs">Loading facilities...</span>
        </div>
      ) : facilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((f) => {
            // Count stored batches in this facility
            const facilityBatches = batches.filter(b => b.facility_id === f.facility_id)
            const storedKg = facilityBatches.reduce((acc, b) => acc + Number(b.remaining_kg || 0), 0)
            const capacity = Number(f.capacity_kg || 1000)
            const utilPct = Math.min(100, Math.round((storedKg / capacity) * 100))

            // Bar color logic: <70% green, 70-90% amber, >90% red
            let barColor = 'bg-[#40916C]'
            let barText = 'text-[#1B4332]'
            if (utilPct > 90) {
              barColor = 'bg-[#E76F51]'
              barText = 'text-[#9B2335]'
            } else if (utilPct >= 70) {
              barColor = 'bg-[#F4A261]'
              barText = 'text-[#7D5A00]'
            }

            return (
              <div key={f.facility_id} className="card hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                        <Warehouse className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 leading-snug">{f.facility_name}</h3>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{f.location || 'Local Campus'}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider">
                      {f.facility_type ? f.facility_type.replace('_', ' ') : 'Vault'}
                    </span>
                  </div>

                  {/* Conditions Pills */}
                  <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Temperature</div>
                        <div className="font-bold text-gray-800">{f.current_temp_c != null ? `${f.current_temp_c}°C` : '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Humidity</div>
                        <div className="font-bold text-gray-800">{f.current_humidity_pct != null ? `${f.current_humidity_pct}%` : '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Capacity Utilization</span>
                      <span className={`font-bold ${barText}`}>{utilPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${utilPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{facilityBatches.length} batches stored</span>
                      <span>{storedKg.toFixed(0)} / {capacity} kg</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end">
                  <Link
                    to={`/facilities/${f.facility_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332]"
                  >
                    <span>View Facility Vault</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400 text-xs">
          No storage facilities configured
        </div>
      )}

      {/* Add Facility Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register Storage Facility">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">Facility Name *</label>
            <input
              type="text"
              required
              value={form.facility_name}
              onChange={(e) => setForm({ ...form, facility_name: e.target.value })}
              placeholder="e.g. Cryogenic Vault B"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Location / Building *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Sub-basement Wing 3"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Facility Type</label>
              <select
                value={form.facility_type}
                onChange={(e) => setForm({ ...form, facility_type: e.target.value })}
                className="form-select"
              >
                <option value="cold_storage">Cold Storage (4°C)</option>
                <option value="cryo">Cryogenic Vault (-20°C)</option>
                <option value="ambient">Ambient Seed Bank</option>
                <option value="quarantine">Quarantine Isolation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Capacity (kg) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.capacity_kg}
                onChange={(e) => setForm({ ...form, capacity_kg: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Target Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={form.current_temp_c}
                onChange={(e) => setForm({ ...form, current_temp_c: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Target Hum. (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.current_humidity_pct}
                onChange={(e) => setForm({ ...form, current_humidity_pct: Number(e.target.value) })}
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
              {submitting ? 'Registering...' : 'Save Facility'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
