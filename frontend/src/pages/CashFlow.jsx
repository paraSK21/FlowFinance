import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import api from '../services/api'
import { toast } from 'react-hot-toast'

function CashFlow() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    incomeChange: 0,
    expenseChange: 0,
    netChange: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);
      
      // Get current month transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get last month for comparison
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [currentMonth, lastMonth] = await Promise.all([
        api.get('/transactions/stats/summary', {
          params: {
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0]
          }
        }),
        api.get('/transactions/stats/summary', {
          params: {
            startDate: startOfLastMonth.toISOString().split('T')[0],
            endDate: endOfLastMonth.toISOString().split('T')[0]
          }
        })
      ]);

      const current = currentMonth.data;
      const last = lastMonth.data;

      const incomeChange = last.income > 0 
        ? ((current.income - last.income) / last.income * 100).toFixed(1)
        : 0;
      
      const expenseChange = last.expenses > 0
        ? ((current.expenses - last.expenses) / last.expenses * 100).toFixed(1)
        : 0;

      const currentNet = current.income - current.expenses;
      const lastNet = last.income - last.expenses;
      const netChange = lastNet !== 0
        ? ((currentNet - lastNet) / Math.abs(lastNet) * 100).toFixed(1)
        : 0;

      setStats({
        totalIncome: current.income || 0,
        totalExpenses: current.expenses || 0,
        netCashFlow: currentNet,
        incomeChange: parseFloat(incomeChange),
        expenseChange: parseFloat(expenseChange),
        netChange: parseFloat(netChange)
      });
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      toast.error('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9ca3af', fontSize: '16px' }}>Loading cash flow data...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
            Cash Flow Analysis
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Detailed breakdown of income and expenses
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={20} color="#10b981" />
              </div>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Total Income</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '600', color: '#10b981', margin: 0 }}>
              ${stats.totalIncome.toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: stats.incomeChange >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
              {stats.incomeChange >= 0 ? '+' : ''}{stats.incomeChange}% from last month
            </p>
          </div>

          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingDown size={20} color="#ef4444" />
              </div>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Total Expenses</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '600', color: '#ef4444', margin: 0 }}>
              ${stats.totalExpenses.toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: stats.expenseChange >= 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
              {stats.expenseChange >= 0 ? '+' : ''}{stats.expenseChange}% from last month
            </p>
          </div>

          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={20} color="#3b82f6" />
              </div>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Net Cash Flow</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '600', color: stats.netCashFlow >= 0 ? '#10b981' : '#ef4444', margin: 0 }}>
              ${Math.abs(stats.netCashFlow).toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: stats.netChange >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
              {stats.netChange >= 0 ? '+' : ''}{stats.netChange}% from last month
            </p>
          </div>
        </div>

        {/* Placeholder */}
        <div style={{
          background: '#1a1f2e',
          borderRadius: '12px',
          padding: '60px 24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '8px' }}>
            Detailed cash flow analysis coming soon!
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            View detailed breakdowns, patterns, and projections
          </p>
        </div>
      </div>
    </div>
  )
}

export default CashFlow
