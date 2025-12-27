import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CreditCard } from 'lucide-react'
import api from '../services/api'

function TrialBanner() {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/paypal/subscription')
      setSubscription(response.data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) return null

  // Don't show banner if user has active subscription
  if (subscription.hasSubscription) return null

  // Show trial banner if trial is active
  if (subscription.trial?.isActive) {
    const daysRemaining = subscription.trial.daysRemaining
    const isUrgent = daysRemaining <= 2

    return (
      <div style={{
        background: isUrgent 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={20} color={isUrgent ? '#ef4444' : '#3b82f6'} />
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#ffffff',
              marginBottom: '2px'
            }}>
              {daysRemaining === 0 
                ? 'Trial ends today!' 
                : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`
              }
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              Subscribe now to continue using FlowFinance after your trial ends
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{
            padding: '8px 16px',
            background: isUrgent 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <CreditCard size={14} />
          Subscribe Now
        </button>
      </div>
    )
  }

  // Show payment required banner if trial expired
  if (subscription.trial?.hasExpired || subscription.requiresPayment) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '8px',
        padding: '16px 20px',
        margin: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CreditCard size={24} color="#ef4444" />
          <div>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: '700', 
              color: '#ffffff',
              marginBottom: '4px'
            }}>
              Your free trial has ended
            </div>
            <div style={{ fontSize: '13px', color: '#d1d5db' }}>
              Subscribe now to continue accessing your financial data and insights
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          <CreditCard size={16} />
          Subscribe to Continue
        </button>
      </div>
    )
  }

  return null
}

export default TrialBanner
