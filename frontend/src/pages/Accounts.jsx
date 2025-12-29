import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Plus, TrendingUp, TrendingDown, Calendar, DollarSign, CheckCircle, AlertCircle, Eye, Activity, CreditCard, PiggyBank, Wallet, BarChart3, Trash2 } from 'lucide-react';
import BankConnect from '../components/BankConnect';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Accounts.css';

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidSuccess = async () => {
    const wasEmpty = accounts.length === 0;
    
    toast.success('Bank account connected! Loading account details...');
    await fetchAccounts();
    
    // Always sync transactions after connecting
    toast.loading('Real-Time Transaction Sync using Plaid...', { id: 'sync' });
    try {
      const response = await api.post('/plaid/sync');
      const results = response.data.results || [];
      
      const totalSynced = results.reduce((sum, r) => sum + (r.synced || 0), 0);
      
      if (totalSynced > 0) {
        toast.success(`Successfully synced ${totalSynced} transactions!`, { id: 'sync' });
        
        // If this was the first account, redirect to dashboard after a moment
        if (wasEmpty) {
          toast.success('Setting up your dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } else {
        toast.success('Account connected! No new transactions found.', { id: 'sync' });
      }
      
      // Refresh accounts to show updated sync time
      await fetchAccounts();
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast.error('Account connected but sync failed. Try syncing manually.', { id: 'sync' });
    }
  };

  const syncAllAccounts = async () => {
    setSyncing(true);
    toast.loading('Real-Time Transaction Sync using Plaid...', { id: 'sync-all' });
    try {
      const response = await api.post('/plaid/sync');
      const results = response.data.results || [];
      
      const totalSynced = results.reduce((sum, r) => sum + (r.synced || 0), 0);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        toast.error(`Synced ${totalSynced} transactions with ${errors.length} errors`, { id: 'sync-all' });
      } else {
        toast.success(`Successfully synced ${totalSynced} transactions!`, { id: 'sync-all' });
      }
      
      await fetchAccounts();
    } catch (error) {
      console.error('Error syncing accounts:', error);
      const errorMsg = error.response?.data?.error || 'Failed to sync accounts';
      toast.error(`Error: ${errorMsg}`, { id: 'sync-all' });
    } finally {
      setSyncing(false);
    }
  };

  const deleteAccount = async (accountId, accountName) => {
    if (!window.confirm(`Are you sure you want to delete "${accountName}"? This will also delete all associated transactions.`)) {
      return;
    }

    toast.loading('Deleting account...', { id: 'delete-account' });
    try {
      await api.delete(`/accounts/${accountId}`);
      toast.success('Account deleted successfully', { id: 'delete-account' });
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account', { id: 'delete-account' });
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || acc.balance || 0), 0);
  const activeAccounts = accounts.filter(a => a.isActive !== false).length;
  
  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.accountType || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {});

  const totalChange = 0; // Will be calculated from real transaction data

  const getAccountIcon = (type) => {
    const icons = {
      'checking': Activity,
      'savings': PiggyBank,
      'credit': CreditCard,
      'investment': BarChart3
    };
    return icons[type?.toLowerCase()] || Wallet;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f1419',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} className="spin" style={{ margin: '0 auto 16px' }} />
          <div>Loading accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>
                Bank Accounts
              </h1>
              <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>
                Manage and monitor your connected financial accounts
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {accounts.length > 0 && (
                <button 
                  onClick={syncAllAccounts}
                  disabled={syncing}
                  style={{
                    padding: '12px 20px',
                    background: syncing ? '#374151' : 'rgba(59, 130, 246, 0.15)',
                    color: syncing ? '#9ca3af' : '#3b82f6',
                    border: `1px solid ${syncing ? '#374151' : 'rgba(59, 130, 246, 0.3)'}`,
                    borderRadius: '8px',
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={16} className={syncing ? 'spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync All'}
                </button>
              )}
              <BankConnect onSuccess={handlePlaidSuccess} />
            </div>
          </div>

          {/* Summary Cards */}
          {accounts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  filter: 'blur(30px)'
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DollarSign size={24} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Total Balance</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>
                        ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  {totalChange !== 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: totalChange >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {totalChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {totalChange >= 0 ? '+' : ''}${Math.abs(totalChange).toLocaleString()} this month
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Connected</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>
                      {accounts.length}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {new Set(accounts.map(a => a.institutionName)).size} institutions
                </div>
              </div>

              <div style={{
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={24} color="#a855f7" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Active</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>
                      {activeAccounts}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {accounts.length - activeAccounts} inactive
                </div>
              </div>

              <div style={{
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={24} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Account Types</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>
                      {Object.keys(accountsByType).length}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {Object.keys(accountsByType).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Type Breakdown */}
        {accounts.length > 0 && (
          <div style={{
            background: '#1a1f2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 16px 0' }}>
              Accounts by Type
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(accountsByType).map(([type, accs]) => {
                const Icon = getAccountIcon(type);
                const typeBalance = accs.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || acc.balance || 0), 0);
                const colors = getAccountTypeColor(type);
                
                return (
                  <div key={type} style={{
                    padding: '16px',
                    background: 'rgba(31, 41, 55, 0.3)',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={20} color={colors.text} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px', textTransform: 'capitalize' }}>
                        {type} ({accs.length})
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ${typeBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accounts Grid or Empty State */}
        {accounts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: '#1a1f2e',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Building2 size={40} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
              No Accounts Connected
            </h2>
            <p style={{ fontSize: '15px', color: '#9ca3af', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
              Connect your bank account to start tracking transactions, managing cash flow, and getting AI-powered insights
            </p>
            <BankConnect onSuccess={handlePlaidSuccess} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                All Accounts
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 16px',
                    background: viewMode === 'grid' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: `1px solid ${viewMode === 'grid' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    color: viewMode === 'grid' ? '#3b82f6' : '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 16px',
                    background: viewMode === 'list' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: `1px solid ${viewMode === 'list' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    color: viewMode === 'list' ? '#3b82f6' : '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  List View
                </button>
              </div>
            </div>

            <div style={{ 
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(380px, 1fr))' : 'none',
              flexDirection: viewMode === 'list' ? 'column' : 'none',
              gap: '20px' 
            }}>
              {accounts.map(account => {
                const isActive = account.isActive !== false;
                const balance = parseFloat(account.currentBalance || account.balance || 0);
                const lastSynced = account.lastSynced ? new Date(account.lastSynced) : null;
                const daysSinceSync = lastSynced ? Math.floor((Date.now() - lastSynced.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const Icon = getAccountIcon(account.accountType);
                const colors = getAccountTypeColor(account.accountType);
                
                return (
                  <div key={account.id} style={{
                    background: '#1a1f2e',
                    borderRadius: '12px',
                    padding: '24px',
                    border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative gradient */}
                    <div style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: colors.bg,
                      filter: 'blur(60px)',
                      opacity: 0.3,
                      pointerEvents: 'none'
                    }} />

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: colors.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${colors.border}`
                        }}>
                          <Icon size={24} color={colors.text} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>
                            {account.accountName || account.name}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                            {account.institutionName}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          textTransform: 'capitalize'
                        }}>
                          {account.accountType}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAccount(account.id, account.accountName || account.name);
                          }}
                          style={{
                            padding: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          title="Delete account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                  {/* Balance */}
                  <div style={{
                    padding: '20px',
                    background: 'rgba(31, 41, 55, 0.5)',
                    borderRadius: '10px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Current Balance</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
                      ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>Account ID</span>
                      <span style={{ fontSize: '13px', color: '#d1d5db', fontFamily: 'monospace' }}>
                        {account.accountId ? `****${account.accountId.slice(-4)}` : 'N/A'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        Last Synced
                      </span>
                      <span style={{ 
                        fontSize: '13px', 
                        color: daysSinceSync && daysSinceSync > 7 ? '#f59e0b' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {lastSynced ? (
                          <>
                            {lastSynced.toLocaleDateString()}
                            {daysSinceSync > 7 && <AlertCircle size={14} />}
                          </>
                        ) : (
                          'Never'
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>Status</span>
                      <span style={{ 
                        fontSize: '13px', 
                        color: isActive ? '#10b981' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isActive ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function getAccountTypeColor(type) {
  const colors = {
    'checking': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    'savings': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    'credit': { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
    'investment': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }
  };
  return colors[type?.toLowerCase()] || { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
}
