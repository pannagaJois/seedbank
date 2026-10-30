import React from 'react'

const MAP = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  distributed: 'bg-blue-100 text-blue-800',
  quarantine: 'bg-amber-100 text-amber-800',
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  borderline: 'bg-amber-100 text-amber-800'
}

export default function StatusBadge({ status }){
  const cls = MAP[status] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
