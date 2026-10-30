import React from 'react'

export default function ExpiringSoonList({ items }){
  return (
    <div className="card">
      <h3>Expiring Soon</h3>
      <ul style={{listStyle:'none',padding:0,marginTop:12}}>
        {items && items.length ? items.map(i => (
          <li key={i.batch_id} style={{padding:'8px 0',borderTop:'1px solid var(--color-border)',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600}}>{i.common_name}</div>
              <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>{i.facility_name} • {i.crop_type}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:700}}>{i.remaining_kg}</div>
              <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>{i.days_until_expiry} days</div>
            </div>
          </li>
        )) : (
          <li style={{padding:12}}>No expiring batches</li>
        )}
      </ul>
    </div>
  )
}
