import React from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Dashboard',
  '/varieties': 'Seed Varieties',
  '/batches': 'Batches',
  '/distributions': 'Distributions',
  '/viability': 'Viability Checks',
  '/facilities': 'Storage Facilities',
  '/recipients': 'Recipients',
  '/reports': 'Reports'
}

export default function TopBar(){
  const loc = useLocation();
  const title = titles[loc.pathname.split('/').slice(0,2).join('/') ] || 'Dashboard'
  return (
    <header className="topbar">
      <div className="page-title">{title}</div>
      <div style={{display:'flex',alignItems:'center',gap:12}}> 
        <button>🔔</button>
        <div style={{width:32,height:32,borderRadius:16,background:'#ccc'}}></div>
      </div>
    </header>
  )
}
