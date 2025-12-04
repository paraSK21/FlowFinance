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
      const response = await api.get('/accounts');
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
          <BankConnect onSuccess={handlePlaidSuccess} />
        </div>
      ) : (
        <>
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
