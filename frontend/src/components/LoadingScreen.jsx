import React from 'react'
import Logo from './Logo'

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #0a0e1a 0%, #0f1419 50%, #0a0e1a 100%)',
      zIndex: 9999
    }}>
      {/* Animated Logo */}
      <div style={{
        position: 'relative',
        marginBottom: '32px',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <div style={{ transform: 'scale(1.67)' }}>
          <Logo size="lg" />
        </div>
        
        {/* Rotating Ring */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          right: '-8px',
          bottom: '-8px',
          border: '3px solid transparent',
          borderTopColor: '#3b82f6',
          borderRadius: '20px',
          animation: 'spin 1.5s linear infinite'
        }} />
      </div>

      {/* Loading Text */}
      <div style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '12px'
      }}>
        {message}
      </div>

      {/* Loading Dots */}
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              background: '#3b82f6',
              borderRadius: '50%',
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes bounce {
          0%, 80%, 100% { 
            transform: translateY(0);
            opacity: 0.5;
          }
          40% { 
            transform: translateY(-12px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen
