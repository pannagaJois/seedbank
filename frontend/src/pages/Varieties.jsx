import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function Varieties(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    api.get('/varieties')
      .then(res => {
        if(!mounted) return
        setItems((res.data && res.data.data) || res.data || [])
      })
      .catch(err => {
        if(!mounted) return
        setError(err.response?.data?.message || err.message || 'Failed to load varieties')
      })
      .finally(()=> mounted && setLoading(false))

    return ()=> { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Seed Varieties</h1>
        <Link to="/varieties/new" className="btn btn-primary">Add Variety</Link>
      </div>

      {loading && <p>Loading varieties…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && items.length === 0 && <p>No varieties found.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(v => (
          <div key={v.id} className="p-4 border rounded">
            <h2 className="text-lg font-medium">
              <Link to={`/varieties/${v.id}`} className="text-blue-600">{v.common_name || v.name || `Variety ${v.id}`}</Link>
            </h2>
            {v.scientific_name && <p className="text-sm text-gray-600">{v.scientific_name}</p>}
            {v.accession && <p className="text-sm">Accession: {v.accession}</p>}
            <div className="mt-2">
              <Link to={`/varieties/${v.id}`} className="text-sm text-indigo-600">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
