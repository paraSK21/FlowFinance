import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Menu, X, User } from 'lucide-react'
import { logout } from '../store/slices/authSlice'
import Logo from './Logo'
import TrialBanner from './TrialBanner'

function Layout() {
  const dispatch = useDispatch()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/accounts', label: 'Accounts' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/reports', label: 'Reports' },
    { path: '/tax', label: 'Tax' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419' }}>
      {/* Top Navigation */}
      <nav style={{
        background: '#1a1f2e',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '0'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Logo size="md" />
              <span style={{ 
                color: '#ffffff', 
                fontSize: '20px', 
                fontWeight: '600',
                letterSpacing: '-0.5px'
              }}>
                FlowFinance
              </span>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hide-mobile" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => ({
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: isActive ? '#ffffff' : '#9ca3af',
                    background: isActive ? '#2563eb' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent'
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop User Menu */}
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <NavLink
                to="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(55, 65, 81, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <User size={20} />
              </NavLink>
              <button
                onClick={() => dispatch(logout())}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="show-mobile"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="show-mobile" style={{
              display: 'none',
              paddingBottom: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              marginTop: '8px'
            }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: isActive ? '#3b82f6' : '#d1d5db',
                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    textDecoration: 'none',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    marginBottom: '4px'
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                padding: '12px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '8px'
              }}>
                <NavLink
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: 'rgba(55, 65, 81, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <User size={18} />
                  Settings
                </NavLink>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    dispatch(logout())
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ background: '#0f1419' }}>
        <TrialBanner />
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
