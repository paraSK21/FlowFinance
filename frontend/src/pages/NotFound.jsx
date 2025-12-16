import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #0a0e1a 0%, #0f1419 50%, #0a0e1a 100%)',
      padding: '24px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{
          fontSize: '120px',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '24px',
          lineHeight: 1
        }}>
          404
        </div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '16px'
        }}>
          Page Not Found
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#9ca3af',
          marginBottom: '40px',
          lineHeight: 1.6
        }}>
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or deleted.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Home size={20} />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
