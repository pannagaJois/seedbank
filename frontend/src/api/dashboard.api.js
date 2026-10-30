import api from './axiosInstance'

export async function getSummary(){
  const res = await api.get('/dashboard')
  return res.data
}

export async function getRecentBatches(){
  // backend does not implement a recent-batches endpoint; fall back to /batches and return first 5
  const res = await api.get('/batches')
  return { success: true, data: (res.data.data || res.data || []).slice(0,5) }
}

export async function getExpiringSoon(){
  // compute expiring soon from /batches if backend endpoint is not available
  const res = await api.get('/batches')
  const rows = (res.data.data || res.data || [])
  const now = new Date()
  const in30 = new Date(now.getTime() + 30*24*60*60*1000)
  const items = rows.filter(r => r.expiry_date).filter(r => {
    const d = new Date(r.expiry_date)
    return d >= now && d <= in30 && r.batch_status === 'active'
  }).slice(0,10).map(r=>({
    batch_id: r.batch_id,
    common_name: r.common_name || r.variety || '',
    facility_name: r.facility_name || '',
    crop_type: r.crop_type || '',
    remaining_kg: r.remaining_kg,
    expiry_date: r.expiry_date,
    days_until_expiry: Math.ceil((new Date(r.expiry_date) - now)/(24*60*60*1000))
  }))
  return { success: true, data: items }
}
