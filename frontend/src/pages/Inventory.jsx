import React, { useState, useEffect } from 'react'
import { Package, Plus, AlertTriangle, DollarSign } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Inventory() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
    fetchStats()
  }, [])

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setItems(response.data)
    } catch (error) {
      console.error('Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/inventory/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  const handleAdjustStock = async (id, adjustment) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://localhost:5000/api/inventory/${id}/adjust`, 
        { adjustment, reason: 'Manual adjustment' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Stock adjusted!')
      fetchItems()
      fetchStats()
    } catch (error) {
      toast.error('Failed to adjust stock')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
            Inventory Management
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
            Add Item
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard icon={Package} label="Total Items" value={stats.totalItems || 0} color="#3b82f6" />
          <StatCard icon={DollarSign} label="Total Value" value={`$${(stats.totalValue || 0).toFixed(2)}`} color="#10b981" />
          <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStockCount || 0} color="#f59e0b" />
          <StatCard icon={AlertTriangle} label="Out of Stock" value={stats.outOfStock || 0} color="#ef4444" />
        </div>

        {/* Items List */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#d1d5db', marginBottom: '20px' }}>
            All Items
          </h2>
          {loading ? (
            <p style={{ color: '#9ca3af' }}>Loading...</p>
          ) : items.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No items yet. Add your first inventory item!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item) => (
                <ItemRow key={item.id} item={item} onAdjust={handleAdjustStock} />
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateItemModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              fetchItems()
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

function ItemRow({ item, onAdjust }) {
  const getStockStatus = () => {
    if (item.quantity === 0) return { text: 'Out of Stock', color: '#ef4444' }
    if (item.quantity <= item.lowStockThreshold) return { text: 'Low Stock', color: '#f59e0b' }
    return { text: 'In Stock', color: '#10b981' }
  }

  const status = getStockStatus()

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
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Package size={24} color="#3b82f6" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#d1d5db' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>SKU: {item.sku}</div>
          {item.category && (
            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              background: 'rgba(107, 114, 128, 0.2)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#9ca3af'
            }}>
              {item.category}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: status.color }}>
            {item.quantity} units
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Threshold: {item.lowStockThreshold}
          </div>
          <div style={{ fontSize: '10px', color: status.color }}>{status.text}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Cost: ${item.costPrice}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Sell: ${item.sellingPrice}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAdjust(item.id, -1)}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            -
          </button>
          <button
            onClick={() => onAdjust(item.id, 1)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateItemModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    quantity: '',
    lowStockThreshold: '10',
    costPrice: '',
    sellingPrice: '',
    category: '',
    supplier: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:5000/api/inventory', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Item added successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to add item')
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
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#d1d5db', marginBottom: '20px' }}>
          Add Inventory Item
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            placeholder="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="text"
            placeholder="Item Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="number"
            placeholder="Low Stock Threshold"
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cost Price"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Selling Price"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
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
              Add Item
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

export default Inventory
