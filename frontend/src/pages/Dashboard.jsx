import React, { useEffect, useState } from 'react'
import { getSummary, getRecentBatches, getExpiringSoon } from '../api/dashboard.api'
import StatCard from '../components/ui/StatCard'
import RecentBatchesTable from '../components/ui/RecentBatchesTable'
import ExpiringSoonList from '../components/ui/ExpiringSoonList'
import { LayoutDashboard } from 'lucide-react'

export default function Dashboard(){
  const [summary, setSummary] = useState({})
  const [batches, setBatches] = useState([])
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        const s = await getSummary()
        const rb = await getRecentBatches()
        const es = await getExpiringSoon()
        if(!mounted) return
        setSummary(s.data || {})
        setBatches(rb.data || [])
        setExpiring(es.data || [])
      }catch(err){
        console.error(err)
      }finally{ setLoading(false) }
    }
    // only load if a token is present (prevents early 401s while auth state is initializing)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) load()
    else setLoading(false)
    return ()=> mounted = false
  },[])

  return (
    <div style={{display:'grid',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
        <StatCard label="Active Batches" value={summary.active_batches ?? '—'} icon={<LayoutDashboard/>} />
        <StatCard label="Total Stock (kg)" value={summary.total_remaining_kg ?? '—'} icon={<LayoutDashboard/>} />
        <StatCard label="Distributions This Month" value={summary.distributions_this_month ?? '—'} icon={<LayoutDashboard/>} />
        <StatCard label="Expiring in 30 Days" value={summary.expiring_in_30_days ?? '—'} icon={<LayoutDashboard/>} />
        <StatCard label="Failed Checks (90d)" value={summary.failed_checks_90_days ?? '—'} icon={<LayoutDashboard/>} />
        <StatCard label="Anomalies This Week" value={summary.anomalies_this_week ?? '—'} icon={<LayoutDashboard/>} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,alignItems:'start'}}>
        <RecentBatchesTable items={batches} />
        <ExpiringSoonList items={expiring} />
      </div>
    </div>
  )
}
