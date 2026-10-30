import React, { useState } from 'react'
import api from '../api/axiosInstance'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    setLoading(true)
    try{
      const res = await api.post('/auth/login', { email, password })
      const token = res.data?.data?.token
      if (token) {
        localStorage.setItem('token', token)
        navigate('/')
      } else {
        setError('Login failed: no token returned')
      }
    }catch(err){
      setError(err.response?.data?.message || err.message || 'Login failed')
    }finally{ setLoading(false) }
  }

  return (
    <div style={{maxWidth:420,margin:'60px auto'}} className="card">
      <h2 style={{marginBottom:12}}>Login</h2>
      {error && <div style={{color:'var(--color-danger)',marginBottom:8}}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:8}}>
          <label style={{display:'block',fontSize:13,marginBottom:4}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',padding:8,borderRadius:6,border:'1px solid var(--color-border)'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',fontSize:13,marginBottom:4}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:'100%',padding:8,borderRadius:6,border:'1px solid var(--color-border)'}} />
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button type="submit" className="btn" disabled={loading} style={{padding:'8px 14px'}}>{loading? 'Signing in...' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  )
}
