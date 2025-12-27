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
import GoogleLogin from './pages/GoogleLogin'
import AuthCallback from './pages/AuthCallback'
import PaymentRequired from './pages/PaymentRequired'
import DashboardRedirect from './components/DashboardRedirect'
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
  const { token, loading, user } = useSelector(state => state.auth)
  const [initialLoad, setInitialLoad] = React.useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      if (token && !user) {
        try {
          await dispatch(loadUser()).unwrap()
        } catch (error) {
          console.error('Failed to load user:', error)
          // If loadUser fails, we'll still let them through
          // The token might be valid but the profile endpoint might have issues
        }
      }
      setInitialLoad(false)
    }

    loadUserData()
  }, [token, user, dispatch])

  // Show loading only during initial load when we have a token
  if (initialLoad && token) {
    return <LoadingScreen message="Loading FlowFinance..." />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!token ? <Home /> : <Navigate to="/app" />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={!token ? <GoogleLogin /> : <Navigate to="/app" />} />
      <Route path="/register" element={!token ? <GoogleLogin /> : <Navigate to="/app" />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/payment-required" element={token ? <PaymentRequired /> : <Navigate to="/login" />} />
      
      {/* App Entry Point - checks if user has accounts */}
      <Route path="/app" element={token ? <DashboardRedirect /> : <Navigate to="/login" />} />
      
      {/* Protected Routes - Main App */}
      <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
        <Route path="dashboard" element={<Dashboard />} />
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
