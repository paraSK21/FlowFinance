import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Invoices from './pages/Invoices'
import CashFlow from './pages/CashFlow'
import Financing from './pages/Financing'
import Tax from './pages/Tax'
import TaxDeductions from './pages/TaxDeductions'
import TaxSettings from './pages/TaxSettings'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { loadUser } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()
  const { token, loading } = useSelector(state => state.auth)
  const [onboardingComplete, setOnboardingComplete] = React.useState(
    localStorage.getItem('onboarding_complete')
  )

  useEffect(() => {
    if (token) {
      dispatch(loadUser())
    }
  }, [token, dispatch])

  // Listen for storage changes to detect when onboarding is completed
  useEffect(() => {
    const handleStorageChange = () => {
      setOnboardingComplete(localStorage.getItem('onboarding_complete'))
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically in case storage event doesn't fire (same tab)
    const interval = setInterval(() => {
      const current = localStorage.getItem('onboarding_complete')
      if (current !== onboardingComplete) {
        setOnboardingComplete(current)
      }
    }, 100)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [onboardingComplete])

  if (loading) {
    return <LoadingScreen message="Loading FlowFinance..." />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!token ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
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
        <Route path="financing" element={<Financing />} />
        <Route path="tax" element={<Tax />} />
        <Route path="tax-deductions" element={<TaxDeductions />} />
        <Route path="tax-settings" element={<TaxSettings />} />
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
