import { useState, useEffect } from 'react';
import { FileText, Calendar, Download, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function Reports() {
  const [reportType, setReportType] = useState('profit-loss');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { value: 'cash-flow', label: 'Cash Flow', icon: DollarSign },
    { value: 'expenses', label: 'Expense Report', icon: TrendingDown },
    { value: 'category', label: 'Category Breakdown', icon: BarChart3 }
  ];

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/transactions/stats/summary', {
        params: { startDate, endDate }
      });
      
      const transactions = await api.get('/transactions', {
        params: { startDate, endDate, limit: 1000 }
      });

      const data = response.data;
      const txns = transactions.data.transactions || [];

      // Calculate category breakdown
      const categoryBreakdown = {};
      txns.forEach(txn => {
        const category = txn.aiCategory || txn.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { income: 0, expense: 0, count: 0 };
        }
        if (txn.type === 'income') {
          categoryBreakdown[category].income += parseFloat(txn.amount || 0);
        } else {
          categoryBreakdown[category].expense += parseFloat(txn.amount || 0);
        }
        categoryBreakdown[category].count++;
      });

      setReportData({
        ...data,
        categoryBreakdown,
        transactions: txns
      });
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const renderProfitLoss = () => {
    if (!reportData) return null;
    
    const { income = 0, expenses = 0, netCashFlow = 0 } = reportData;
    const profitMargin = income > 0 ? ((netCashFlow / income) * 100).toFixed(1) : 0;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp size={24} color="#ffffff" />
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
              Total Income
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
            ${income.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingDown size={24} color="#ffffff" />
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
              Total Expenses
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
            ${expenses.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: netCashFlow >= 0 
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <DollarSign size={24} color="#ffffff" />
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
              Net Profit/Loss
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
            ${netCashFlow.toFixed(2)}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '8px' }}>
            Profit Margin: {profitMargin}%
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!reportData?.categoryBreakdown) return null;

    const categories = Object.entries(reportData.categoryBreakdown)
      .sort((a, b) => (b[1].expense + b[1].income) - (a[1].expense + a[1].income));

    return (
      <div style={{
        background: '#1a1f2e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '24px'
      }}>
        <h3 style={{ color: '#ffffff', marginBottom: '20px', fontSize: '18px' }}>
          Category Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map(([category, data]) => (
            <div
              key={category}
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
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '4px' }}>
                  {category}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {data.count} transactions
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {data.income > 0 && (
                  <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '4px' }}>
                    +${data.income.toFixed(2)}
                  </div>
                )}
                {data.expense > 0 && (
                  <div style={{ fontSize: '14px', color: '#ef4444' }}>
                    -${data.expense.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#ffffff',
            margin: 0,
            marginBottom: '8px'
          }}>
            Financial Reports
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Generate comprehensive financial reports and insights
          </p>
        </div>

        {/* Report Controls */}
        <div style={{
          background: '#1a1f2e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
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
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={generateReport}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: loading ? '#374151' : '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FileText size={18} />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
          <>
            {renderProfitLoss()}
            {renderCategoryBreakdown()}

            {/* Transaction Summary */}
            <div style={{
              background: '#1a1f2e',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#ffffff', fontSize: '18px', margin: 0 }}>
                  Report Summary
                </h3>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#0f1419', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                    Total Transactions
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff' }}>
                    {reportData.transactionCount || 0}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#0f1419', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                    Categories
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff' }}>
                    {Object.keys(reportData.categoryBreakdown || {}).length}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#0f1419', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                    Avg Transaction
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff' }}>
                    ${reportData.transactionCount > 0 
                      ? ((reportData.income + reportData.expenses) / reportData.transactionCount).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!reportData && !loading && (
          <div style={{
            background: '#1a1f2e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <FileText size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Select a date range and click "Generate Report" to view your financial data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
