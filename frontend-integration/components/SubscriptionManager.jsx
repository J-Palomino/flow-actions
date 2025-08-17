import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { useUsageSubscription } from '../hooks/useUsageSubscription';
import { TX_STATUS } from '../config/flowConfig';
import StorageChecker from './StorageChecker';
import SubscriptionTile from './SubscriptionTile';
import AdminPricingControls from './AdminPricingControls';

const SubscriptionManager = () => {
    const {
        createSubscriptionVault,
        getUserSubscriptions,
        updateSubscription,
        deleteSubscription,
        checkFlowBalance,
        getFDCStatus,
        isLoading,
        error,
        txStatus,
        txDetails
    } = useUsageSubscription();

    const [user, setUser] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [providerAddress, setProviderAddress] = useState('0x6daee039a7b9c2f0');
    const [depositAmount, setDepositAmount] = useState('10.0');
    const [flowBalance, setFlowBalance] = useState(null);
    const [fdcStatus, setFdcStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);

    // Subscribe to user authentication
    useEffect(() => {
        fcl.currentUser.subscribe(setUser);
    }, []);

    // Load user data when authenticated
    useEffect(() => {
        if (user?.addr) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        if (!user?.addr) return;

        try {
            // Check FLOW balance
            const balance = await checkFlowBalance(user.addr);
            setFlowBalance(balance);

            // Get user subscriptions
            const userSubs = await getUserSubscriptions(user.addr);
            setSubscriptions(userSubs);

            // Check FDC status
            const fdc = await getFDCStatus();
            setFdcStatus(fdc);
        } catch (err) {
            console.error('Error loading user data:', err);
        }
    };

    const handleCreateSubscription = async () => {
        if (!user?.addr) {
            alert('Please connect your wallet first');
            return;
        }

        const result = await createSubscriptionVault(
            providerAddress, 
            parseFloat(depositAmount),
            user.addr
        );
        
        if (result.success) {
            alert(`✅ Subscription created!\n\nVault ID: ${result.vaultId}\nLiteLLM Key: ${result.litellmKey.slice(0, 20)}...\n\nView transaction: ${result.explorerUrl}`);
            await loadUserData(); // Refresh subscriptions
            setShowCreateForm(false);
        }
    };

    const handleUpdateSubscription = async (subscription) => {
        // This would open a modal or form to update subscription settings
        setSelectedSubscription(subscription);
        console.log('Update subscription:', subscription);
        // For demo, just show an alert
        alert(`Update subscription ${subscription.vaultId} - This would open an update form`);
    };

    const handleDeleteSubscription = async (subscription) => {
        if (!confirm(`Are you sure you want to delete subscription ${subscription.vaultId}? This will revoke the LiteLLM API key and cannot be undone.`)) {
            return;
        }

        try {
            await deleteSubscription(subscription.vaultId);
            alert(`✅ Subscription ${subscription.vaultId} deleted successfully`);
            await loadUserData(); // Refresh subscriptions
        } catch (err) {
            alert(`❌ Failed to delete subscription: ${err.message}`);
        }
    };

    const getTxStatusColor = (status) => {
        switch(status) {
            case TX_STATUS.PENDING: return '#FFA500';
            case TX_STATUS.EXECUTED: return '#4169E1';
            case TX_STATUS.SEALED: return '#00FF00';
            case TX_STATUS.ERROR: return '#FF0000';
            default: return '#808080';
        }
    };

    return (
        <div className="subscription-manager">
            {/* Header */}
            <div className="manager-header">
                <h1>🔗 FlareFlow.link</h1>
                <p>The premier platform for LiteLLM subscriptions with Flare oracle integration and Flow blockchain billing</p>
                <div className="network-info">
                    <span className="flare-badge">🔥 Flare Oracle</span>
                    <span className="flow-badge">⚡ Flow Blockchain</span>
                    <span className="integration-badge">🔑 LiteLLM Keys</span>
                </div>
            </div>

            {/* Wallet Connection */}
            <div className="wallet-section">
                <h2>👛 Wallet Connection</h2>
                {user?.addr ? (
                    <div className="wallet-connected">
                        <p>✅ Connected: {user.addr}</p>
                        <p>💰 FLOW Balance: {flowBalance !== null ? `${flowBalance.toFixed(4)} FLOW` : 'Loading...'}</p>
                        <button onClick={() => fcl.unauthenticate()} className="disconnect-button">
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <div className="wallet-disconnected">
                        <p>Connect your Flow wallet to manage subscriptions</p>
                        <button onClick={() => fcl.authenticate()} className="connect-button">
                            Connect Wallet
                        </button>
                    </div>
                )}
            </div>

            {/* FDC Status */}
            {fdcStatus && (
                <div className="fdc-status">
                    <h2>📡 Oracle Integration Status</h2>
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="status-label">FlareFlow.link Status:</span>
                            <span className="status-value active">● Operational</span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Oracle Integration:</span>
                            <span className="status-value active">● Connected</span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Blockchain Payments:</span>
                            <span className="status-value active">● Active</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Status */}
            {txStatus && (
                <div className="transaction-status" style={{ borderColor: getTxStatusColor(txStatus) }}>
                    <h3>📊 Transaction Status</h3>
                    <p>Status: <span style={{ color: getTxStatusColor(txStatus) }}>● {txStatus}</span></p>
                    {txDetails && (
                        <div className="tx-details">
                            <p>Block: {txDetails.blockId?.slice(0, 8)}...</p>
                            <p>Events: {txDetails.events?.length || 0}</p>
                            <a href={`https://www.flowdiver.io/tx/${txDetails.txId}`} target="_blank" rel="noopener noreferrer">
                                View on FlowDiver →
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="tab-navigation">
                <button 
                    onClick={() => setActiveTab('subscriptions')}
                    className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
                >
                    📋 My Subscriptions ({subscriptions.length})
                </button>
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                >
                    ➕ Create New
                </button>
                {user?.addr === '0x6daee039a7b9c2f0' && (
                    <button 
                        onClick={() => setActiveTab('admin')}
                        className={`tab-button admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
                    >
                        🔧 Admin Controls
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'subscriptions' && (
                    <div className="subscriptions-view">
                        <div className="subscriptions-header">
                            <h2>📋 Your FlareFlow.link Subscriptions</h2>
                            <p>Each subscription creates a unique LiteLLM API key with Flare oracle monitoring</p>
                        </div>

                        {user?.addr ? (
                            subscriptions.length > 0 ? (
                                <div className="subscriptions-grid">
                                    {subscriptions.map((subscription) => (
                                        <SubscriptionTile
                                            key={subscription.vaultId}
                                            subscription={subscription}
                                            onUpdate={handleUpdateSubscription}
                                            onDelete={handleDeleteSubscription}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-content">
                                        <h3>🆕 Welcome to FlareFlow.link</h3>
                                        <p>Create your first subscription to get started with oracle-powered LiteLLM billing</p>
                                        <button 
                                            onClick={() => setActiveTab('create')}
                                            className="create-first-button"
                                        >
                                            Create First Subscription
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="auth-required">
                                <p>🔐 Connect your wallet to view subscriptions</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="create-subscription">
                        <h2>🆕 Create FlareFlow.link Subscription</h2>
                        <p>Create a Flow blockchain subscription with Flare oracle monitoring and automatic LiteLLM API key generation</p>
                        
                        {user?.addr && <StorageChecker userAddress={user.addr} />}
                        
                        <div className="create-form">
                            <div className="form-group">
                                <label>Provider Address:</label>
                                <input
                                    type="text"
                                    value={providerAddress}
                                    onChange={(e) => setProviderAddress(e.target.value)}
                                    className="form-input"
                                    placeholder="0x..."
                                />
                                <div className="form-help">The service provider who will receive payments</div>
                            </div>

                            <div className="form-group">
                                <label>Initial Deposit (FLOW):</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    min="1"
                                    step="0.1"
                                    className="form-input"
                                    placeholder="10.0"
                                />
                                <div className="form-help">FLOW tokens deposited for usage-based payments</div>
                            </div>

                            <button
                                onClick={handleCreateSubscription}
                                disabled={isLoading || !user?.addr}
                                className="create-button"
                            >
                                {isLoading ? '⏳ Creating...' : '🚀 Create Subscription & API Key'}
                            </button>

                            <div className="creation-benefits">
                                <h4>What you'll get:</h4>
                                <ul>
                                    <li>✅ Unique LiteLLM API key for this subscription</li>
                                    <li>✅ Usage-based billing with real-time tracking</li>
                                    <li>✅ Flow blockchain security and transparency</li>
                                    <li>✅ Individual usage analytics and controls</li>
                                    <li>✅ Automatic cost optimization based on usage tiers</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <AdminPricingControls 
                        account={user?.addr}
                        onPricingUpdate={(config) => {
                            console.log('Admin pricing updated:', config);
                            // Refresh data if needed
                            loadUserData();
                        }}
                    />
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-message">
                    <strong>❌ Error:</strong> {error}
                </div>
            )}

            <style jsx>{`
                .subscription-manager {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                    font-family: 'Inter', sans-serif;
                }

                .manager-header {
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid #E5E7EB;
                }

                .manager-header h1 {
                    margin: 0 0 8px 0;
                    font-size: 32px;
                    font-weight: 700;
                    color: #111827;
                }

                .manager-header p {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    color: #6B7280;
                }

                .network-info {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .flare-badge, .flow-badge, .integration-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .flare-badge {
                    background: #FF6B35;
                    color: white;
                }

                .flow-badge {
                    background: #00D4FF;
                    color: white;
                }

                .integration-badge {
                    background: #8B5CF6;
                    color: white;
                }

                .wallet-section, .fdc-status {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .wallet-section h2, .fdc-status h2 {
                    margin: 0 0 16px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #111827;
                }

                .wallet-connected {
                    display: flex;
                    gap: 24px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .wallet-connected p {
                    margin: 0;
                    font-family: 'Monaco', monospace;
                    font-size: 14px;
                }

                .connect-button, .disconnect-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .connect-button {
                    background: #3B82F6;
                    color: white;
                }

                .connect-button:hover {
                    background: #2563EB;
                }

                .disconnect-button {
                    background: #F3F4F6;
                    color: #374151;
                    border: 1px solid #D1D5DB;
                }

                .disconnect-button:hover {
                    background: #E5E7EB;
                }

                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }

                .status-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #F9FAFB;
                    border-radius: 8px;
                    border: 1px solid #E5E7EB;
                }

                .status-label {
                    font-weight: 500;
                    color: #374151;
                }

                .status-value.active {
                    color: #10B981;
                    font-weight: 600;
                }

                .transaction-status {
                    background: white;
                    border: 2px solid;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .tx-details a {
                    color: #3B82F6;
                    text-decoration: none;
                }

                .tab-navigation {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 24px;
                    border-bottom: 1px solid #E5E7EB;
                }

                .tab-button {
                    padding: 12px 24px;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    font-weight: 500;
                    color: #6B7280;
                    transition: all 0.2s ease;
                }

                .tab-button:hover {
                    color: #374151;
                }

                .tab-button.active {
                    color: #3B82F6;
                    border-bottom-color: #3B82F6;
                }

                .tab-button.admin-tab.active {
                    color: #DC2626;
                    border-bottom-color: #DC2626;
                }

                .tab-content {
                    min-height: 400px;
                }

                .subscriptions-view {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 24px;
                }

                .subscriptions-header {
                    margin-bottom: 24px;
                    text-align: center;
                }

                .subscriptions-header h2 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: #111827;
                }

                .subscriptions-header p {
                    margin: 0;
                    color: #6B7280;
                }

                .subscriptions-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .empty-state, .auth-required {
                    text-align: center;
                    padding: 64px 24px;
                }

                .empty-content h3 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    color: #6B7280;
                }

                .empty-content p {
                    margin: 0 0 24px 0;
                    color: #9CA3AF;
                }

                .create-first-button {
                    padding: 12px 24px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .create-first-button:hover {
                    background: #2563EB;
                }

                .create-subscription {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 24px;
                }

                .create-subscription h2 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: #111827;
                }

                .create-subscription > p {
                    margin: 0 0 24px 0;
                    color: #6B7280;
                }

                .create-form {
                    max-width: 600px;
                    margin: 0 auto;
                }

                .form-group {
                    margin-bottom: 24px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }

                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s ease;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #3B82F6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .form-help {
                    margin-top: 4px;
                    font-size: 14px;
                    color: #6B7280;
                }

                .create-button {
                    width: 100%;
                    padding: 16px 24px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 24px;
                }

                .create-button:hover:not(:disabled) {
                    background: #2563EB;
                    transform: translateY(-1px);
                }

                .create-button:disabled {
                    background: #9CA3AF;
                    cursor: not-allowed;
                    transform: none;
                }

                .creation-benefits {
                    background: #F0F9FF;
                    border: 1px solid #BFDBFE;
                    border-radius: 8px;
                    padding: 20px;
                }

                .creation-benefits h4 {
                    margin: 0 0 12px 0;
                    color: #1E40AF;
                }

                .creation-benefits ul {
                    margin: 0;
                    padding-left: 20px;
                    list-style: none;
                }

                .creation-benefits li {
                    margin-bottom: 6px;
                    color: #1E40AF;
                }

                .error-message {
                    background: #FEF2F2;
                    border: 1px solid #FECACA;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 24px;
                    color: #DC2626;
                }

                @media (max-width: 768px) {
                    .manager-header h1 {
                        font-size: 24px;
                    }

                    .network-info {
                        flex-direction: column;
                        align-items: center;
                    }

                    .wallet-connected {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .tab-navigation {
                        flex-direction: column;
                    }

                    .tab-button {
                        text-align: left;
                        border-bottom: none;
                        border-left: 2px solid transparent;
                    }

                    .tab-button.active {
                        border-bottom: none;
                        border-left-color: #3B82F6;
                    }

                    .tab-button.admin-tab.active {
                        border-left-color: #DC2626;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubscriptionManager;