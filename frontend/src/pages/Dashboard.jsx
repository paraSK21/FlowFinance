import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Building2, FileText, DollarSign, Coffee, ShoppingBag, CreditCard, AlertTriangle, Info, ChevronDown } from 'lucide-react'
import { fetchAccounts } from '../store/slices/accountSlice'
import { fetchTransactions } from '../store/slices/transactionSlice'
import { generateForecast } from '../store/slices/forecastSlice'
import api from '../services/api'

function Dashboard() {
  const dispatch = useDispatch()

  const [stats, setStats] = useState({
    bankBalance: 15250,
    invoicesDue: 4500,
    availableFinancing: 10000,
    lowStockItems: 3,
    taxDeductions: 320
  })

  useEffect(() => {
    dispatch(fetchAccounts())
    dispatch(fetchTransactions({ limit: 100 }))
    dispatch(generateForecast())
    loadDashboardStats()
  }, [dispatch])

  const loadDashboardStats = async () => {
    try {
      const accounts = await api.get('/accounts')
      const balance = accounts.data.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || 0), 0)
      if (balance > 0) {
        setStats(prev => ({ ...prev, bankBalance: balance }))
      }
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  const forecastData = [
    { day: 'Today', balance: 15000 },
    { day: 'Day 30', balance: 20500 },
    { day: '60', balance: 22800 },
    { day: '90', balance: 26500 }
  ]

  const transactions = [
    { id: 1, name: 'Coffee Shop', subtitle: 'Meals & Entertainment', category: 'Meals &', amount: 15.25, icon: Coffee, color: '#f59e0b' },
    { id: 2, name: 'Office Supplies Co.', subtitle: 'Operations', category: 'Operations', amount: 10.00, icon: ShoppingBag, color: '#3b82f6' },
    { id: 3, name: 'Client Payment', subtitle: 'Revenue', category: 'Revenue', amount: 10.00, icon: CreditCard, color: '#10b981' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Cash Flow Forecast */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#d1d5db', margin: 0 }}>
                  Cash Flow Forecast (Next 90 Days)
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#10b981'
                }}>
                  <span>📈</span>
                  <span>Balance</span>
                  <ChevronDown size={14} />
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: '#1a1f2e',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#d1d5db'
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorBalance)"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
                <StatCard 
                  icon={Building2}
                  iconColor="#3b82f6"
                  label="Bank Balance:"
                  value={`$${stats.bankBalance.toLocaleString()}`}
                />
                <StatCard 
                  icon={FileText}
                  iconColor="#f59e0b"
                  label="Invoices Due:"
                  value={`$${stats.invoicesDue.toLocaleString()}`}
                  subtitle="(Automatic Chasing Active)"
                />
                <StatCard 
                  icon={DollarSign}
                  iconColor="#10b981"
                  label="Available One-Tap Financing:"
                  value={`$${stats.availableFinancing.toLocaleString()}`}
                  subtitle="(No Personal Guarantee)"
                />
              </div>
            </div>

            {/* Recent Transactions */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#d1d5db', margin: 0 }}>
                  Recent AI-Categorized Transactions
                </h2>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  View all
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {transactions.map((txn) => (
                  <div key={txn.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(31, 41, 55, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `${txn.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <txn.icon size={20} color={txn.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>{txn.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{txn.subtitle}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: `${txn.color}20`,
                        color: txn.color
                      }}>
                        {txn.category}
                      </span>
                      <span style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '600', minWidth: '80px', textAlign: 'right' }}>
                        ${txn.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Profit First Status */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db', margin: 0 }}>
                  Profit First Status
                </h3>
                <Info size={16} color="#6b7280" />
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                Automatic splits per totality.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ProgressBar label="Profit Account" percentage={10} color="#a855f7" />
                <ProgressBar label="Owner's Pay" percentage={50} color="#10b981" active />
                <ProgressBar label="Tax" percentage={15} color="#3b82f6" />
                <ProgressBar label="OpEx" percentage={25} color="#60a5fa" />
              </div>
              <button style={{
                marginTop: '12px',
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0
              }}>
                Automatic splits to changes
              </button>
            </div>

            {/* Inventory Alert */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db', margin: 0 }}>
                  Inventory Alert
                </h3>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  Manage
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <span style={{ fontSize: '13px', color: '#f59e0b' }}>Low Stock:</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
                {stats.lowStockItems} items
              </p>
            </div>

            {/* Tax Savings Scanner */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db', margin: '0 0 8px 0' }}>
                Weekly Tax Savings Scanner
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Potential Deductions Found:
              </p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', margin: '0 0 12px 0' }}>
                ${stats.taxDeductions}.
              </p>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0
              }}>
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, iconColor, label, value, subtitle }) {
  return (
    <div style={{
      background: 'rgba(31, 41, 55, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={18} color={iconColor} />
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</span>
      </div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db', marginBottom: '4px' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '10px', color: '#6b7280' }}>{subtitle}</div>
      )}
    </div>
  )
}

function ProgressBar({ label, percentage, color, active }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#d1d5db' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>({percentage}%)</span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(31, 41, 55, 0.5)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: active ? '60%' : `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.3s'
        }} />
      </div>
    </div>
  )
}

export default Dashboard
