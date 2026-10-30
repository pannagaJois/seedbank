import React from 'react'

const MAP = {
  active: 'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  expired: 'bg-[#FFE5E5] text-[#9B2335] border-[#FCA5A5]',
  distributed: 'bg-[#DBF0FF] text-[#14558F] border-[#BAE6FD]',
  quarantine: 'bg-[#FFF3CD] text-[#7D5A00] border-[#FDE68A]',
  pass: 'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  fail: 'bg-[#FFE5E5] text-[#9B2335] border-[#FCA5A5]',
  borderline: 'bg-[#FFF3CD] text-[#7D5A00] border-[#FDE68A]'
}

export default function StatusBadge({ status }) {
  if (!status) return null
  const key = String(status).toLowerCase().trim()
  const cls = MAP[key] || 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  )
}
