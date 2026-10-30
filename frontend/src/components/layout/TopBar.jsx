import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, ShieldCheck, Database, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const sectionTitles = {
  '/': 'Dashboard Overview',
  '/varieties': 'Seed Varieties & Genetics',
  '/batches': 'Seed Batches & Stock',
  '/distributions': 'Distribution Records',
  '/viability': 'Viability & Germination Checks',
  '/facilities': 'Cold Storage Facilities',
  '/recipients': 'Recipients & Farmers',
  '/reports': 'Analytics & Conservation Reports'
}

export default function TopBar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  // Extract top-level route
  const rootPath = '/' + (location.pathname.split('/')[1] || '')
  const title = sectionTitles[rootPath] || 'Dashboard'

  return (
    <header className="topbar">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-gray-900 leading-tight">{title}</h1>
        <p className="text-[11px] text-gray-500 font-medium">Seed Bank Management System</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Cloud Status */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AWS RDS Active (ap-southeast-2)</span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#E76F51] rounded-full"></span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#2D6A4F] text-white text-xs font-semibold flex items-center justify-center">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <button
            onClick={logout}
            className="text-xs font-medium text-gray-600 hover:text-red-600 flex items-center gap-1 transition px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
