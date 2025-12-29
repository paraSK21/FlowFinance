import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Bar } from 'recharts'
import { Building2, FileText, DollarSign, Coffee, ShoppingBag, CreditCard, AlertTriangle, Info, ChevronDown, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PieChart, Target, Wallet, Calendar, Settings } from 'lucide-react'
import { fetchAccounts } from '../store/slices/accountSlice'
import { fetchTransactions } from '../store/slices/transactionSlice'
import { generateForecast } from '../store/slices/forecastSlice'
import api from '../services/api'
import toast from 'react-hot-toast'
import './Dashboard.css'

function Dashboard() {
  const dispatch = useDispatch()
  const { accounts } = useSelector(state => state.accounts)
  const { transactions: recentTransactions } = useSelector(state => state.transactions)

  const [stats, setStats] = useState({
    bankBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    invoicesDue: 0,
    availableFinancing: 0,
    taxDeductions: 0
  })

  const [forecastData, setForecastData] = useState([])
  const [forecastLoading, setForecastLoading] = useState(false)
  const [forecastMetrics, setForecastMetrics] = useState(null)
  const [profitFirstData, setProfitFirstData] = useState(null)
  const [selectedForecastView, setSelectedForecastView] = useState('balance')

  useEffect(() => {
    dispatch(fetchAccounts())
    dispatch(fetchTransactions({ limit: 100 }))
  }, [dispatch])

  // Load dashboard data only when accounts are available
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      loadDashboardStats()
      loadForecast()
      loadProfitFirstData()
    }
  }, [accounts?.length])

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
    // Skip if no accounts
    if (!accounts || accounts.length === 0) {
      return
    }
    
    try {
      const [invoicesRes, taxRes] = await Promise.all([
        api.get('/invoices/stats/summary'),
        api.get('/tax/summary')
      ])

      setStats(prev => ({
        ...prev,
        invoicesDue: invoicesRes.data.totalDue || 0,
        taxDeductions: taxRes.data.totalDeductions || 0
      }))
    } catch (error) {
      console.error('Load stats error:', error)
      // Only show error if user has accounts (otherwise it's expected)
      if (accounts && accounts.length > 0) {
        toast.error('Failed to load some dashboard statistics')
      }
    }
  }

  const loadForecast = async () => {
    // Skip if no accounts or transactions
    if (!accounts || accounts.length === 0 || !recentTransactions || recentTransactions.length === 0) {
      setForecastLoading(false)
      return
    }
    
    try {
      setForecastLoading(true)
      const response = await api.post('/forecasts/generate', { days: 90 })
      
      console.log('Forecast response:', response.data)
      
      if (response.data && response.data.forecastData && Array.isArray(response.data.forecastData)) {
        const forecastArray = response.data.forecastData
        const currentBalance = parseFloat(response.data.currentBalance) || 0
        const projectedBalance = parseFloat(response.data.projectedBalance) || 0
        
        console.log('=== FRONTEND FORECAST DEBUG ===')
        console.log('Current Balance:', currentBalance)
        console.log('Projected Balance (from backend):', projectedBalance)
        console.log('Balance Change:', projectedBalance - currentBalance)
        console.log('Total Income (from backend):', response.data.summary?.projectedIncome)
        console.log('Total Expenses (from backend):', response.data.summary?.projectedExpenses)
        console.log('Net Cash Flow:', response.data.summary?.projectedIncome - Math.abs(response.data.summary?.projectedExpenses))
        
        const detailedData = []
        detailedData.push({
          day: 0,
          label: 'Today',
          balance: Math.round(currentBalance),
          balanceMin: Math.round(currentBalance),
          balanceMax: Math.round(currentBalance),
          income: 0,
          expenses: 0,
          netCashFlow: 0
        })
        
        // Use the backend's calculated running balance
        const weeklyIntervals = [6, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 89]
        weeklyIntervals.forEach(index => {
          if (forecastArray[index]) {
            const data = forecastArray[index]
            
            // Ensure all values are valid numbers
            const projectedIncome = parseFloat(data.projectedIncome) || 0
            const projectedExpenses = parseFloat(data.projectedExpenses) || 0
            const netCashFlow = parseFloat(data.netCashFlow) || 0
            const predictedBalance = parseFloat(data.predictedBalance) || 0
            const incomeMin = parseFloat(data.incomeRange?.min) || projectedIncome
            const incomeMax = parseFloat(data.incomeRange?.max) || projectedIncome
            const expenseMin = parseFloat(data.expenseRange?.min) || projectedExpenses
            const expenseMax = parseFloat(data.expenseRange?.max) || projectedExpenses
            
            // Calculate balance ranges based on income/expense ranges
            const balanceMin = predictedBalance - (incomeMax - incomeMin) - (expenseMax - expenseMin)
            const balanceMax = predictedBalance + (incomeMax - incomeMin) + (expenseMax - expenseMin)
            
            detailedData.push({
              day: index + 1,
              label: `Day ${index + 1}`,
              balance: Math.round(predictedBalance),
              balanceMin: Math.round(balanceMin),
              balanceMax: Math.round(balanceMax),
              income: Math.round(projectedIncome),
              incomeMin: Math.round(incomeMin),
              incomeMax: Math.round(incomeMax),
              expenses: Math.round(Math.abs(projectedExpenses)),
              expenseMin: Math.round(Math.abs(expenseMin)),
              expenseMax: Math.round(Math.abs(expenseMax)),
              netCashFlow: Math.round(netCashFlow)
            })
          }
        })
        
        setForecastData(detailedData)
        
        const totalIncome = parseFloat(response.data.summary?.projectedIncome) || 0
        const totalExpenses = Math.abs(parseFloat(response.data.summary?.projectedExpenses) || 0)
        const netChange = totalIncome - totalExpenses  // Net change = income - expenses
        const balanceChange = projectedBalance - currentBalance  // Actual balance change
        const trend = balanceChange > 0 ? 'positive' : balanceChange < 0 ? 'negative' : 'neutral'
        
        let lowestBalance = currentBalance
        let lowestDay = 0
        forecastArray.forEach((data, index) => {
          const predictedBalance = parseFloat(data.predictedBalance) || 0
          if (predictedBalance < lowestBalance) {
            lowestBalance = predictedBalance
            lowestDay = index + 1
          }
        })
        
        // Calculate balance range from last forecast point
        const lastForecast = forecastArray[forecastArray.length - 1]
        const endBalanceMin = projectedBalance - 1000  // Simplified range
        const endBalanceMax = projectedBalance + 1000
        
        console.log('Lowest Balance:', lowestBalance, 'on day', lowestDay)
        console.log('================================\n')
        
        setForecastMetrics({
          currentBalance: currentBalance,
          projectedBalance: projectedBalance,
          projectedBalanceMin: endBalanceMin,
          projectedBalanceMax: endBalanceMax,
          netChange,
          trend,
          totalIncome,
          totalExpenses,
          lowestBalance,
          lowestDay,
          recurringCount: response.data.summary?.recurringTransactions || 0,
          avgDailyIncome: parseFloat(response.data.analysis?.avgDailyIncome) || 0,
          avgDailyExpenses: Math.abs(parseFloat(response.data.analysis?.avgDailyExpenses) || 0),
          balanceChange  // Actual balance change for display
        })
      } else {
        console.error('Invalid forecast data structure:', response.data)
        throw new Error('Invalid forecast data structure')
      }
    } catch (error) {
      console.error('Load forecast error:', error)
      console.error('Error details:', error.response?.data)
      // Only show error if user has accounts (otherwise it's expected)
      if (accounts && accounts.length > 0 && recentTransactions && recentTransactions.length > 0) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load forecast'
        toast.error(errorMessage)
      }
      setForecastData([])
      setForecastMetrics(null)
    } finally {
      setForecastLoading(false)
    }
  }

  const loadProfitFirstData = async () => {
    // Skip if no accounts
    if (!accounts || accounts.length === 0) {
      return
    }
    
    try {
      const [balancesRes, settingsRes] = await Promise.all([
        api.get('/profit-first/balances'),
        api.get('/profit-first/settings')
      ])
      
      const { totalBalance, allocation, percentages } = balancesRes.data
      const { enabled } = settingsRes.data
      
      setProfitFirstData({
        enabled,
        totalBalance,
        allocation,
        percentages,
        accounts: [
          { 
            name: 'Profit Account', 
            current: allocation.profit, 
            target: percentages.profit,
            color: '#a855f7',
            icon: Target
          },
          { 
            name: 'Tax Reserve', 
            current: allocation.tax, 
            target: percentages.tax,
            color: '#3b82f6',
            icon: FileText
          },
          { 
            name: 'Operating Expenses', 
            current: allocation.opex, 
            target: percentages.opex,
            color: '#10b981',
            icon: Wallet
          }
        ]
      })
    } catch (error) {
      console.error('Load Profit First data error:', error)
      // Silently fail - this is optional data
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
    <div className="dashboard-container">
      <div className="dashboard-inner">
        {/* Show empty state if no accounts */}
        {(!accounts || accounts.length === 0) ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: '#1a1f2e',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Building2 size={40} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
              Welcome to FlowFinance!
            </h2>
            <p style={{ fontSize: '15px', color: '#9ca3af', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
              Connect your bank account to start tracking transactions, forecasting cash flow, and getting AI-powered financial insights
            </p>
            <button
              onClick={() => window.location.href = '/accounts'}
              style={{
                padding: '14px 28px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3b82f6'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Connect Your First Account
            </button>
          </div>
        ) : (
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-left">
            {/* Enhanced Cash Flow Forecast */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div className="forecast-header">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
                    90-Day Cash Flow Forecast
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    AI-powered predictions based on your transaction patterns
                  </p>
                </div>
                <div className="forecast-buttons">
                  <button
                    onClick={() => setSelectedForecastView('balance')}
                    style={{
                      padding: '6px 12px',
                      background: selectedForecastView === 'balance' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: `1px solid ${selectedForecastView === 'balance' ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: selectedForecastView === 'balance' ? '#10b981' : '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Balance
                  </button>
                  <button
                    onClick={() => setSelectedForecastView('cashflow')}
                    style={{
                      padding: '6px 12px',
                      background: selectedForecastView === 'cashflow' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: `1px solid ${selectedForecastView === 'cashflow' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: selectedForecastView === 'cashflow' ? '#3b82f6' : '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cash Flow
                  </button>
                  <button
                    onClick={() => setSelectedForecastView('detailed')}
                    style={{
                      padding: '6px 12px',
                      background: selectedForecastView === 'detailed' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      border: `1px solid ${selectedForecastView === 'detailed' ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: selectedForecastView === 'detailed' ? '#a855f7' : '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Detailed
                  </button>
                </div>
              </div>

              {forecastLoading ? (
                <div style={{ 
                  height: '300px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>🤖 AI analyzing transaction patterns...</div>
                    <div style={{ fontSize: '12px' }}>Generating intelligent forecast</div>
                  </div>
                </div>
              ) : forecastData.length === 0 ? (
                <div style={{ 
                  height: '300px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6b7280',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <Calendar size={48} color="#374151" />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>No forecast data available</div>
                    <div style={{ fontSize: '12px' }}>Connect your bank account and sync transactions to generate forecasts</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Forecast Metrics - Simplified with Ranges */}
                  {forecastMetrics && (
                    <div className="forecast-metrics">
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Current Balance
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                          ${forecastMetrics.currentBalance.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          As of today
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Expected Balance (90d)
                        </div>
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: '700', 
                          color: forecastMetrics.trend === 'positive' ? '#10b981' : forecastMetrics.trend === 'negative' ? '#ef4444' : '#d1d5db',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          ${forecastMetrics.projectedBalance.toLocaleString()}
                          {forecastMetrics.trend === 'positive' ? <TrendingUp size={18} /> : forecastMetrics.trend === 'negative' ? <TrendingDown size={18} /> : null}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          Range: ${forecastMetrics.projectedBalanceMin?.toLocaleString() || '...'} - ${forecastMetrics.projectedBalanceMax?.toLocaleString() || '...'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Net Change
                        </div>
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: '700', 
                          color: forecastMetrics.netChange >= 0 ? '#10b981' : '#ef4444',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {forecastMetrics.netChange >= 0 ? '+' : ''}${forecastMetrics.netChange.toLocaleString()}
                          {forecastMetrics.netChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          Income - Expenses
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chart */}
                  <ResponsiveContainer width="100%" height={280}>
                    {selectedForecastView === 'balance' ? (
                      <AreaChart data={forecastData}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#1a1f2e',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#d1d5db',
                            fontSize: '12px'
                          }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          fill="url(#colorBalance)"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    ) : selectedForecastView === 'cashflow' ? (
                      <LineChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#1a1f2e',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#d1d5db',
                            fontSize: '12px'
                          }}
                          formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Income"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Expenses"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netCashFlow" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Net Cash Flow"
                        />
                      </LineChart>
                    ) : (
                      <ComposedChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickFormatter={(value) => value === 0 ? '' : `$${(value / 1000).toFixed(0)}k`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
                          domain={[0, 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#1a1f2e',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#d1d5db',
                            fontSize: '12px'
                          }}
                          formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                        />
                        <Bar yAxisId="right" dataKey="income" fill="#10b981" name="Income" opacity={0.7} />
                        <Bar yAxisId="right" dataKey="expenses" fill="#ef4444" name="Expenses" opacity={0.7} />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#a855f7" 
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          name="Balance"
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>

                  {/* Simplified Insights */}
                  {forecastMetrics && (
                    <div style={{ 
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      <Info size={18} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6' }}>
                        <strong>Forecast Summary:</strong> Based on your transaction history, you're expected to have{' '}
                        <strong style={{ color: forecastMetrics.trend === 'positive' ? '#10b981' : '#ef4444' }}>
                          ${forecastMetrics.projectedBalance.toLocaleString()}
                        </strong> in 90 days (range: ${forecastMetrics.projectedBalanceMin?.toLocaleString()} - ${forecastMetrics.projectedBalanceMax?.toLocaleString()}).
                        {' '}Expected income: <strong style={{ color: '#10b981' }}>${forecastMetrics.totalIncome.toLocaleString()}</strong>, 
                        expected expenses: <strong style={{ color: '#ef4444' }}>${forecastMetrics.totalExpenses.toLocaleString()}</strong>.
                        {forecastMetrics.balanceChange && (
                          <> Your balance will {forecastMetrics.balanceChange >= 0 ? 'increase' : 'decrease'} by{' '}
                          <strong style={{ color: forecastMetrics.balanceChange >= 0 ? '#10b981' : '#ef4444' }}>
                            ${Math.abs(forecastMetrics.balanceChange).toLocaleString()}
                          </strong> from your current balance.</>
                        )}
                        {forecastMetrics.lowestBalance < forecastMetrics.currentBalance && forecastMetrics.lowestDay < 90 && (
                          <> Your balance may temporarily dip to ${forecastMetrics.lowestBalance.toLocaleString()} around day {forecastMetrics.lowestDay}.</>
                        )}
                        {profitFirstData && profitFirstData.enabled && (
                          <>
                            <br /><br />
                            <strong>💰 Profit First Guidance (US/Canada methodology):</strong> Of your current ${forecastMetrics.currentBalance.toLocaleString()} balance, 
                            you can safely spend <strong style={{ color: '#10b981' }}>${profitFirstData.allocation.opex.toLocaleString()}</strong> ({profitFirstData.percentages.opex}%) on operating expenses. 
                            Keep <strong style={{ color: '#a855f7' }}>${profitFirstData.allocation.profit.toLocaleString()}</strong> ({profitFirstData.percentages.profit}%) as profit 
                            and <strong style={{ color: '#3b82f6' }}>${profitFirstData.allocation.tax.toLocaleString()}</strong> ({profitFirstData.percentages.tax}%) for taxes.
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Stats Row */}
              <div className="stats-row">
                <StatCard 
                  icon={Building2}
                  iconColor="#3b82f6"
                  label="Bank Balance"
                  value={`$${stats.bankBalance.toLocaleString()}`}
                />
                <StatCard 
                  icon={FileText}
                  iconColor="#f59e0b"
                  label="Invoices Due"
                  value={`$${stats.invoicesDue.toLocaleString()}`}
                  subtitle="Auto-chasing active"
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
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <p>No transactions yet. Sync your bank accounts to see transactions here.</p>
                  </div>
                ) : (
                  displayTransactions.map((txn) => (
                  <div key={txn.id} className="transaction-item">
                    <div className="transaction-left">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `${txn.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <txn.icon size={20} color={txn.color} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{txn.subtitle}</div>
                      </div>
                    </div>
                    <div className="transaction-right">
                      <span className="transaction-category" style={{
                        background: `${txn.color}20`,
                        color: txn.color
                      }}>
                        {txn.category}
                      </span>
                      <span className="transaction-amount">
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
          <div className="dashboard-right">
            {/* Enhanced Profit First Status */}
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
                    Profit First Allocation
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    Smart money management system
                  </p>
                </div>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}>
                  <Settings size={18} color="#6b7280" />
                </button>
              </div>

              {profitFirstData ? (
                <>
                  {/* Total Balance */}
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid rgba(168, 85, 247, 0.2)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Available</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>
                      ${profitFirstData.totalBalance.toLocaleString()}
                    </div>
                  </div>

                  {/* Account Allocations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profitFirstData.accounts.map((account, index) => {
                      const Icon = account.icon
                      const percentage = (account.current / profitFirstData.totalBalance * 100) || 0
                      const targetPercentage = account.target
                      const isOnTrack = Math.abs(percentage - targetPercentage) < 5
                      
                      return (
                        <div key={index} style={{
                          padding: '14px',
                          background: 'rgba(31, 41, 55, 0.3)',
                          borderRadius: '8px',
                          border: `1px solid ${isOnTrack ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: `${account.color}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Icon size={18} color={account.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '2px' }}>
                                {account.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                Target: {targetPercentage}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: account.color }}>
                                ${account.current.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(31, 41, 55, 0.5)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: `${Math.min(percentage, 100)}%`,
                              height: '100%',
                              background: account.color,
                              borderRadius: '3px',
                              transition: 'width 0.3s'
                            }} />
                            {/* Target indicator */}
                            <div style={{
                              position: 'absolute',
                              left: `${targetPercentage}%`,
                              top: 0,
                              width: '2px',
                              height: '100%',
                              background: '#ffffff',
                              opacity: 0.5
                            }} />
                          </div>
                          
                          {/* Status */}
                          {!isOnTrack && (
                            <div style={{
                              marginTop: '8px',
                              fontSize: '11px',
                              color: percentage < targetPercentage ? '#f59e0b' : '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {percentage < targetPercentage ? (
                                <>⚠️ ${(account.target * profitFirstData.totalBalance / 100 - account.current).toFixed(0)} needed to reach target</>
                              ) : (
                                <>✓ ${(account.current - account.target * profitFirstData.totalBalance / 100).toFixed(0)} above target</>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Action Button */}
                  <button style={{
                    marginTop: '16px',
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px',
                    color: '#a855f7',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    Adjust Allocation Settings
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  <PieChart size={40} color="#374151" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>Loading Profit First data...</p>
                </div>
              )}
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
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', margin: '0' }}>
                ${stats.taxDeductions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        )}
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

export default Dashboard
