import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTransactions } from '../store/slices/transactionSlice'
import { format } from 'date-fns'
import { Coffee, ShoppingBag, CreditCard, TrendingUp, Filter, AlertCircle, Check, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import './Transactions.css'

function Transactions() {
  const dispatch = useDispatch()
  const { transactions, loading, error } = useSelector(state => state.transactions)
  const [showNeedsReview, setShowNeedsReview] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    'Revenue', 'Meals & Entertainment', 'Operations', 'Marketing',
    'Utilities', 'Travel', 'Professional Services', 'Payroll',
    'Rent', 'Insurance', 'Taxes', 'Office Supplies', 'Other'
  ]

  useEffect(() => {
    if (showNeedsReview) {
      loadNeedsReview()
    } else {
      dispatch(fetchTransactions({ limit: 100 }))
    }
  }, [dispatch, showNeedsReview])

  const loadNeedsReview = async () => {
    try {
      const response = await api.get('/transactions/needs-review')
      // Update Redux store or use local state
    } catch (err) {
      console.error('Failed to load transactions needing review:', err)
    }
  }

  const handleCorrectCategory = async (transactionId, newCategory) => {
    try {
      await api.put(`/transactions/${transactionId}/correct-category`, {
        category: newCategory
      })
      toast.success('Category corrected and pattern learned!')
      setEditingCategory(null)
      dispatch(fetchTransactions({ limit: 100 }))
    } catch (err) {
      toast.error('Failed to correct category')
      console.error(err)
    }
  }

  const handleBulkRecategorize = async () => {
    try {
      toast.loading('Recategorizing all transactions with new AI...')
      const response = await api.post('/transactions/bulk-recategorize', {})
      toast.dismiss()
      toast.success(`✓ ${response.data.updated} transactions recategorized!`)
      dispatch(fetchTransactions({ limit: 100 }))
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to recategorize transactions')
      console.error(err)
    }
  }

  console.log('Transactions state:', { transactions, loading, error })

  const getCategoryIcon = (category) => {
    const icons = {
      'Revenue': { icon: CreditCard, color: '#10b981' },
      'Meals & Entertainment': { icon: Coffee, color: '#f59e0b' },
      'Operations': { icon: ShoppingBag, color: '#3b82f6' },
      'Marketing': { icon: TrendingUp, color: '#ec4899' },
      'Utilities': { icon: ShoppingBag, color: '#8b5cf6' },
      'Travel': { icon: ShoppingBag, color: '#06b6d4' },
      'Professional Services': { icon: ShoppingBag, color: '#14b8a6' },
      'Payroll': { icon: ShoppingBag, color: '#f97316' },
      'Rent': { icon: ShoppingBag, color: '#84cc16' },
      'Insurance': { icon: ShoppingBag, color: '#a855f7' },
      'Taxes': { icon: ShoppingBag, color: '#ef4444' },
      'Office Supplies': { icon: ShoppingBag, color: '#64748b' },
      'Other': { icon: TrendingUp, color: '#6b7280' }
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
    <div className="transactions-container">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="transactions-header">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
              Transactions
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              AI-categorized transaction history
            </p>
          </div>
          <div className="transactions-actions">
            <button 
              onClick={handleBulkRecategorize}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#10b981',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <TrendingUp size={16} />
              Recategorize All
            </button>
            <button 
              onClick={() => setShowNeedsReview(!showNeedsReview)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: showNeedsReview ? '#f59e0b' : '#1a1f2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: showNeedsReview ? '#000' : '#d1d5db',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: showNeedsReview ? '600' : '400'
              }}
            >
              <AlertCircle size={16} />
              {showNeedsReview ? 'Show All' : 'Needs Review'}
            </button>
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
        </div>

        {/* Transactions List */}
        <div className="transactions-table-container">
          <table className="transactions-table">
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
                  const isLowConfidence = txn.needsReview || (txn.aiCategoryConfidence && txn.aiCategoryConfidence < 0.75)
                  const isEditing = editingCategory === txn.id
                  
                  return (
                    <tr key={txn.id} style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isLowConfidence ? 'rgba(245, 158, 11, 0.05)' : 'transparent'
                    }}>
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
                          <div>
                            <div style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
                              {txn.description || txn.merchantName}
                            </div>
                            {isLowConfidence && (
                              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} />
                                Low confidence ({Math.round((txn.aiCategoryConfidence || 0) * 100)}%)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              style={{
                                padding: '6px 10px',
                                background: '#0f1419',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: '#d1d5db',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Select...</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                if (selectedCategory) {
                                  handleCorrectCategory(txn.id, selectedCategory)
                                }
                              }}
                              style={{
                                padding: '6px 8px',
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Save"
                            >
                              <Check size={14} color="#fff" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              style={{
                                padding: '6px 8px',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Cancel"
                            >
                              <X size={14} color="#fff" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            onClick={() => {
                              setEditingCategory(txn.id)
                              setSelectedCategory(txn.aiCategory || txn.category)
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              background: `${categoryInfo.color}20`,
                              color: categoryInfo.color,
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'inline-block',
                              border: '1px solid transparent',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.border = `1px solid ${categoryInfo.color}`
                              e.target.style.background = `${categoryInfo.color}30`
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.border = '1px solid transparent'
                              e.target.style.background = `${categoryInfo.color}20`
                            }}
                            title="Click to edit category"
                          >
                            {txn.aiCategory || txn.category}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: txn.amount > 0 ? '#10b981' : '#ef4444'
                        }}>
                          {txn.amount > 0 ? '+' : ''}${txn.amount.toLocaleString()}
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
