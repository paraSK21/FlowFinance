import React, { useState, useEffect } from 'react'
import { Bell, DollarSign, User, Save } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Settings() {
  const [profile, setProfile] = useState({})
  const [profitFirst, setProfitFirst] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchProfitFirst()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfile(response.data)
    } catch (error) {
      console.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfitFirst = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/profit-first/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfitFirst(response.data)
    } catch (error) {
      console.error('Failed to fetch Profit First settings')
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put('http://localhost:5000/api/auth/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleUpdateProfitFirst = async (e) => {
    e.preventDefault()
    
    const total = Object.values(profitFirst.settings || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0)
    if (total !== 100) {
      toast.error('Percentages must add up to 100%')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.put('http://localhost:5000/api/profit-first/settings', profitFirst, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Profit First settings updated!')
    } catch (error) {
      toast.error('Failed to update settings')
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', marginBottom: '24px' }}>
          Settings
        </h1>

        {/* Profile Settings */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <User size={24} color="#3b82f6" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
              Profile Settings
            </h2>
          </div>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName || ''}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.lastName || ''}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                Business Name
              </label>
              <input
                type="text"
                value={profile.businessName || ''}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                style={inputStyle}
                placeholder="+1234567890"
              />
            </div>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              <Save size={18} />
              Save Profile
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Bell size={24} color="#f59e0b" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
              Notification Preferences
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <NotificationToggle
              label="Email Notifications"
              description="Receive updates via email"
              checked={profile.notificationPreferences?.email || false}
              onChange={(checked) => setProfile({
                ...profile,
                notificationPreferences: {
                  ...profile.notificationPreferences,
                  email: checked
                }
              })}
            />
            <NotificationToggle
              label="SMS Notifications"
              description="Get text messages for important alerts"
              checked={profile.notificationPreferences?.sms || false}
              onChange={(checked) => setProfile({
                ...profile,
                notificationPreferences: {
                  ...profile.notificationPreferences,
                  sms: checked
                }
              })}
            />
            <NotificationToggle
              label="WhatsApp Notifications"
              description="Receive updates on WhatsApp"
              checked={profile.notificationPreferences?.whatsapp || false}
              onChange={(checked) => setProfile({
                ...profile,
                notificationPreferences: {
                  ...profile.notificationPreferences,
                  whatsapp: checked
                }
              })}
            />
          </div>
        </div>

        {/* Profit First Settings */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <DollarSign size={24} color="#10b981" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
              Profit First Account Splitting
            </h2>
          </div>
          <form onSubmit={handleUpdateProfitFirst} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={profitFirst.enabled || false}
                onChange={(e) => setProfitFirst({ ...profitFirst, enabled: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db' }}>Enable Profit First</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Automatically split income into different accounts</div>
              </div>
            </label>

            {profitFirst.enabled && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                      Profit %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={profitFirst.settings?.profit || 10}
                      onChange={(e) => setProfitFirst({
                        ...profitFirst,
                        settings: { ...profitFirst.settings, profit: parseFloat(e.target.value) }
                      })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                      Owner Pay %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={profitFirst.settings?.ownerPay || 50}
                      onChange={(e) => setProfitFirst({
                        ...profitFirst,
                        settings: { ...profitFirst.settings, ownerPay: parseFloat(e.target.value) }
                      })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                      Tax %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={profitFirst.settings?.tax || 15}
                      onChange={(e) => setProfitFirst({
                        ...profitFirst,
                        settings: { ...profitFirst.settings, tax: parseFloat(e.target.value) }
                      })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                      Operating Expenses %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={profitFirst.settings?.opex || 25}
                      onChange={(e) => setProfitFirst({
                        ...profitFirst,
                        settings: { ...profitFirst.settings, opex: parseFloat(e.target.value) }
                      })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'rgba(31, 41, 55, 0.5)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  Total: {Object.values(profitFirst.settings || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0)}%
                  {Object.values(profitFirst.settings || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0) !== 100 && (
                    <span style={{ color: '#ef4444', marginLeft: '8px' }}>(Must equal 100%)</span>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              <Save size={18} />
              Save Profit First Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'rgba(31, 41, 55, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <div>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{description}</div>
      </div>
    </label>
  )
}

export default Settings
