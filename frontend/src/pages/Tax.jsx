import React, { useState, useEffect } from 'react'
import { FileText, Upload, Scan, Download, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Tax() {
  const [deductions, setDeductions] = useState([])
  const [summary, setSummary] = useState({})
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeductions()
    fetchSummary()
  }, [selectedYear])

  const fetchDeductions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/tax/deductions', {
        headers: { Authorization: `Bearer ${token}` },
        params: { taxYear: selectedYear }
      })
      setDeductions(response.data)
    } catch (error) {
      console.error('Failed to fetch deductions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/tax/summary', {
        headers: { Authorization: `Bearer ${token}` },
        params: { taxYear: selectedYear }
      })
      setSummary(response.data)
    } catch (error) {
      console.error('Failed to fetch summary')
    }
  }

  const handleScanTransactions = async () => {
    setScanning(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/tax/scan', {
        headers: { Authorization: `Bearer ${token}` },
        params: { taxYear: selectedYear }
      })
      toast.success(`Found ${response.data.found} potential deductions!`)
      fetchDeductions()
      fetchSummary()
    } catch (error) {
      toast.error('Failed to scan transactions')
    } finally {
      setScanning(false)
    }
  }

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:5000/api/tax/scan-receipt', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success('Receipt scanned successfully!')
      fetchDeductions()
      fetchSummary()
    } catch (error) {
      toast.error('Failed to scan receipt')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:5000/api/tax/deductions/${id}`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Deduction ${status}!`)
      fetchDeductions()
      fetchSummary()
    } catch (error) {
      toast.error('Failed to update deduction')
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/tax/export', {
        headers: { Authorization: `Bearer ${token}` },
        params: { taxYear: selectedYear }
      })
      
      const csv = convertToCSV(response.data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-deductions-${selectedYear}.csv`
      a.click()
      
      toast.success('Deductions exported!')
    } catch (error) {
      toast.error('Failed to export deductions')
    }
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    return [headers, ...rows].join('\n')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
            Tax Deduction Scanner
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '8px 16px',
                background: '#1a1f2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#d1d5db',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              {[2024, 2023, 2022, 2021].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <SummaryCard label="Total Deductions" value={`$${(summary.totalDeductions || 0).toFixed(2)}`} />
          <SummaryCard label="Approved" value={`$${(summary.approvedTotal || 0).toFixed(2)}`} color="#10b981" />
          <SummaryCard label="Pending Review" value={summary.pendingCount || 0} color="#f59e0b" />
          <SummaryCard label="Est. Tax Savings" value={`$${(summary.estimatedSavings || 0).toFixed(2)}`} color="#3b82f6" />
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <ActionCard
            icon={Scan}
            title="Auto-Scan Transactions"
            description="AI will analyze your transactions and find potential tax deductions"
            buttonText={scanning ? 'Scanning...' : 'Scan Transactions'}
            onClick={handleScanTransactions}
            disabled={scanning}
            color="#3b82f6"
          />
          <ActionCard
            icon={Upload}
            title="Upload Receipt"
            description="Upload a receipt image and AI will extract deduction details"
            buttonText="Upload Receipt"
            isFileUpload
            onFileChange={handleReceiptUpload}
            color="#10b981"
          />
        </div>

        {/* Deductions List */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#d1d5db', marginBottom: '20px' }}>
            Deductions for {selectedYear}
          </h2>
          {loading ? (
            <p style={{ color: '#9ca3af' }}>Loading...</p>
          ) : deductions.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No deductions found. Try scanning your transactions!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deductions.map((deduction) => (
                <DeductionRow key={deduction.id} deduction={deduction} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color = '#d1d5db' }) {
  return (
    <div style={{
      background: '#1a1f2e',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: '600', color }}>{value}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, title, description, buttonText, onClick, disabled, color, isFileUpload, onFileChange }) {
  return (
    <div style={{
      background: '#1a1f2e',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <Icon size={24} color={color} />
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#d1d5db' }}>{title}</h3>
      </div>
      <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>{description}</p>
      {isFileUpload ? (
        <label style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          background: color,
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center',
          cursor: 'pointer'
        }}>
          {buttonText}
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <button
          onClick={onClick}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '10px',
            background: disabled ? '#6b7280' : color,
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}

function DeductionRow({ deduction, onUpdateStatus }) {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      background: 'rgba(31, 41, 55, 0.3)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <FileText size={24} color="#3b82f6" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db' }}>{deduction.category}</span>
            {deduction.aiSuggested && (
              <span style={{
                padding: '2px 8px',
                background: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#a855f7'
              }}>
                AI {(deduction.aiConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{deduction.description}</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            {new Date(deduction.date).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
            ${deduction.amount}
          </div>
          <span style={{
            display: 'inline-block',
            marginTop: '4px',
            padding: '4px 12px',
            background: `${getStatusColor(deduction.status)}20`,
            borderRadius: '6px',
            fontSize: '11px',
            color: getStatusColor(deduction.status)
          }}>
            {deduction.status}
          </span>
        </div>
        {deduction.status === 'pending' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onUpdateStatus(deduction.id, 'approved')}
              style={{
                padding: '8px',
                background: '#10b981',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
              title="Approve"
            >
              <CheckCircle size={16} />
            </button>
            <button
              onClick={() => onUpdateStatus(deduction.id, 'rejected')}
              style={{
                padding: '8px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
              title="Reject"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tax
