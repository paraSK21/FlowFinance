import React, { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

function SetuLink({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [consentData, setConsentData] = useState(null)
  const [polling, setPolling] = useState(false)

  const initiateConnection = async () => {
    setLoading(true)
    try {
      console.log('Creating Setu consent request...')
      const response = await api.post('/setu/consent/create')
      console.log('Consent response:', response.data)
      
      setConsentData(response.data)
      
      // Open consent URL in new window
      const consentWindow = window.open(
        response.data.consentUrl,
        'SetuConsent',
        'width=600,height=800'
      )

      toast.success('Complete the consent in the opened window')
      
      // Start polling for consent status
      startPolling(response.data.consentId)
      
    } catch (error) {
      console.error('Failed to create consent:', error)
      console.error('Error response:', error.response?.data)
      
      // Check if phone number is needed
      if (error.response?.data?.needsPhone) {
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Phone Number Required</div>
            <div style={{ fontSize: '13px' }}>Please add your phone number in Settings first</div>
          </div>,
          { duration: 5000 }
        )
        // Redirect to settings after 2 seconds
        setTimeout(() => {
          window.location.href = '/settings'
        }, 2000)
      } else if (error.response?.data?.needsSetup) {
        // Setu not configured
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Setup Required</div>
            <div style={{ fontSize: '13px' }}>Indian bank connections are not configured yet.</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
              Sign up at setu.co to enable this feature
            </div>
          </div>,
          { duration: 6000 }
        )
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to initialize Indian bank connection'
        toast.error(errorMessage, { duration: 5000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const startPolling = async (consentId) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 30 // Poll for 5 minutes (30 * 10 seconds)

    const pollInterval = setInterval(async () => {
      attempts++
      
      try {
        const statusResponse = await api.get(`/setu/consent/${consentId}/status`)
        console.log('Consent status:', statusResponse.data)

        if (statusResponse.data.status === 'ACTIVE') {
          clearInterval(pollInterval)
          setPolling(false)
          
          // Fetch account data
          await fetchAccountData(consentId)
        } else if (statusResponse.data.status === 'REJECTED' || statusResponse.data.status === 'REVOKED') {
          clearInterval(pollInterval)
          setPolling(false)
          toast.error('Consent was rejected or revoked')
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setPolling(false)
          toast.error('Consent timeout. Please try again.')
        }
      } catch (error) {
        console.error('Error checking consent status:', error)
      }
    }, 10000) // Check every 10 seconds
  }

  const fetchAccountData = async (consentId) => {
    try {
      toast.loading('Fetching your bank accounts...')
      
      const response = await api.post('/setu/accounts/fetch', { consentId })
      
      toast.dismiss()
      toast.success('Indian bank accounts linked successfully!')
      
      if (onSuccess) {
        onSuccess(response.data.accounts)
      }
    } catch (error) {
      toast.dismiss()
      console.error('Failed to fetch account data:', error)
      toast.error('Failed to fetch account data')
    }
  }

  return (
    <div style={{
      padding: '24px',
      background: '#1a1f2e',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          🇮🇳 Connect Indian Bank Account
        </h3>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>
          Powered by Setu - RBI-approved Account Aggregator
        </p>
      </div>

      <div style={{
        padding: '12px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '6px',
        marginBottom: '16px'
      }}>
        <p style={{ color: '#f59e0b', fontSize: '12px', margin: '0 0 4px 0' }}>
          📱 <strong>Requirements:</strong>
        </p>
        <ul style={{ color: '#f59e0b', fontSize: '12px', margin: 0, paddingLeft: '20px' }}>
          <li>Phone number must be added in Settings</li>
          <li>Setu credentials must be configured (sign up at setu.co)</li>
        </ul>
      </div>

      <div style={{
        padding: '16px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '0 0 8px 0' }}>
          <strong>How it works:</strong>
        </p>
        <ol style={{ color: '#9ca3af', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
          <li>Click "Connect Bank Account" below</li>
          <li>A new window will open for consent</li>
          <li>Select your bank and approve the request</li>
          <li>Your accounts will be linked automatically</li>
        </ol>
      </div>

      <div style={{
        padding: '12px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '6px',
        marginBottom: '16px'
      }}>
        <p style={{ color: '#10b981', fontSize: '12px', margin: 0 }}>
          ✓ Secure & RBI-approved • 100+ banks supported • Your data is encrypted
        </p>
      </div>

      {polling && (
        <div style={{
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#3b82f6', fontSize: '14px', margin: 0 }}>
            ⏳ Waiting for consent approval... Please complete the consent in the opened window
          </p>
        </div>
      )}

      <button
        onClick={initiateConnection}
        disabled={loading || polling}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: (loading || polling) ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: (loading || polling) ? 'not-allowed' : 'pointer',
          boxShadow: (loading || polling) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}
      >
        {loading ? 'Initializing...' : polling ? 'Waiting for approval...' : '🇮🇳 Connect Indian Bank Account'}
      </button>

      <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>
        Secured by Setu • RBI Approved • Your data is encrypted
      </p>
    </div>
  )
}

export default SetuLink
