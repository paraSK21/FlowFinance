import { useState, useEffect } from 'react';
import BankConnect from '../components/BankConnect';
import api from '../services/api';
import './Accounts.css';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidSuccess = () => {
    fetchAccounts();
  };

  const syncAllAccounts = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/accounts/sync');
      const { synced } = response.data;
      alert(`Successfully synced ${synced} transactions!`);
      fetchAccounts();
    } catch (error) {
      console.error('Error syncing accounts:', error);
      const errorMsg = error.response?.data?.error || 'Failed to sync accounts';
      alert(`Error: ${errorMsg}`);
    } finally {
      setSyncing(false);
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
          <p className="subtitle">Manage your connected bank accounts</p>
        </div>
        <div className="header-actions">
          {accounts.length > 0 && (
            <button 
              onClick={syncAllAccounts}
              disabled={syncing}
              style={{
                padding: '10px 20px',
                background: syncing ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {syncing ? 'Syncing...' : '🔄 Sync All'}
            </button>
          )}
        </div>
      </div>

      {accounts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#1a1f2e',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏦</div>
          <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>No Accounts Connected</h2>
          <p style={{ color: '#9ca3af', marginBottom: '30px' }}>
            Connect your bank account to start tracking transactions
          </p>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <BankConnect onSuccess={handlePlaidSuccess} />
          </div>
        </div>
      ) : (
        <>
          <div className="accounts-summary">
            <div className="summary-card">
              <div className="summary-label">Total Balance</div>
              <div className="summary-value">${totalBalance.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Connected Accounts</div>
              <div className="summary-value">{accounts.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Active Accounts</div>
              <div className="summary-value">
                {accounts.filter(a => a.isActive).length}
              </div>
            </div>
          </div>

          <div className="accounts-grid">
            {accounts.map(account => (
              <div key={account.id} className="account-card">
                <div className="account-header">
                  <div>
                    <h3>{account.accountName || account.name}</h3>
                    <p className="institution-name">{account.institutionName}</p>
                  </div>
                  <div className="account-type-badge">
                    {account.accountType}
                  </div>
                </div>
                <div className="account-balance">
                  <div className="balance-label">Current Balance</div>
                  <div className="balance-amount">
                    ${parseFloat(account.currentBalance || account.balance || 0).toFixed(2)}
                  </div>
                </div>
                <div className="account-details">
                  <div className="detail-item">
                    <span className="detail-label">Account ID:</span>
                    <span className="detail-value">{account.accountId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Synced:</span>
                    <span className="detail-value">
                      {account.lastSynced 
                        ? new Date(account.lastSynced).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <BankConnect onSuccess={handlePlaidSuccess} />
          </div>
        </>
      )}
    </div>
  );
}
