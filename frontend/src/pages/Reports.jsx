import React, { useEffect, useState } from 'react'
import api from '../api/axiosInstance'

export default function Reports(){
  const [summary, setSummary] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)

    // Try a dedicated /reports endpoint first, fall back to /dashboard + /batches
    api.get('/reports')
      .then(r => {
        if(!mounted) return
        const data = (r.data && r.data.data) || r.data || {}
        setSummary(data.summary || data)
        setBatches(data.top_batches || data.batches || [])
      })
      .catch(()=>{
        // fallback
        Promise.all([api.get('/dashboard'), api.get('/batches')])
          .then(([dRes, bRes])=>{
            if(!mounted) return
            const d = (dRes.data && dRes.data.data) || dRes.data || {}
            const b = (bRes.data && bRes.data.data) || bRes.data || []
            setSummary(d)
            // show most recent 10 batches as a simple table for reports
            setBatches(b.slice(0,10))
          })
          .catch(err=>{
            if(!mounted) return
            setError(err.response?.data?.message || err.message || 'Failed to load reports')
          })
      })
      .finally(()=> mounted && setLoading(false))

    return ()=> { mounted = false }
  }, [])

  if(loading) return <p>Loading reports…</p>
  if(error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Active batches</div>
            <div className="text-2xl font-bold">{summary.active_batches ?? summary.total_batches ?? '—'}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Total remaining (kg)</div>
            <div className="text-2xl font-bold">{summary.total_remaining_kg ?? summary.remaining_kg ?? '—'}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-600">Distributions this month</div>
            <div className="text-2xl font-bold">{summary.distributions_this_month ?? '—'}</div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-medium mb-2">Recent batches (report)</h2>
      {batches.length === 0 && <p>No batch data available.</p>}
      {batches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Variety</th>
                <th className="p-2 border">Facility</th>
                <th className="p-2 border">Remaining (kg)</th>
                <th className="p-2 border">Received</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} className="align-top">
                  <td className="p-2 border">{b.id}</td>
                  <td className="p-2 border">{b.common_name || b.variety_name || b.variety || '—'}</td>
                  <td className="p-2 border">{b.facility_name || b.storage_facility_name || b.facility || '—'}</td>
                  <td className="p-2 border">{b.remaining_kg ?? b.remaining ?? b.remainingKg ?? '—'}</td>
                  <td className="p-2 border">{b.date_received || b.received_at || b.created_at || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
