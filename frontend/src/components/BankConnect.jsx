import React from 'react'
import PlaidLink from './PlaidLink'

function BankConnect({ onSuccess }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '24px',
      background: '#1a1f2e',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
        Connect Your Bank Account
      </h3>
      <p style={{ color: '#9ca3af', margin: '0 0 16px 0', fontSize: '14px' }}>
        Real-Time Transaction Sync using Plaid
      </p>

      <div style={{
        padding: '16px',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        marginBottom: '8px'
      }}>
        <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
          ✓ Supported Banks
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
          Connect to over 10,000+ banks in the US and Canada including Chase, Bank of America, 
          Wells Fargo, Citibank, and more.
        </div>
      </div>

      <PlaidLink onSuccess={onSuccess} />
    </div>
  )
}

export default BankConnect
