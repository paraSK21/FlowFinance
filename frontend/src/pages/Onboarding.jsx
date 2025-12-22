import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaidLink from '../components/PlaidLink';
import api from '../services/api';
import './Onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkAccounts();
  }, []);

  const checkAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
      if (response.data.length > 0) {
        setStep(2);
      }
    } catch (error) {
      console.error('Error checking accounts:', error);
    }
  };

  const handlePlaidSuccess = async () => {
    setLoading(true);
    await checkAccounts();
    setLoading(false);
    setStep(2);
  };

  const syncTransactions = async () => {
    console.log('syncTransactions called, syncing state:', syncing);
    if (syncing) {
      console.log('Already syncing, ignoring duplicate call');
      return;
    }
    
    setSyncing(true);
    try {
      console.log('Starting sync request...');
      const response = await api.post('/accounts/sync');
      console.log('Sync response:', response.data);
      const { synced, errors } = response.data;
      
      if (synced > 0) {
        alert(`Successfully synced ${synced} transactions! AI is categorizing them now...`);
      } else if (errors && errors.length > 0) {
        console.error('Sync errors:', errors);
        alert(`Warning: Some accounts failed to sync. ${synced} transactions synced.`);
      } else {
        alert('No new transactions to sync.');
      }
      
      // Go directly to dashboard after sync
      finishOnboarding();
    } catch (error) {
      console.error('Error syncing transactions:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Error syncing transactions: ${errorMsg}\n\nYou can skip this step and sync later from the Accounts page.`);
    } finally {
      console.log('Sync complete, setting syncing to false');
      setSyncing(false);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('onboarding_complete', 'true');
    navigate('/dashboard');
  };

  const skipForNow = () => {
    localStorage.setItem('onboarding_complete', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to FlowFinance! 🎉</h1>
          <p>Let's get your finances organized in 3 simple steps</p>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Connect Banks</div>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Sync Transactions</div>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">All Set!</div>
          </div>
        </div>

        <div className="onboarding-content">
          {step === 1 && (
            <div className="step-content">
              <div className="step-icon">🏦</div>
              <h2>Connect Your Bank Accounts</h2>
              <p>
                Securely connect your bank accounts to automatically import and categorize
                your transactions. We support over 10,000 banks!
              </p>
              
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Bank-level security (256-bit encryption)</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Read-only access (we can't move money)</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Automatic transaction sync every 4 hours</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>AI-powered categorization (90%+ accuracy)</span>
                </div>
              </div>

              <div className="action-buttons">
                <PlaidLink onSuccess={handlePlaidSuccess} />
                <button onClick={skipForNow} className="btn-secondary">
                  Skip for now
                </button>
              </div>

              {accounts.length > 0 && (
                <div className="connected-accounts">
                  <h3>Connected Accounts ({accounts.length})</h3>
                  {accounts.map(account => (
                    <div key={account.id} className="account-item">
                      <span className="account-name">{account.name}</span>
                      <span className="account-balance">
                        ${parseFloat(account.balance).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <div className="step-icon">🔄</div>
              <h2>Sync Your Transactions</h2>
              <p>
                Great! You've connected {accounts.length} account{accounts.length !== 1 ? 's' : ''}.
                Now let's import your transactions and let our AI categorize them.
              </p>

              <div className="connected-accounts-summary">
                {accounts.map(account => (
                  <div key={account.id} className="account-card">
                    <div className="account-info">
                      <h4>{account.name}</h4>
                      <p>{account.officialName || account.subtype}</p>
                    </div>
                    <div className="account-balance-large">
                      ${parseFloat(account.balance).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sync-info">
                <h3>What happens next?</h3>
                <ul>
                  <li>📥 Import last 30 days of transactions</li>
                  <li>🤖 AI categorizes each transaction automatically</li>
                  <li>📊 Generate your first financial reports</li>
                  <li>⚡ Takes about 30 seconds</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={syncTransactions} 
                  className="btn-primary"
                  disabled={syncing}
                >
                  {syncing ? 'Syncing Transactions...' : 'Sync Transactions Now'}
                </button>
                <button onClick={finishOnboarding} className="btn-secondary">
                  Skip to Dashboard
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <div className="step-icon">🎊</div>
              <h2>You're All Set!</h2>
              <p>
                Your transactions have been imported and categorized. 
                You're ready to take control of your finances!
              </p>

              <div className="success-stats">
                <div className="stat-card">
                  <div className="stat-number">{accounts.length}</div>
                  <div className="stat-label">Banks Connected</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">✓</div>
                  <div className="stat-label">Transactions Synced</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">🤖</div>
                  <div className="stat-label">AI Categorized</div>
                </div>
              </div>

              <div className="next-steps">
                <h3>What you can do now:</h3>
                <ul>
                  <li>📊 View your financial dashboard</li>
                  <li>💰 Create and send invoices</li>
                  <li>📈 Generate financial reports</li>
                  <li>💳 Track expenses</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button onClick={finishOnboarding} className="btn-primary">
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
