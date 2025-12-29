import React, { useState, useEffect } from 'react'
import { FileText, Plus, Send, DollarSign, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import './Invoices.css'

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices')
      setInvoices(response.data)
    } catch (error) {
      console.error('Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/invoices/stats/summary')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  const handleChaseInvoice = async (id) => {
    try {
      await api.post(`/invoices/${id}/chase`)
      toast.success('Chase notification sent!')
      fetchInvoices()
    } catch (error) {
      toast.error('Failed to send chase')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await api.post(`/invoices/${id}/mark-paid`)
      toast.success('Invoice marked as paid!')
      fetchInvoices()
      fetchStats()
    } catch (error) {
      toast.error('Failed to mark as paid')
    }
  }

  const handleDeleteInvoice = async (id, invoiceNumber) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return
    }
    
    try {
      await api.delete(`/invoices/${id}`)
      toast.success('Invoice deleted successfully!')
      fetchInvoices()
      fetchStats()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete invoice')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6b7280',
      sent: '#3b82f6',
      overdue: '#ef4444',
      paid: '#10b981',
      cancelled: '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div className="invoices-container">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="invoices-header">
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
            Invoice Management
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
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
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Plus size={20} />
            Create Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="invoices-stats">
          <StatCard icon={DollarSign} label="Total Due" value={`$${(stats.totalDue || 0).toFixed(2)}`} color="#3b82f6" />
          <StatCard icon={AlertCircle} label="Overdue" value={stats.overdueCount || 0} color="#ef4444" />
          <StatCard icon={CheckCircle} label="Total Paid" value={`$${(stats.totalPaid || 0).toFixed(2)}`} color="#10b981" />
        </div>

        {/* Invoices List */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#d1d5db', marginBottom: '20px' }}>
            All Invoices
          </h2>
          {loading ? (
            <p style={{ color: '#9ca3af' }}>Loading...</p>
          ) : invoices.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No invoices yet. Create your first invoice!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invoices.map((invoice) => (
                <div key={invoice.id} className="invoice-item">
                  <div className="invoice-left">
                    <FileText size={24} color="#3b82f6" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db' }}>
                        {invoice.invoiceNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{invoice.clientName}</div>
                    </div>
                  </div>
                  <div className="invoice-right">
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#d1d5db' }}>
                        ${invoice.amount}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      background: `${getStatusColor(invoice.status)}20`,
                      color: getStatusColor(invoice.status)
                    }}>
                      {invoice.status}
                    </span>
                    <div className="invoice-actions">
                      {invoice.status !== 'paid' ? (
                        <>
                          <button
                            onClick={() => handleChaseInvoice(invoice.id)}
                            style={{
                              padding: '8px 12px',
                              background: '#f59e0b',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            style={{
                              padding: '8px 12px',
                              background: '#10b981',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Mark Paid
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                          style={{
                            padding: '8px 12px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateInvoiceModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              fetchInvoices()
              fetchStats()
              setShowCreateModal(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: '#1a1f2e',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>{label}</p>
          <p style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>{value}</p>
        </div>
        <Icon size={32} color={color} />
      </div>
    </div>
  )
}

function CreateInvoiceModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    amount: '',
    dueDate: '',
    description: '',
    autoChaseEnabled: true
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/invoices', formData)
      toast.success('Invoice created successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to create invoice')
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
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#d1d5db', marginBottom: '20px' }}>
          Create Invoice
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            placeholder="Client Name"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="email"
            placeholder="Client Email"
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            style={inputStyle}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#d1d5db' }}>
            <input
              type="checkbox"
              checked={formData.autoChaseEnabled}
              onChange={(e) => setFormData({ ...formData, autoChaseEnabled: e.target.checked })}
              style={{ width: '16px', height: '16px' }}
            />
            Enable auto-chase for overdue invoices
          </label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
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
              Create Invoice
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

export default Invoices
