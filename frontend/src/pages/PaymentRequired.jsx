import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { CreditCard, Check, Clock } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

function PaymentRequired() {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [planId, setPlanId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
    fetchPlanId()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/paypal/subscription')
      setSubscription(response.data)
      
      // If user has active subscription, redirect to dashboard
      if (response.data.hasSubscription) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanId = async () => {
    try {
      const response = await api.post('/paypal/create-subscription')
      setPlanId(response.data.planId)
    } catch (error) {
      console.error('Error fetching plan ID:', error)
      toast.error('Failed to load payment options')
    }
  }

  const handleApprove = async (data) => {
    try {
      const response = await api.post('/paypal/subscription-approved', {
        subscriptionId: data.subscriptionID,
        userId: subscription?.userId
      })

      if (response.data.success) {
        toast.success('Subscription activated successfully!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }
    } catch (error) {
      console.error('Error approving subscription:', error)
      toast.error('Failed to activate subscription. Please contact support.')
    }
  }

  const features = [
    'Unlimited bank account connections',
    'Real-Time Transaction Sync using Plaid',
    'AI-powered expense categorization',
    'Invoice management',
    '90-day cash flow forecasting',
    'Automated tax deduction scanning',
    'Profit First allocation system',
    'Financial reports & analytics',
    'Priority email support'
  ]

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f1419',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#9ca3af' }}>Loading...</div>
      </div>
    )
  }

  return (
    <PayPalScriptProvider options={{
      'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
      vault: true,
      intent: 'subscription'
    }}>
      <div style={{
        minHeight: '100vh',
        background: '#0f1419',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <div style={{
            background: '#1a1f2e',
            borderRadius: '16px',
            padding: '48px 40px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Clock size={40} color="#ef4444" />
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              textAlign: 'center',
              margin: '0 0 12px 0'
            }}>
              Your Free Trial Has Ended
            </h1>

            {/* Description */}
            <p style={{
              fontSize: '15px',
              color: '#9ca3af',
              textAlign: 'center',
              margin: '0 0 32px 0',
              lineHeight: '1.6'
            }}>
              {subscription?.trial?.hasExpired 
                ? `Your 7-day free trial ended on ${new Date(subscription.trial.endsAt).toLocaleDateString()}. Subscribe now to continue managing your finances with FlowFinance.`
                : 'Subscribe now to continue accessing your financial data and insights.'
              }
            </p>

            {/* Pricing */}
            <div style={{
              padding: '24px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                Professional Plan
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff' }}>$59</span>
                <span style={{ fontSize: '18px', color: '#9ca3af' }}>/month</span>
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                Cancel anytime • No hidden fees
              </div>
            </div>

            {/* Features */}
            <div style={{
              marginBottom: '32px',
              padding: '24px',
              background: 'rgba(31, 41, 55, 0.5)',
              borderRadius: '12px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#ffffff', 
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Everything Included:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {features.map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Check size={12} color="#10b981" />
                    </div>
                    <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PayPal Button */}
            {planId ? (
              <div style={{ marginBottom: '16px' }}>
                <PayPalButtons
                  createSubscription={(data, actions) => {
                    return actions.subscription.create({
                      plan_id: planId
                    })
                  }}
                  onApprove={handleApprove}
                  onError={(err) => {
                    console.error('PayPal error:', err)
                    toast.error('Payment failed. Please try again.')
                  }}
                  style={{
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'subscribe'
                  }}
                />
              </div>
            ) : (
              <div style={{
                padding: '20px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 12px 0' }}>
                  PayPal payment is not configured yet.
                </p>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  Please contact support at flowfinance06@gmail.com to activate your subscription.
                </p>
              </div>
            )}

            {/* Footer */}
            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b7280',
              margin: 0
            }}>
              Secure payment powered by PayPal • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  )
}

export default PaymentRequired
