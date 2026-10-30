import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Leaf, Package, Truck, FlaskConical, Warehouse, Users, BarChart3 } from 'lucide-react'

const items = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
  { to: '/varieties', label: 'Seed Varieties', icon: <Leaf size={18}/> },
  { to: '/batches', label: 'Batches', icon: <Package size={18}/> },
  { to: '/distributions', label: 'Distributions', icon: <Truck size={18}/> },
  { to: '/viability', label: 'Viability Checks', icon: <FlaskConical size={18}/> },
  { to: '/facilities', label: 'Storage Facilities', icon: <Warehouse size={18}/> },
  { to: '/recipients', label: 'Recipients', icon: <Users size={18}/> },
  { to: '/reports', label: 'Reports', icon: <BarChart3 size={18}/> }
]

export default function Sidebar(){
  return (
    <aside className="sidebar">
      <div style={{padding:'24px',color:'#fff',fontWeight:700}}>Seed Bank</div>
      <nav>
        {items.map(i => (
          <NavLink key={i.to} to={i.to} className={({isActive})=> isActive? 'nav-link active' : 'nav-link'} end={i.to==='/'}>
            <span style={{marginRight:12}}>{i.icon}</span>
            <span>{i.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{marginTop:'auto',padding:16,color:'#D8F3DC'}}>Logged in user</div>
    </aside>
  )
}
