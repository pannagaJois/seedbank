import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
})

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// global response handler: redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err && err.response && err.response.status === 401) {
      try { localStorage.removeItem('token') } catch(e){}
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
export default api
