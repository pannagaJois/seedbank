import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axiosInstance'
import StatusBadge from '../components/ui/StatusBadge'

export default function BatchDetail(){
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [distributions, setDistributions] = useState([])
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        setLoading(true)
        const [bRes,dRes,vRes] = await Promise.all([
          api.get(`/batches/${id}`),
          api.get('/distributions'),
          api.get('/viability')
        ])
        if (!mounted) return
        setBatch(bRes.data?.data || null)
        const drows = dRes.data?.data || []
        setDistributions(drows.filter(d => String(d.batch_id) === String(id)))
        const vrows = vRes.data?.data || []
        setChecks(vrows.filter(c => String(c.batch_id) === String(id)))
      }catch(err){
        console.error(err)
      }finally{ if (mounted) setLoading(false) }
    }
    load()
    return ()=> mounted = false
  },[id])

  if (loading) return <div>Loading...</div>
  if (!batch) return <div>Batch not found</div>

  const remaining = parseFloat(batch.remaining_kg || 0)
  const total = parseFloat(batch.quantity_kg || remaining)
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((remaining/total)*100))) : 0

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1>Batch {batch.batch_id}</h1>
          <div style={{color:'var(--color-text-secondary)'}}>{batch.common_name} • {batch.crop_type}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <StatusBadge status={batch.batch_status} />
          <div style={{marginTop:8}}>{remaining.toFixed(3)} kg remaining</div>
        </div>
      </div>

      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        <div className="card">
          <h3>Metadata</h3>
          <dl>
            <dt>Collected</dt><dd>{batch.collection_date}</dd>
            <dt>Expiry</dt><dd>{batch.expiry_date}</dd>
            <dt>Quantity (kg)</dt><dd>{batch.quantity_kg}</dd>
            <dt>Remaining (kg)</dt><dd>{batch.remaining_kg}</dd>
            <dt>Germination %</dt><dd>{batch.germination_rate_pct}</dd>
            <dt>Notes</dt><dd>{batch.notes}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>Stock</h3>
          <div style={{height:12,background:'#F1F5F9',borderRadius:8,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:'linear-gradient(90deg,var(--color-primary-light),var(--color-primary))'}} />
          </div>
          <div style={{marginTop:8}}>{pct}% used</div>
        </div>
      </div>

      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="card">
          <h3>Distributions</h3>
          {distributions.length ? (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{color:'var(--color-text-secondary)',fontSize:13,textAlign:'left'}}>
                <tr><th>Date</th><th>Recipient</th><th>Qty (kg)</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                {distributions.map(d=> (
                  <tr key={d.distribution_id}><td>{d.distribution_date}</td><td>{d.recipient_name}</td><td>{d.quantity_kg}</td><td>{d.purpose}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div>No distributions</div>}
        </div>

        <div className="card">
          <h3>Viability Checks</h3>
          {checks.length ? (
            <ul>
              {checks.map(c=> (
                <li key={c.check_id}>{c.check_date} — {c.germination_rate_pct}% — <StatusBadge status={c.result} /></li>
              ))}
            </ul>
          ) : <div>No viability checks</div>}
        </div>
      </div>
    </div>
  )
}
