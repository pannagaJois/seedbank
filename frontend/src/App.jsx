import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Varieties from './pages/Varieties'
import VarietyDetail from './pages/VarietyDetail'
import Batches from './pages/Batches'
import BatchDetail from './pages/BatchDetail'
import Distributions from './pages/Distributions'
import ViabilityChecks from './pages/ViabilityChecks'
import Facilities from './pages/Facilities'
import FacilityDetail from './pages/FacilityDetail'
import Recipients from './pages/Recipients'
import Reports from './pages/Reports'

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/" element={<Layout/>}>
        <Route index element={<Dashboard/>} />
        <Route path="varieties" element={<Varieties/>} />
        <Route path="varieties/:id" element={<VarietyDetail/>} />
        <Route path="batches" element={<Batches/>} />
        <Route path="batches/:id" element={<BatchDetail/>} />
        <Route path="distributions" element={<Distributions/>} />
        <Route path="viability" element={<ViabilityChecks/>} />
        <Route path="facilities" element={<Facilities/>} />
        <Route path="facilities/:id" element={<FacilityDetail/>} />
        <Route path="recipients" element={<Recipients/>} />
        <Route path="reports" element={<Reports/>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
