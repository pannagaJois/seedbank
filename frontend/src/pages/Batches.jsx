import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axiosInstance'
import DataTable from '../components/ui/DataTable'
import { useNavigate } from 'react-router-dom'

const STATUS_TABS = ['all','active','expired','distributed','quarantine']

export default function Batches(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const navigate = useNavigate()

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        setLoading(true)
        const res = await api.get('/batches')
        if (!mounted) return
        setRows(res.data?.data || [])
      }catch(err){
        console.error(err)
      }finally{ if (mounted) setLoading(false) }
    }
    load()
    return ()=> mounted = false
  },[])

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase()
    return rows.filter(r => {
      if (status !== 'all' && (r.batch_status || r.status) !== status) return false
      if (!term) return true
      return (String(r.batch_id).includes(term) || (r.common_name||r.variety||'').toLowerCase().includes(term) || (r.facility_name||'').toLowerCase().includes(term) || (r.contributor_name||'').toLowerCase().includes(term))
    })
  },[rows,q,status])

  const columns = [
    { key: 'batch_id', title: 'Batch ID' },
    { key: 'common_name', title: 'Variety', render: r => r.common_name || r.variety_name || r.variety },
    { key: 'contributor_name', title: 'Contributor' },
    { key: 'facility_name', title: 'Facility' },
    { key: 'collection_date', title: 'Collected' },
    { key: 'expiry_date', title: 'Expiry' },
    { key: 'remaining_kg', title: 'Remaining (kg)' },
    { key: 'germination_rate_pct', title: 'Germination %' },
    { key: 'batch_status', title: 'Status' }
  ]

  function actions(row){
    return (
      <>
        <button className="btn" onClick={()=>navigate(`/batches/${row.batch_id}`)}>View</button>
      </>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h1>Batches</h1>
        <div>
          <button className="btn btn-primary" onClick={()=>alert('Add Batch modal not implemented yet')}>Add Batch</button>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        {STATUS_TABS.map(t => (
          <button key={t} onClick={()=>setStatus(t)} className={`btn ${status===t? 'btn-ghost-active':''}`}>{t.toUpperCase()}</button>
        ))}
        <div style={{marginLeft:'auto'}}>
          <input placeholder="Search batches..." value={q} onChange={e=>setQ(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid var(--color-border)'}} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} actions={actions} />
    </div>
  )
}
