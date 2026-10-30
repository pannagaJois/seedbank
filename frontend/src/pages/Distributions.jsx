import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axiosInstance'
import DataTable from '../components/ui/DataTable'

export default function Distributions(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ batch_id:'', recipient_id:'', distribution_date:'', quantity_kg:'', purpose:'cultivation', remarks:'', distributed_by:'' })
  const [batches, setBatches] = useState([])
  const [recipients, setRecipients] = useState([])
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        setLoading(true)
        const [dRes,bRes,rRes] = await Promise.all([
          api.get('/distributions'),
          api.get('/batches'),
          api.get('/recipients')
        ])
        if(!mounted) return
        setRows(dRes.data?.data || [])
        setBatches(bRes.data?.data || [])
        setRecipients(rRes.data?.data || [])
      }catch(err){ console.error(err); }
      finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=> mounted = false
  },[])

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase()
    return rows.filter(r => {
      if (!term) return true
      return (String(r.distribution_id).includes(term) || (r.seed_variety||'').toLowerCase().includes(term) || (r.recipient_name||'').toLowerCase().includes(term) || String(r.batch_id).includes(term))
    })
  },[rows,q])

  const columns = [
    { key: 'distribution_date', title: 'Date' },
    { key: 'seed_variety', title: 'Variety' },
    { key: 'batch_id', title: 'Batch ID' },
    { key: 'recipient_name', title: 'Recipient' },
    { key: 'quantity_kg', title: 'Qty (kg)' },
    { key: 'purpose', title: 'Purpose' },
    { key: 'distributed_by', title: 'Distributed By' }
  ]

  async function submit(e){
    e.preventDefault()
    setError(null)
    try{
      const payload = {
        batch_id: form.batch_id,
        recipient_id: form.recipient_id,
        distributed_by: form.distributed_by || null,
        distribution_date: form.distribution_date || new Date().toISOString().slice(0,10),
        quantity_kg: parseFloat(form.quantity_kg),
        purpose: form.purpose,
        remarks: form.remarks
      }
      await api.post('/distributions', payload)
      // refresh
      const dRes = await api.get('/distributions')
      setRows(dRes.data?.data || [])
      setShowForm(false)
      setForm({ batch_id:'', recipient_id:'', distribution_date:'', quantity_kg:'', purpose:'cultivation', remarks:'', distributed_by:'' })
    }catch(err){
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed')
    }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h1>Distributions</h1>
        <div>
          <button className="btn btn-primary" onClick={()=>setShowForm(s=>!s)}>{showForm? 'Close' : 'Log Distribution'}</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:12}}>
          <h3>Log Distribution</h3>
          {error && <div style={{color:'var(--color-danger)'}}>{error}</div>}
          <form onSubmit={submit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div>
              <label>Batch</label>
              <select required value={form.batch_id} onChange={e=>setForm({...form,batch_id:e.target.value})} style={{width:'100%',padding:8}}>
                <option value="">Select batch</option>
                {batches.map(b=> <option key={b.batch_id} value={b.batch_id}>{b.batch_id} — {b.common_name}</option>)}
              </select>
            </div>
            <div>
              <label>Recipient</label>
              <select required value={form.recipient_id} onChange={e=>setForm({...form,recipient_id:e.target.value})} style={{width:'100%',padding:8}}>
                <option value="">Select recipient</option>
                {recipients.map(r=> <option key={r.recipient_id} value={r.recipient_id}>{r.recipient_name}</option>)}
              </select>
            </div>
            <div>
              <label>Quantity (kg)</label>
              <input required value={form.quantity_kg} onChange={e=>setForm({...form,quantity_kg:e.target.value})} style={{width:'100%',padding:8}} />
            </div>
            <div>
              <label>Date</label>
              <input type="date" value={form.distribution_date} onChange={e=>setForm({...form,distribution_date:e.target.value})} style={{width:'100%',padding:8}} />
            </div>
            <div>
              <label>Purpose</label>
              <select value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} style={{width:'100%',padding:8}}>
                <option value="cultivation">Cultivation</option>
                <option value="research">Research</option>
                <option value="exchange">Exchange</option>
                <option value="emergency_relief">Emergency relief</option>
              </select>
            </div>
            <div>
              <label>Distributed By (contributor id)</label>
              <input value={form.distributed_by} onChange={e=>setForm({...form,distributed_by:e.target.value})} style={{width:'100%',padding:8}} placeholder="optional contributor id" />
            </div>
            <div style={{gridColumn:'1 / span 2'}}>
              <label>Remarks</label>
              <input value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} style={{width:'100%',padding:8}} />
            </div>
            <div style={{gridColumn:'1 / span 2',textAlign:'right'}}>
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>
          </form>
        </div>
      )}

      <div style={{marginBottom:8,display:'flex',alignItems:'center'}}>
        <input placeholder="Search distributions..." value={q} onChange={e=>setQ(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid var(--color-border)',width:320}} />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  )
}
