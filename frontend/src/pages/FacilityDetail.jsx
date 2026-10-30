import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function FacilityDetail(){
  const { id } = useParams()
  const [facility, setFacility] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    Promise.all([
      api.get(`/facilities/${id}`),
      api.get('/batches')
    ])
    .then(([fRes, bRes])=>{
      if(!mounted) return
      const f = (fRes.data && fRes.data.data) || fRes.data || null
      setFacility(f)
      const allBatches = (bRes.data && bRes.data.data) || bRes.data || []
      // try a few possible keys for facility id on batch
      const filtered = allBatches.filter(b => String(b.storage_facility_id || b.facility_id || b.facilityId || b.facility) === String(id))
      setBatches(filtered)
    })
    .catch(err=>{
      if(!mounted) return
      setError(err.response?.data?.message || err.message || 'Failed to load')
    })
    .finally(()=> mounted && setLoading(false))

    return ()=> { mounted = false }
  }, [id])

  if(loading) return <p>Loading facility…</p>
  if(error) return <p className="text-red-600">{error}</p>
  if(!facility) return <p>Facility not found.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{facility.name || facility.facility_name || `Facility ${facility.id}`}</h1>
        <Link to="/facilities" className="text-sm text-gray-600">Back to facilities</Link>
      </div>

      {facility.location && <p className="mb-2">Location: {facility.location}</p>}
      {facility.capacity && <p className="mb-4">Capacity: {facility.capacity}</p>}

      <h2 className="text-lg font-medium mt-6 mb-2">Batches stored here</h2>
      {batches.length === 0 && <p>No batches found for this facility.</p>}
      <ul className="space-y-2">
        {batches.map(b => (
          <li key={b.id} className="p-2 border rounded">
            <Link to={`/batches/${b.id}`} className="font-medium text-blue-600">{b.batch_number || b.id}</Link>
            <div className="text-sm text-gray-600">Variety: {b.common_name || b.variety_name || b.variety || '—'}</div>
            <div className="text-sm">Remaining kg: {b.remaining_kg ?? b.remaining ?? b.remainingKg ?? '—'}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
