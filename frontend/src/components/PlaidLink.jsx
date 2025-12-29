import React, { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import api from '../services/api'
import toast from 'react-hot-toast'

function PlaidLink({ onSuccess, onExit }) {
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createLinkToken()
  }, [])

  const createLinkToken = async () => {
    try {
      console.log('Creating Real-Time Transaction Sync using Plaid link token...')
      const response = await api.post('/plaid/create-link-token')
      console.log('Link token response:', response.data)
      setLinkToken(response.data.linkToken)
      console.log('Link token set successfully')
    } catch (error) {
      console.error('Failed to create link token:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // Store error for later display when user tries to connect
      setLinkToken(null)
      
      // Only show error in console, not as toast on page load
      if (error.response?.data?.error) {
        console.warn('Real-Time Transaction Sync using Plaid initialization error:', error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const onSuccessCallback = useCallback(async (publicToken, metadata) => {
    try {
      const response = await api.post('/plaid/exchange-public-token', { publicToken })
      toast.success('Bank account linked successfully!')
      
      if (onSuccess) {
        onSuccess(response.data.accounts)
      }
    } catch (error) {
      console.error('Failed to exchange token:', error)
      toast.error('Failed to link bank account')
    }
  }, [onSuccess])

  const config = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: (err, metadata) => {
      if (err) {
        console.error('Real-Time Transaction Sync using Plaid Link error:', err)
        toast.error('Bank connection cancelled')
      }
      if (onExit) {
        onExit(err, metadata)
      }
    },
  }

  const { open, ready } = usePlaidLink(config)

  if (loading) {
    return (
      <button
        disabled
        style={{
          padding: '10px 20px',
          background: '#6b7280',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'not-allowed'
        }}
      >
        Loading Real-Time Sync...
      </button>
    )
  }

  const handleClick = () => {
    if (!linkToken) {
      toast.error('Real-Time Transaction Sync using Plaid is not available. Please check your configuration.')
      return
    }
    open()
  }

  return (
    <button
      onClick={handleClick}
      disabled={!ready && linkToken !== null}
      style={{
        padding: '10px 20px',
        background: (ready || !linkToken) ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#6b7280',
        border: 'none',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: (ready || !linkToken) ? 'pointer' : 'not-allowed',
        boxShadow: (ready || !linkToken) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
      }}
    >
      Real-Time Transaction Sync using Plaid
    </button>
  )
}

export default PlaidLink
