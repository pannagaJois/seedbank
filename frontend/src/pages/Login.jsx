import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    setEmail('admin@example.com')
    setPassword('Password123')
    setError(null)
    setLoading(true)
    login('admin@example.com', 'Password123')
      .then(() => navigate(from, { replace: true }))
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Demo login failed')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-[#132A20] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2D6A4F] rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#52B788] rounded-full filter blur-3xl opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#52B788] text-white shadow-xl shadow-[#2D6A4F]/30 mb-4 ring-4 ring-[#2D6A4F]/20">
            <Leaf className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Seed Bank Vault</h1>
          <p className="text-[#B7E4C7] text-sm mt-1">Agricultural Genetic Conservation & Inventory System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-sm text-gray-500 mt-0.5">Enter your credentials to access batch & variety management</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-medium text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#D8F3DC] hover:bg-[#B7E4C7] text-[#1B4332] font-semibold text-xs tracking-wide uppercase rounded-xl transition flex items-center justify-center gap-2 border border-[#B7E4C7] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
              <span>One-Click Demo Login (Admin)</span>
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              Default: <span className="font-mono text-gray-600">admin@example.com</span> / <span className="font-mono text-gray-600">Password123</span>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-[#74C69D]">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured with JWT & AWS RDS MySQL 8.0</span>
        </div>
      </div>
    </div>
  )
}
