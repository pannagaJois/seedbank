import React from 'react'

export default function RecentBatchesTable({ items }){
  return (
    <div className="card">
      <h3>Recent Batches</h3>
      <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
        <thead style={{color:'var(--color-text-secondary)',fontSize:13,textAlign:'left'}}>
          <tr>
            <th>Batch ID</th>
            <th>Variety</th>
            <th>Collected</th>
            <th>Remaining (kg)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items && items.length ? items.map(b => (
            <tr key={b.batch_id} style={{borderTop:'1px solid var(--color-border)'}}>
              <td style={{padding:'8px 0'}}>{b.batch_id}</td>
              <td style={{padding:'8px 0'}}>{b.common_name || b.variety_name || b.variety}</td>
              <td style={{padding:'8px 0'}}>{b.collection_date || b.distribution_date}</td>
              <td style={{padding:'8px 0'}}>{b.remaining_kg ?? b.total_remaining_kg}</td>
              <td style={{padding:'8px 0'}}>{b.batch_status || b.status}</td>
            </tr>
          )) : (
            <tr><td colSpan={5} style={{padding:12}}>No recent batches</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
