import React from 'react'

export default function StatCard({ icon, label, value, variant }){
  const variantClass = variant === 'alert' ? 'border-amber-300 bg-amber-50' : variant === 'danger' ? 'border-red-200 bg-red-50' : ''
  return (
    <div className={`bg-white border rounded-lg p-4 flex flex-col justify-between ${variantClass}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-700">{icon}</div>
      </div>
      <div className="text-2xl font-bold mt-3">{value}</div>
    </div>
  )
}
