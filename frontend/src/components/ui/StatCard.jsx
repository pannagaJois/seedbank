import React from 'react'

export default function StatCard({ icon, label, value, variant, subtitle, iconBg = 'bg-emerald-100 text-[#2D6A4F]' }) {
  let cardClass = 'bg-white border border-[#E9ECEF] hover:shadow-md'
  if (variant === 'alert') {
    cardClass = 'bg-amber-50/70 border-amber-300 shadow-sm'
  } else if (variant === 'danger') {
    cardClass = 'bg-red-50/70 border-red-300 shadow-sm'
  }

  return (
    <div className={`rounded-xl p-5 transition flex flex-col justify-between ${cardClass}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] font-medium text-gray-500 mt-2 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
