import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-[#2D6A4F]">Authenticating Seed Vault...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
