import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/expenses', formData);
      setShowForm(false);
      setFormData({
        amount: '',
        description: '',
        category: '',
        merchant: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense');
    }
  };

  return (
    <div className="expenses-page">
      <div className="header">
        <h1>Expenses</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="expense-form">
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          />
          <input
            type="text"
            placeholder="Merchant"
            value={formData.merchant}
            onChange={(e) => setFormData({...formData, merchant: e.target.value})}
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
          <button type="submit">Save Expense</button>
        </form>
      )}

      <div className="expenses-list">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-card">
            <div className="expense-info">
              <h3>{expense.description}</h3>
              <p>{expense.category}</p>
              <p>{expense.merchant}</p>
            </div>
            <div className="expense-amount">
              ${Math.abs(expense.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
