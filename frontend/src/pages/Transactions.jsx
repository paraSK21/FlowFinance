import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTransactions } from '../store/slices/transactionSlice'
import { format } from 'date-fns'
import { Coffee, ShoppingBag, CreditCard, TrendingUp, Filter } from 'lucide-react'

function Transactions() {
  const dispatch = useDispatch()
  const { transactions, loading, error } = useSelector(state => state.transactions)

  useEffect(() => {
    dispatch(fetchTransactions({ limit: 100 }))
  }, [dispatch])

  console.log('Transactions state:', { transactions, loading, error })

  const getCategoryIcon = (category) => {
    const icons = {
      'Meals & Entertainment': { icon: Coffee, color: '#f59e0b' },
      'Operations': { icon: ShoppingBag, color: '#3b82f6' },
      'Revenue': { icon: CreditCard, color: '#10b981' },
      'Office Supplies': { icon: ShoppingBag, color: '#8b5cf6' }
    }
    return icons[category] || { icon: TrendingUp, color: '#6b7280' }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: '#9ca3af' }}>Loading transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>Error loading transactions: {error}</p>
          <button 
            onClick={() => dispatch(fetchTransactions({ limit: 100 }))}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
              Transactions
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              AI-categorized transaction history
            </p>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#1a1f2e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#d1d5db',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <Filter size={16} />
            Filter
          </button>
        </div>

        {/* Transactions List */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Date
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Description
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Category
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {!transactions || transactions.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '48px' }}>💳</div>
                      <div>
                        <p style={{ color: '#d1d5db', fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
                          No transactions yet
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                          Connect your bank account to start tracking transactions
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const categoryInfo = getCategoryIcon(txn.aiCategory || txn.category)
                  const Icon = categoryInfo.icon
                  return (
                    <tr key={txn.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                          {format(new Date(txn.date), 'MMM dd, yyyy')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: `${categoryInfo.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={18} color={categoryInfo.color} />
                          </div>
                          <span style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
                            {txn.description || txn.merchantName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: `${categoryInfo.color}20`,
                          color: categoryInfo.color,
                          fontWeight: '500'
                        }}>
                          {txn.aiCategory || txn.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: txn.type === 'income' ? '#10b981' : '#d1d5db'
                        }}>
                          {txn.type === 'income' ? '+' : '-'}${Math.abs(txn.amount).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Transactions
