import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react'

export default function ExpiringSoonList({ items }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#F4A261]" />
          <h2 className="text-base font-bold text-gray-900">Expiring Soon</h2>
        </div>
        <span className="text-[11px] font-semibold text-gray-400">Next 30 Days</span>
      </div>

      <div className="space-y-2.5">
        {items && items.length > 0 ? (
          items.map((i) => {
            const days = i.days_until_expiry ?? 0
            const isCritical = days <= 15

            return (
              <div
                key={i.batch_id}
                className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/batches/${i.batch_id}`}
                    className="font-semibold text-xs text-gray-900 hover:text-[#2D6A4F] truncate block"
                  >
                    {i.common_name} <span className="font-mono text-gray-400 font-normal">#{i.batch_id}</span>
                  </Link>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {i.facility_name} • {Number(i.remaining_kg || 0).toFixed(1)} kg left
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      isCritical
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {days} {days === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center text-gray-400">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              ✓
            </div>
            <p className="text-xs font-medium text-gray-600">All batches are healthy</p>
            <p className="text-[11px] text-gray-400 mt-0.5">No batches expiring within 30 days</p>
          </div>
        )}
      </div>
    </div>
  )
}
