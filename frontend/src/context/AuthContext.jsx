import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadUser() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const res = await api.get('/auth/me')
        if (mounted) {
          setUser(res.data?.data || null)
        }
      } catch (err) {
        console.warn('Auth validation failed, clearing token', err?.message)
        if (mounted) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadUser()
    return () => { mounted = false }
  }, [token])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const receivedToken = res.data?.data?.token
    if (!receivedToken) {
      throw new Error(res.data?.message || 'Login failed')
    }
    localStorage.setItem('token', receivedToken)
    setToken(receivedToken)
    
    // Fetch profile
    try {
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${receivedToken}` }
      })
      setUser(meRes.data?.data || { email, name: email.split('@')[0] })
    } catch {
      setUser({ email, name: email.split('@')[0] })
    }
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
