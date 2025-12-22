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
  const { accounts } = useSelector(state => state.accounts)
  const { transactions: recentTransactions } = useSelector(state => state.transactions)

  const [stats, setStats] = useState({
    bankBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    invoicesDue: 0,
    availableFinancing: 10000,
    taxDeductions: 0
  })

  const [forecastData, setForecastData] = useState([])
  const [forecastLoading, setForecastLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchAccounts())
    dispatch(fetchTransactions({ limit: 100 }))
    loadDashboardStats()
    loadForecast()
  }, [dispatch])

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const balance = accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || 0), 0)
      setStats(prev => ({ ...prev, bankBalance: balance }))
    }
  }, [accounts])

  useEffect(() => {
    if (recentTransactions && recentTransactions.length > 0) {
      const income = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      
      const expenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      
      setStats(prev => ({ ...prev, totalIncome: income, totalExpenses: expenses }))
    }
  }, [recentTransactions])

  const loadDashboardStats = async () => {
    try {
      const [invoicesRes, taxRes] = await Promise.all([
        api.get('/invoices/stats/summary').catch(() => ({ data: { totalDue: 0 } })),
        api.get('/tax/summary').catch(() => ({ data: { potentialDeductions: 0 } }))
      ])

      setStats(prev => ({
        ...prev,
        invoicesDue: invoicesRes.data.totalDue || 0,
        taxDeductions: taxRes.data.potentialDeductions || 0
      }))
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  const loadForecast = async () => {
    try {
      setForecastLoading(true)
      // Use AI-powered forecast API with ML enhancement
      const response = await api.post('/forecasts/generate', { days: 90, useML: true })
      
      if (response.data && response.data.forecastData) {
        // Transform forecast data for chart (sample every 10 days for cleaner visualization)
        const chartData = []
        const forecastArray = response.data.forecastData
        
        // Add current balance as starting point
        chartData.push({
          day: 'Today',
          balance: Math.round(response.data.currentBalance || 0)
        })
        
        // Sample data points at intervals for better chart readability
        const intervals = [9, 19, 29, 44, 59, 74, 89] // Days 10, 20, 30, 45, 60, 75, 90
        intervals.forEach(index => {
          if (forecastArray[index]) {
            const dayNum = index + 1
            chartData.push({
              day: dayNum === 30 || dayNum === 60 || dayNum === 90 ? `Day ${dayNum}` : `${dayNum}`,
              balance: Math.round(forecastArray[index].predictedBalance || 0)
            })
          }
        })
        
        setForecastData(chartData)
        console.log('✓ AI forecast loaded:', response.data.summary)
      }
    } catch (error) {
      console.error('Load forecast error:', error)
      // Fallback to simple linear forecast if API fails
      const currentBalance = stats.bankBalance || 0
      const avgIncome = stats.totalIncome / 30 || 100
      const avgExpenses = stats.totalExpenses / 30 || 80
      const dailyNet = avgIncome - avgExpenses

      setForecastData([
        { day: 'Today', balance: currentBalance },
        { day: 'Day 30', balance: currentBalance + (dailyNet * 30) },
        { day: '60', balance: currentBalance + (dailyNet * 60) },
        { day: '90', balance: currentBalance + (dailyNet * 90) }
      ])
    } finally {
      setForecastLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Revenue': { icon: CreditCard, color: '#10b981' },
      'Meals & Entertainment': { icon: Coffee, color: '#f59e0b' },
      'Operations': { icon: ShoppingBag, color: '#3b82f6' },
      'Marketing': { icon: ShoppingBag, color: '#ec4899' },
      'Utilities': { icon: ShoppingBag, color: '#8b5cf6' },
      'Travel': { icon: ShoppingBag, color: '#06b6d4' },
      'Other': { icon: ShoppingBag, color: '#6b7280' }
    }
    return icons[category] || icons['Other']
  }

  const displayTransactions = (recentTransactions || []).slice(0, 5).map(txn => {
    const categoryInfo = getCategoryIcon(txn.aiCategory || txn.category)
    return {
      id: txn.id,
      name: txn.description || txn.merchantName,
      subtitle: txn.aiCategory || txn.category,
      category: txn.aiCategory || txn.category,
      amount: parseFloat(txn.amount || 0),
      icon: categoryInfo.icon,
      color: categoryInfo.color
    }
  })

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

              {forecastLoading ? (
                <div style={{ 
                  height: '220px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>🤖 AI analyzing transaction patterns...</div>
                    <div style={{ fontSize: '12px' }}>Generating ML-enhanced forecast</div>
                  </div>
                </div>
              ) : (
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
              )}

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
                {displayTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <p>No transactions yet. Connect mock data to see transactions here.</p>
                  </div>
                ) : (
                  displayTransactions.map((txn) => (
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
                  ))
                )}
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
                <ProgressBar label="Tax" percentage={15} color="#3b82f6" />
                <ProgressBar label="OpEx (incl. owner pay)" percentage={75} color="#60a5fa" active />
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
