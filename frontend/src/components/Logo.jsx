import React from 'react'

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: '24px', height: '24px', fontSize: '14px' },
    md: { width: '32px', height: '32px', fontSize: '18px' },
    lg: { width: '48px', height: '48px', fontSize: '28px' },
    xl: { width: '64px', height: '64px', fontSize: '36px' }
  }

  const sizeStyle = sizes[size] || sizes.md

  return (
    <div 
      className={className}
      style={{
        width: sizeStyle.width,
        height: sizeStyle.height,
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        flexShrink: 0
      }}
    >
      <span style={{ 
        color: 'white', 
        fontSize: sizeStyle.fontSize, 
        fontWeight: '700',
        lineHeight: 1
      }}>
        F
      </span>
    </div>
  )
}

export default Logo
