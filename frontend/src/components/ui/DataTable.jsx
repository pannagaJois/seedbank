import React from 'react'
import StatusBadge from './StatusBadge'

export default function DataTable({ columns, data, actions }){
  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{col.title}</th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data && data.length ? data.map(row => (
            <tr key={row.id || row.batch_id} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">{
                  col.key === 'status' ? <StatusBadge status={row[col.key]} /> : (col.render ? col.render(row) : row[col.key])
                }</td>
              ))}
              {actions && <td className="px-4 py-3 text-sm text-right space-x-2">{actions(row)}</td>}
            </tr>
          )) : (
            <tr><td colSpan={columns.length + (actions?1:0)} className="p-4 text-sm text-gray-500">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
