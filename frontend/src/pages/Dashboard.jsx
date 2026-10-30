import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSummary, getRecentBatches, getExpiringSoon } from '../api/dashboard.api'
import StatCard from '../components/ui/StatCard'
import RecentBatchesTable from '../components/ui/RecentBatchesTable'
import ExpiringSoonList from '../components/ui/ExpiringSoonList'
import { 
  Package, 
  Leaf, 
  Truck, 
  Clock, 
  FlaskConical, 
  AlertTriangle,
  Plus,
  RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const [summary, setSummary] = useState({})
  const [batches, setBatches] = useState([])
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    try {
      const [s, rb, es] = await Promise.all([
        getSummary(),
        getRecentBatches(),
        getExpiringSoon()
      ])
      setSummary(s.data || {})
      setBatches(rb.data || [])
      setExpiring(es.data || [])
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const expiringCount = Number(summary.expiring_in_30_days || 0)
  const failedCount = Number(summary.failed_checks_90_days || 0)
  const anomaliesCount = Number(summary.anomalies_this_week || 0)

  return (
    <div className="space-y-6">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E9ECEF] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Agricultural Vault Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time genetic inventory tracking, cold storage conditions, and batch viability monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/varieties"
            className="px-3 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Variety</span>
          </Link>
          <Link
            to="/distributions"
            className="px-3 py-2 bg-[#52B788] hover:bg-[#40916C] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Distribute Seeds</span>
          </Link>
        </div>
      </div>

      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Active Batches"
          value={loading ? '...' : (summary.active_batches ?? 0)}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-[#2D6A4F]"
          subtitle="Batches in vault storage"
        />
        <StatCard
          label="Total Stock"
          value={loading ? '...' : `${Number(summary.total_remaining_kg || 0).toFixed(0)} kg`}
          icon={<Leaf className="w-5 h-5" />}
          iconBg="bg-teal-50 text-teal-700"
          subtitle="Conserved germplasm"
        />
        <StatCard
          label="Distributions"
          value={loading ? '...' : (summary.distributions_this_month ?? 0)}
          icon={<Truck className="w-5 h-5" />}
          iconBg="bg-sky-50 text-sky-700"
          subtitle="Dispatched this month"
        />
        <StatCard
          label="Expiring (30d)"
          value={loading ? '...' : expiringCount}
          icon={<Clock className="w-5 h-5" />}
          iconBg={expiringCount > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}
          variant={expiringCount > 0 ? 'alert' : undefined}
          subtitle={expiringCount > 0 ? "Requires regeneration" : "All batches safe"}
        />
        <StatCard
          label="Failed Checks"
          value={loading ? '...' : failedCount}
          icon={<FlaskConical className="w-5 h-5" />}
          iconBg={failedCount > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}
          variant={failedCount > 0 ? 'danger' : undefined}
          subtitle="Past 90 days tests"
        />
        <StatCard
          label="Anomalies"
          value={loading ? '...' : anomaliesCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg={anomaliesCount > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}
          variant={anomaliesCount > 0 ? 'alert' : undefined}
          subtitle="Storage deviations"
        />
      </div>

      {/* Row 2: Recent Batches (60%) & Expiring Soon (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentBatchesTable items={batches} />
        </div>
        <div>
          <ExpiringSoonList items={expiring} />
        </div>
      </div>
    </div>
  )
}
