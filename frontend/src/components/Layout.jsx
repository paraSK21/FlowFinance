import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { LayoutDashboard, Receipt, TrendingUp, Package, DollarSign, FileText, User, ChevronDown } from 'lucide-react'
import { logout } from '../store/slices/authSlice'
import Logo from './Logo'
import TrialBanner from './TrialBanner'

function Layout() {
  const dispatch = useDispatch()

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
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
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

            {/* Navigation Items */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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

            {/* User Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          </div>
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
