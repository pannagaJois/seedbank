import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function VarietyDetail(){
  const { id } = useParams()
  const [variety, setVariety] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)

    Promise.all([api.get(`/varieties/${id}`), api.get('/batches')])
      .then(([vRes, bRes])=>{
        if(!mounted) return
        const v = (vRes.data && vRes.data.data) || vRes.data || null
        setVariety(v)
        const all = (bRes.data && bRes.data.data) || bRes.data || []
        const filtered = all.filter(b => String(b.variety_id || b.variety || b.varietyId) === String(id))
        setBatches(filtered)
      })
      .catch(err=>{
        if(!mounted) return
        setError(err.response?.data?.message || err.message || 'Failed to load variety')
      })
      .finally(()=> mounted && setLoading(false))

    return ()=> { mounted = false }
  }, [id])

  if(loading) return <p>Loading variety…</p>
  if(error) return <p className="text-red-600">{error}</p>
  if(!variety) return <p>Variety not found.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{variety.common_name || variety.name || `Variety ${variety.id}`}</h1>
        <Link to="/varieties" className="text-sm text-gray-600">Back to varieties</Link>
      </div>

      {variety.scientific_name && <p className="mb-2">Scientific name: {variety.scientific_name}</p>}
      {variety.accession && <p className="mb-2">Accession: {variety.accession}</p>}
      {variety.category && <p className="mb-2">Category: {variety.category}</p>}

      <h2 className="text-lg font-medium mt-6 mb-2">Inventory / Batches</h2>
      {batches.length === 0 && <p>No batches for this variety.</p>}
      {batches.length > 0 && (
        <ul className="space-y-2">
          {batches.map(b => (
            <li key={b.id} className="p-2 border rounded">
              <Link to={`/batches/${b.id}`} className="font-medium text-blue-600">Batch {b.id}</Link>
              <div className="text-sm text-gray-600">Facility: {b.facility_name || b.storage_facility_name || b.facility || '—'}</div>
              <div className="text-sm">Remaining: {b.remaining_kg ?? b.remaining ?? b.remainingKg ?? '—'} kg</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
