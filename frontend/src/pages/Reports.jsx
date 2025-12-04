import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('profit-loss');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };
      const response = await api.get(`/api/reports/${reportType}`, { params });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <h1>Financial Reports</h1>
      
      <div className="report-controls">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="profit-loss">Profit & Loss</option>
          <option value="cash-flow">Cash Flow</option>
          <option value="sales">Sales Report</option>
          <option value="expenses">Expense Report</option>
          <option value="inventory">Inventory Report</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />

        <button onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {reportData && (
        <div className="report-results">
          <h2>{reportType.replace('-', ' ').toUpperCase()}</h2>
          <pre>{JSON.stringify(reportData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
