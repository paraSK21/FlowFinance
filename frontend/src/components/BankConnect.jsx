import React, { useState } from 'react'
import PlaidLink from './PlaidLink'
import SetuLink from './SetuLink'
import { Globe, MapPin } from 'lucide-react'

function BankConnect({ onSuccess }) {
  const [selectedRegion, setSelectedRegion] = useState(null)

  if (!selectedRegion) {
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
          Choose your region to connect your bank
        </p>

        {/* US/Canada Banks */}
        <button
          onClick={() => setSelectedRegion('us')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.2)'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.1)'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          <Globe size={24} color="#3b82f6" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              🇺🇸 🇨🇦 US / Canada Banks
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              Connect via Plaid - All major US and Canadian banks
            </div>
          </div>
        </button>

        {/* Indian Banks */}
        <button
          onClick={() => setSelectedRegion('india')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(16, 185, 129, 0.2)'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(16, 185, 129, 0.1)'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          <MapPin size={24} color="#10b981" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              🇮🇳 Indian Banks
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              Connect via Setu - RBI-approved Account Aggregator
            </div>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <button
        onClick={() => setSelectedRegion(null)}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          color: '#9ca3af',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← Back to region selection
      </button>

      {selectedRegion === 'us' ? (
        <PlaidLink onSuccess={onSuccess} />
      ) : (
        <SetuLink onSuccess={onSuccess} />
      )}
    </div>
  )
}

export default BankConnect
