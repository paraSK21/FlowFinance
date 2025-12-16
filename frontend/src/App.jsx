import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
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
import NotFound from './pages/NotFound'
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
    return <LoadingScreen message="Loading FlowFinance..." />
  }

  // Check if onboarding is complete
  const onboardingComplete = localStorage.getItem('onboarding_complete')

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!token ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
      
      {/* Onboarding */}
      <Route path="/onboarding" element={token ? <Onboarding /> : <Navigate to="/login" />} />
      
      {/* Protected Routes */}
      <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
        <Route path="dashboard" element={onboardingComplete ? <Dashboard /> : <Navigate to="/onboarding" />} />
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
      
      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
