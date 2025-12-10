import { useState, useEffect } from 'react';
import { DollarSign, Calendar, Tag, Store, Plus, X, TrendingDown } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Operations',
    merchant: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'Operations', 'Marketing', 'Utilities', 'Travel', 
    'Professional Services', 'Payroll', 'Meals & Entertainment', 'Other'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions', {
        params: { type: 'expense', limit: 100 }
      });
      setExpenses(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        ...formData,
        type: 'expense',
        amount: Math.abs(parseFloat(formData.amount))
      });
      toast.success('Expense added successfully');
      setShowForm(false);
      setFormData({
        amount: '',
        description: '',
        category: 'Operations',
        merchant: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Failed to create expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#ffffff',
              margin: 0,
              marginBottom: '8px'
            }}>
              Expenses
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Track and manage your business expenses
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: showForm ? '#374151' : '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>

        {/* Summary Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <TrendingDown size={24} color="#ffffff" />
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
              Total Expenses
            </span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#ffffff' }}>
            ${totalExpenses.toFixed(2)}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px' }}>
            {expenses.length} transactions
          </div>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <div style={{
            background: '#1a1f2e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '20px', fontSize: '18px' }}>
              Add New Expense
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0f1419',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0f1419',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="What was this expense for?"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0f1419',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                    Merchant
                  </label>
                  <input
                    type="text"
                    placeholder="Where did you spend?"
                    value={formData.merchant}
                    onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0f1419',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0f1419',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Save Expense
              </button>
            </form>
          </div>
        )}

        {/* Expenses List */}
        <div style={{
          background: '#1a1f2e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
              No expenses found. Add your first expense to get started.
            </div>
          ) : (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {expenses.map(expense => (
                  <div
                    key={expense.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#0f1419',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <DollarSign size={20} color="#ef4444" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '4px' }}>
                          {expense.description || expense.merchantName || 'Expense'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                          {expense.merchantName && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Store size={12} />
                              {expense.merchantName}
                            </span>
                          )}
                          {expense.aiCategory && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Tag size={12} />
                              {expense.aiCategory}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(expense.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#ef4444',
                      textAlign: 'right'
                    }}>
                      ${Math.abs(expense.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
