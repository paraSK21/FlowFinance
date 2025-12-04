import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    businessName: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await dispatch(register(formData)).unwrap()
      toast.success('Account created successfully!')
      navigate('/')
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error?.error || error?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(31, 41, 55, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1419',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
          }}>
            <span style={{ color: 'white', fontSize: '32px', fontWeight: '700' }}>F</span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 8px 0'
          }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Start managing your cash flow in minutes
          </p>
        </div>

        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '8px'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '8px'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Business Name
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@company.com"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#6b7280' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
