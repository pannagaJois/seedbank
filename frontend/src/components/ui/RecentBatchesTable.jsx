import React from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Package, ArrowRight } from 'lucide-react'

export default function RecentBatchesTable({ items }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#2D6A4F]" />
          <h2 className="text-base font-bold text-gray-900">Recent Batches</h2>
        </div>
        <Link to="/batches" className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-1">
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <th className="py-2.5 px-3">Batch ID</th>
              <th className="py-2.5 px-3">Variety</th>
              <th className="py-2.5 px-3">Facility</th>
              <th className="py-2.5 px-3">Remaining</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {items && items.length > 0 ? (
              items.map((b) => (
                <tr key={b.batch_id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 font-mono font-medium text-gray-900">
                    <Link to={`/batches/${b.batch_id}`} className="text-[#2D6A4F] hover:underline">
                      #{b.batch_id}
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-800">{b.common_name || b.variety_name || '—'}</div>
                    <div className="text-[10px] text-gray-400 italic">{b.crop_type || ''}</div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{b.facility_name || 'Main Vault'}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900">
                    {Number(b.remaining_kg || 0).toFixed(1)} kg
                  </td>
                  <td className="py-3 px-3 text-right">
                    <StatusBadge status={b.batch_status || b.status || 'active'} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                  No recent batches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
