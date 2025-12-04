import React from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

function CashFlow() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
            Cash Flow Analysis
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Detailed breakdown of income and expenses
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={20} color="#10b981" />
              </div>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Total Income</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '600', color: '#10b981', margin: 0 }}>
              $45,250
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              +12.5% from last month
            </p>
          </div>

          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingDown size={20} color="#ef4444" />
              </div>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Total Expenses</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '600', color: '#ef4444', margin: 0 }}>
              $30,000
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              +5.2% from last month
            </p>
          </div>

          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={20} color="#3b82f6" />
              </div>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Net Cash Flow</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '600', color: '#3b82f6', margin: 0 }}>
              $15,250
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              +25.8% from last month
            </p>
          </div>
        </div>

        {/* Placeholder */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '60px 24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '8px' }}>
            Detailed cash flow analysis coming soon!
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            View detailed breakdowns, patterns, and projections
          </p>
        </div>
      </div>
    </div>
  )
}

export default CashFlow
