import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function Recipients(){
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    api.get('/recipients')
      .then(res => {
        if(!mounted) return
        setRecipients((res.data && res.data.data) || res.data || [])
      })
      .catch(err => {
        if(!mounted) return
        setError(err.response?.data?.message || err.message || 'Failed to load recipients')
      })
      .finally(()=> mounted && setLoading(false))

    return ()=> { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Recipients</h1>
        <Link to="/recipients/new" className="btn btn-primary">Add Recipient</Link>
      </div>

      {loading && <p>Loading recipients…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && recipients.length === 0 && <p>No recipients found.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipients.map(r => (
          <div key={r.id} className="p-4 border rounded">
            <h2 className="text-lg font-medium">
              <Link to={`/recipients/${r.id}`} className="text-blue-600">{r.name || r.org_name || `Recipient ${r.id}`}</Link>
            </h2>
            {r.contact && <p className="text-sm text-gray-600">{r.contact}</p>}
            {r.country && <p className="text-sm">{r.country}</p>}
            <div className="mt-2">
              <Link to={`/recipients/${r.id}`} className="text-sm text-indigo-600">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
