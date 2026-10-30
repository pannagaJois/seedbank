import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function Facilities(){
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    api.get('/facilities')
      .then(res => {
        if(!mounted) return
        // API responses use { success, data } pattern in this project
        setFacilities((res.data && res.data.data) || res.data || [])
      })
      .catch(err => {
        if(!mounted) return
        setError(err.response?.data?.message || err.message || 'Failed to load facilities')
      })
      .finally(()=> mounted && setLoading(false))

    return ()=> { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Storage Facilities</h1>
        <Link to="/facilities/new" className="btn btn-primary">Add Facility</Link>
      </div>

      {loading && <p>Loading facilities…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && facilities.length === 0 && <p>No facilities found.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map(f => (
          <div key={f.id} className="p-4 border rounded">
            <h2 className="text-lg font-medium">
              <Link to={`/facilities/${f.id}`} className="text-blue-600">{f.name || f.facility_name || `Facility ${f.id}`}</Link>
            </h2>
            {f.location && <p className="text-sm text-gray-600">{f.location}</p>}
            {f.capacity && <p className="text-sm">Capacity: {f.capacity}</p>}
            <div className="mt-2">
              <Link to={`/facilities/${f.id}`} className="text-sm text-indigo-600">View details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
