import { useState, useEffect } from 'react';
import BankConnect from '../components/BankConnect';
import api from '../services/api';
import './Accounts.css';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingMock, setLoadingMock] = useState(false);
  const [showMockOptions, setShowMockOptions] = useState(false);
  const [mockStatus, setMockStatus] = useState({ mockDataAvailable: { plaid: true, setu: true }, linkedAccounts: [], sampleData: { plaid: {}, setu: {} } });

  useEffect(() => {
    fetchAccounts();
    fetchMockStatus();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMockStatus = async () => {
    try {
      const response = await api.get('/mock/status');
      setMockStatus(response.data);
    } catch (error) {
      console.error('Error fetching mock status:', error);
    }
  };

  const handlePlaidSuccess = () => {
    fetchAccounts();
  };

  const syncAllAccounts = async () => {
    setSyncing(true);
    try {
      await api.post('/accounts/sync');
      alert('All accounts synced successfully!');
      fetchAccounts();
    } catch (error) {
      console.error('Error syncing accounts:', error);
      alert('Error syncing accounts');
    } finally {
      setSyncing(false);
    }
  };

  const connectMockData = async (provider) => {
    setLoadingMock(true);
    setShowMockOptions(false);
    try {
      const response = await api.post(`/mock/${provider}/link`);
      alert(response.data.message);
      await fetchAccounts();
      await fetchMockStatus();
    } catch (error) {
      console.error(`Error connecting mock ${provider}:`, error);
      alert(error.response?.data?.error || `Failed to connect mock ${provider} data`);
    } finally {
      setLoadingMock(false);
    }
  };

  const removeMockAccounts = async () => {
    if (!window.confirm('Are you sure you want to remove all mock accounts and transactions?')) return;
    
    setLoadingMock(true);
    try {
      const response = await api.delete('/mock/accounts');
      alert(response.data.message);
      await fetchAccounts();
      await fetchMockStatus();
    } catch (error) {
      console.error('Error removing mock accounts:', error);
      alert(error.response?.data?.error || 'Failed to remove mock accounts');
    } finally {
      setLoadingMock(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  if (loading) {
    return <div className="loading">Loading accounts...</div>;
  }

  return (
    <div className="accounts-page">
      <div className="page-header">
        <div>
          <h1>Bank Accounts</h1>
          <p>Manage your connected bank accounts</p>
        </div>
        <div className="header-actions">
          {accounts.some(a => a.institutionName?.includes('Mock')) && (
            <button 
              onClick={removeMockAccounts}
              disabled={loadingMock}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loadingMock ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginRight: '10px'
              }}
            >
              {loadingMock ? 'Removing...' : '🗑️ Remove Mock Data'}
            </button>
          )}
          <button 
            onClick={() => setShowMockOptions(!showMockOptions)}
            style={{
              padding: '10px 20px',
              background: showMockOptions ? '#f59e0b' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginRight: '10px'
            }}
          >
            {showMockOptions ? '✕ Close' : '🧪 Mock Data'}
          </button>
          <button 
            onClick={syncAllAccounts} 
            className="btn-sync"
            disabled={syncing || accounts.length === 0}
          >
            {syncing ? '🔄 Syncing...' : '🔄 Sync All'}
          </button>
          <BankConnect onSuccess={handlePlaidSuccess} />
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <h2>No Bank Accounts Connected</h2>
          <p>Connect your bank accounts to start tracking your finances automatically</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
            <BankConnect onSuccess={handlePlaidSuccess} />
            <button 
              onClick={() => setShowMockOptions(!showMockOptions)}
              style={{ 
                padding: '12px 24px', 
                background: '#6b7280', 
                color: 'white', 
                borderRadius: '8px', 
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              🧪 Use Sample Data
            </button>
          </div>

          {showMockOptions && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: '#1f2937',
              borderRadius: '12px',
              maxWidth: '600px',
              margin: '20px auto'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#fff' }}>Connect Mock Data</h3>
              <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
                Test all features with sample transaction data. Choose a provider:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => connectMockData('plaid')}
                  disabled={loadingMock}
                  style={{
                    padding: '15px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loadingMock ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    opacity: loadingMock ? 0.6 : 1
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🇺🇸 Plaid Sample Data (US/CA Banks)
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Import sample transactions from plaid_sample_large.json
                  </div>
                </button>

                <button
                  onClick={() => connectMockData('setu')}
                  disabled={loadingMock}
                  style={{
                    padding: '15px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loadingMock ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    opacity: loadingMock ? 0.6 : 1
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🇮🇳 Setu Sample Data (Indian Banks)
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Import sample transactions from setu_sample_large.json
                  </div>
                </button>
              </div>

              {loadingMock && (
                <div style={{ marginTop: '15px', textAlign: 'center', color: '#9ca3af' }}>
                  Loading mock data...
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {showMockOptions && (
            <div style={{
              marginBottom: '20px',
              padding: '20px',
              background: '#1f2937',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#fff' }}>Connect Mock Data</h3>
              <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
                Add sample transaction data to test all features:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                <button
                  onClick={() => connectMockData('plaid')}
                  disabled={loadingMock}
                  style={{
                    padding: '15px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loadingMock ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    opacity: loadingMock ? 0.6 : 1
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🇺🇸 Plaid Sample Data
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    US/CA bank transactions
                  </div>
                </button>

                <button
                  onClick={() => connectMockData('setu')}
                  disabled={loadingMock}
                  style={{
                    padding: '15px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loadingMock ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    opacity: loadingMock ? 0.6 : 1
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🇮🇳 Setu Sample Data
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Indian bank transactions
                  </div>
                </button>
              </div>

              {loadingMock && (
                <div style={{ marginTop: '15px', textAlign: 'center', color: '#9ca3af' }}>
                  Loading mock data...
                </div>
              )}
            </div>
          )}

          <div className="total-balance-card">
            <div className="balance-label">Total Balance</div>
            <div className="balance-amount">${totalBalance.toFixed(2)}</div>
            <div className="balance-accounts">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</div>
          </div>

          <div className="accounts-grid">
            {accounts.map(account => (
              <div key={account.id} className="account-card">
                <div className="account-header">
                  <div className="account-icon">🏦</div>
                  <div className="account-info">
                    <h3>{account.name}</h3>
                    <p>{account.officialName || account.subtype}</p>
                  </div>
                </div>
                
                <div className="account-balance">
                  <div className="balance-label">Current Balance</div>
                  <div className="balance-amount">
                    ${parseFloat(account.balance || 0).toFixed(2)}
                  </div>
                </div>

                <div className="account-details">
                  <div className="detail-item">
                    <span className="detail-label">Account Type</span>
                    <span className="detail-value">{account.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Subtype</span>
                    <span className="detail-value">{account.subtype}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Synced</span>
                    <span className="detail-value">
                      {new Date(account.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="account-actions">
                  <button className="btn-view">View Transactions</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
