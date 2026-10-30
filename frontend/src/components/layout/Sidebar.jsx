import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Leaf, 
  Package, 
  Truck, 
  FlaskConical, 
  Warehouse, 
  Users, 
  BarChart3, 
  LogOut,
  UserCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/varieties', label: 'Seed Varieties', icon: Leaf },
  { to: '/batches', label: 'Batches', icon: Package },
  { to: '/distributions', label: 'Distributions', icon: Truck },
  { to: '/viability', label: 'Viability Checks', icon: FlaskConical },
  { to: '/facilities', label: 'Storage Facilities', icon: Warehouse },
  { to: '/recipients', label: 'Recipients', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 }
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-[#2D6A4F]/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2D6A4F] to-[#52B788] flex items-center justify-center text-white shadow-md">
          <Leaf className="w-6 h-6" />
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight tracking-wide">Seed Bank</div>
          <div className="text-[#74C69D] text-[11px] font-medium tracking-wider uppercase">Genetic Vault</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#74C69D]/70">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Footer with Logout */}
      <div className="p-3 border-t border-[#2D6A4F]/40 bg-[#132A20]/60">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/5 transition">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] text-[#D8F3DC] font-semibold text-xs flex items-center justify-center flex-shrink-0 border border-[#52B788]/30">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate leading-tight">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[#B7E4C7] text-[10px] truncate leading-tight">
                {user?.email || 'admin@example.com'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-[#B7E4C7] hover:text-white hover:bg-red-500/20 rounded-md transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
