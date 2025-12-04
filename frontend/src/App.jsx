import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Invoices from './pages/Invoices'
import CashFlow from './pages/CashFlow'
import Inventory from './pages/Inventory'
import Financing from './pages/Financing'
import Tax from './pages/Tax'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import { loadUser } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()
  const { token, loading } = useSelector(state => state.auth)

  useEffect(() => {
    if (token) {
      dispatch(loadUser())
    }
  }, [token, dispatch])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Check if onboarding is complete
  const onboardingComplete = localStorage.getItem('onboarding_complete')

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
      <Route path="/onboarding" element={token ? <Onboarding /> : <Navigate to="/login" />} />
      
      <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={onboardingComplete ? <Dashboard /> : <Navigate to="/onboarding" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="cash-flow" element={<CashFlow />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="financing" element={<Financing />} />
        <Route path="tax" element={<Tax />} />
        <Route path="reports" element={<Reports />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
