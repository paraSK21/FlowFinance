import React, { useState, useEffect } from 'react'
import { DollarSign, Zap, TrendingUp, CheckCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Financing() {
  const [options, setOptions] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/financing/options', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOptions(response.data.options)
      setStats({
        avgMonthlyRevenue: response.data.avgMonthlyRevenue,
        currentBalance: response.data.currentBalance
      })
    } catch (error) {
      console.error('Failed to fetch financing options')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (option) => {
    setSelectedOption(option)
    setShowApplyModal(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', marginBottom: '24px' }}>
          One-Tap Financing
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Avg Monthly Revenue</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db' }}>
              ${(stats.avgMonthlyRevenue || 0).toFixed(2)}
            </p>
          </div>
          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Current Balance</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db' }}>
              ${(stats.currentBalance || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Financing Options */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db', marginBottom: '16px' }}>
            Available Financing Options
          </h2>
          {loading ? (
            <p style={{ color: '#9ca3af' }}>Loading options...</p>
          ) : options.length === 0 ? (
            <div style={{
              background: '#1a1f2e',
              borderRadius: '12px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#9ca3af', marginBottom: '8px' }}>No financing options available yet</p>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Build your revenue history to unlock financing options
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {options.map((option) => (
                <FinancingCard key={option.id} option={option} onApply={handleApply} />
              ))}
            </div>
          )}
        </div>

        {/* Benefits */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#d1d5db', marginBottom: '20px' }}>
            Why Choose Our Financing?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <BenefitCard
              icon={Zap}
              title="Instant Approval"
              description="Get approved in minutes, not days. Funds available within 24 hours."
              color="#f59e0b"
            />
            <BenefitCard
              icon={TrendingUp}
              title="Flexible Terms"
              description="Choose repayment terms that work for your business cash flow."
              color="#10b981"
            />
            <BenefitCard
              icon={CheckCircle}
              title="No Hidden Fees"
              description="Transparent pricing with no surprise charges or penalties."
              color="#3b82f6"
            />
          </div>
        </div>

        {showApplyModal && selectedOption && (
          <ApplyModal
            option={selectedOption}
            onClose={() => setShowApplyModal(false)}
            onSuccess={() => {
              setShowApplyModal(false)
              toast.success('Application submitted successfully!')
            }}
          />
        )}
      </div>
    </div>
  )
}

function FinancingCard({ option, onApply }) {
  return (
    <div style={{
      background: '#1a1f2e',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      transition: 'border-color 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db' }}>{option.name}</h3>
        {option.id === 'instant-5k' && <Zap size={24} color="#f59e0b" />}
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
          ${option.amount.toLocaleString()}
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>{option.term}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Fee:</span>
          <span style={{ color: '#d1d5db' }}>${option.fee}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#9ca3af' }}>APR:</span>
          <span style={{ color: '#d1d5db' }}>{option.apr}%</span>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>{option.description}</p>

      {option.noPersonalGuarantee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={16} color="#10b981" />
          <span style={{ fontSize: '12px', color: '#10b981' }}>No personal guarantee required</span>
        </div>
      )}

      <button
        onClick={() => onApply(option)}
        style={{
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Apply Now
      </button>
    </div>
  )
}

function BenefitCard({ icon: Icon, title, description, color }) {
  return (
    <div>
      <Icon size={32} color={color} style={{ marginBottom: '12px' }} />
      <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: '#9ca3af' }}>{description}</p>
    </div>
  )
}

function ApplyModal({ option, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: option.amount,
    purpose: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:5000/api/financing/apply', 
        { optionId: option.id, ...formData },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
    } catch (error) {
      toast.error('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(31, 41, 55, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#ffffff',
    outline: 'none'
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        background: '#1a1f2e',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '450px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#d1d5db', marginBottom: '20px' }}>
          Apply for {option.name}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={inputStyle}
              max={option.amount}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              placeholder="What will you use this financing for?"
              required
            />
          </div>
          <div style={{
            background: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>Amount:</span>
              <span style={{ color: '#d1d5db' }}>${formData.amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>Fee:</span>
              <span style={{ color: '#d1d5db' }}>${option.fee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>Term:</span>
              <span style={{ color: '#d1d5db' }}>{option.term}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: '600'
            }}>
              <span style={{ color: '#d1d5db' }}>Total to Repay:</span>
              <span style={{ color: '#d1d5db' }}>${(parseFloat(formData.amount) + option.fee).toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px',
                background: submitting ? '#6b7280' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(107, 114, 128, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#d1d5db',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Financing
