import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TaxDeductions() {
  const [deductions, setDeductions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeductions();
    fetchSummary();
  }, [filter, taxYear]);

  const fetchDeductions = async () => {
    try {
      const params = { taxYear };
      if (filter !== 'all') params.status = filter;
      
      const response = await api.get('/tax/deductions', { params });
      setDeductions(response.data);
    } catch (error) {
      console.error('Error fetching deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/tax/summary', { params: { taxYear } });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const runWeeklyScan = async () => {
    setScanning(true);
    try {
      const response = await api.post('/tax/weekly-scan');
      alert(`Scan complete! Found ${response.data.found} new deductions worth $${response.data.estimatedSavings.totalDeductions.toFixed(2)}`);
      fetchDeductions();
      fetchSummary();
    } catch (error) {
      console.error('Error running scan:', error);
      alert('Failed to run scan');
    } finally {
      setScanning(false);
    }
  };

  const updateDeduction = async (id, status) => {
    try {
      await api.put(`/tax/deductions/${id}`, { status });
      fetchDeductions();
      fetchSummary();
    } catch (error) {
      console.error('Error updating deduction:', error);
    }
  };

  const exportDeductions = async () => {
    try {
      const response = await api.get('/tax/export', { params: { taxYear } });
      const csv = convertToCSV(response.data);
      downloadCSV(csv, `tax-deductions-${taxYear}.csv`);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tax Deductions</h1>
        <div className="flex gap-3">
          <button
            onClick={runWeeklyScan}
            disabled={scanning}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : '🔍 Scan for Deductions'}
          </button>
          <button
            onClick={exportDeductions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => navigate('/tax-settings')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Total Deductions</div>
            <div className="text-2xl font-bold">${summary.totalDeductions.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Approved</div>
            <div className="text-2xl font-bold text-green-600">${summary.approvedTotal.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Pending Review</div>
            <div className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Est. Tax Savings</div>
            <div className="text-2xl font-bold text-blue-600">${summary.estimatedSavings.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
        <select
          value={taxYear}
          onChange={(e) => setTaxYear(parseInt(e.target.value))}
          className="px-4 py-2 border rounded-lg"
        >
          {[2024, 2023, 2022, 2021].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Deductions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {deductions.map((deduction) => (
              <tr key={deduction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(deduction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{deduction.category}</td>
                <td className="px-6 py-4 text-sm">{deduction.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  ${parseFloat(deduction.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {deduction.aiSuggested && (
                    <span className="text-blue-600">
                      {Math.round(deduction.aiConfidence * 100)}%
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    deduction.status === 'approved' ? 'bg-green-100 text-green-800' :
                    deduction.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {deduction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {deduction.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDeduction(deduction.id, 'approved')}
                        className="text-green-600 hover:text-green-800"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => updateDeduction(deduction.id, 'rejected')}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {deductions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No deductions found. Run a scan to find potential deductions!
          </div>
        )}
      </div>
    </div>
  );
}
