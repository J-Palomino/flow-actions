import React, { useState, useEffect } from 'react';
import { useDynamicFlow } from '../hooks/useDynamicFlow';
import { useUsageSubscription } from '../hooks/useUsageSubscription';
import { TX_STATUS } from '../config/flowConfig';
import StorageChecker from './StorageChecker';
import SubscriptionTile from './SubscriptionTile';
import AdminPricingControls from './AdminPricingControls';
import TransactionSuccessModal from './TransactionSuccessModal';

const SubscriptionManager = () => {
    const {
        createSubscriptionVault,
        topUpSubscription,
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

    const {
        flowUser,
        isConnected,
        isConnecting,
        primaryWallet,
        dynamicUser,
        connectWallet,
        disconnectWallet
    } = useDynamicFlow();
    const [subscriptions, setSubscriptions] = useState([]);
    const [providerAddress, setProviderAddress] = useState('0x6daee039a7b9c2f0');
    const [depositAmount, setDepositAmount] = useState('10.0');
    const [flowBalance, setFlowBalance] = useState(null);
    const [fdcStatus, setFdcStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('subscriptions');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successTransactionData, setSuccessTransactionData] = useState(null);

    // Load user data when Dynamic wallet is connected
    useEffect(() => {
        if (isConnected && flowUser?.addr) {
            console.log('📊 Loading data for Dynamic wallet:', flowUser.addr);
            loadUserData();
        } else {
            // Clear data when disconnected
            setSubscriptions([]);
            setFlowBalance(null);
            setFdcStatus(null);
        }
    }, [isConnected, flowUser]);

    const loadUserData = async () => {
        if (!flowUser?.addr) return;

        try {
            console.log('📊 Loading user data for Dynamic wallet:', flowUser.addr);
            
            // Check FLOW balance
            const balance = await checkFlowBalance(flowUser.addr);
            setFlowBalance(balance);

            // Get user subscriptions
            const userSubs = await getUserSubscriptions(flowUser.addr);
            setSubscriptions(userSubs);

            // Check FDC status
            const fdc = await getFDCStatus();
            setFdcStatus(fdc);
            
            console.log('✅ Dynamic wallet data loaded successfully');
        } catch (err) {
            console.error('❌ Error loading Dynamic wallet data:', err);
        }
    };

    const handleConnectWallet = async () => {
        try {
            console.log('🔗 Connecting Dynamic wallet...');
            await connectWallet();
            console.log('✅ Dynamic wallet connection initiated');
        } catch (error) {
            console.error('❌ Dynamic wallet connection failed:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    };

    const handleDisconnectWallet = async () => {
        try {
            console.log('🔌 Disconnecting Dynamic wallet...');
            await disconnectWallet();
            console.log('✅ Dynamic wallet disconnected');
        } catch (error) {
            console.error('❌ Dynamic wallet disconnection failed:', error);
        }
    };

    const handleCreateSubscription = async () => {
        if (!isConnected || !flowUser?.addr) {
            alert('Please connect your Dynamic wallet first');
            return;
        }

        // Check if user has sufficient balance
        const requiredAmount = parseFloat(depositAmount);
        if (flowBalance !== null && flowBalance < requiredAmount) {
            alert(`Insufficient FLOW balance!\n\nRequired: ${requiredAmount} FLOW\nAvailable: ${flowBalance.toFixed(4)} FLOW\n\nPlease add more FLOW tokens to your wallet.`);
            return;
        }

        const result = await createSubscriptionVault(
            providerAddress, 
            requiredAmount,
            flowUser.addr
        );
        
        if (result.success) {
            // Show confetti and modal instead of alert
            setSuccessTransactionData({
                ...result,
                amount: requiredAmount
            });
            setShowSuccessModal(true);
            await loadUserData(); // Refresh subscriptions and balance
            setShowCreateForm(false);
        } else {
            alert(`❌ Subscription creation failed:\n\n${result.error}`);
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

    const handleTopUpSubscription = async (subscription) => {
        if (!flowUser?.addr) {
            alert('Please connect your wallet first');
            return;
        }

        const topUpAmount = prompt(`Top up subscription vault ${subscription.vaultId}\n\nHow much FLOW would you like to add?\n\nCurrent balance: ${subscription.balance || 0} FLOW\nYour wallet balance: ${flowBalance?.toFixed(4) || '...'} FLOW`, '5.0');
        
        if (!topUpAmount || isNaN(parseFloat(topUpAmount))) {
            return;
        }

        const amount = parseFloat(topUpAmount);
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        if (flowBalance !== null && flowBalance < amount) {
            alert(`Insufficient FLOW balance!\n\nRequired: ${amount} FLOW\nAvailable: ${flowBalance.toFixed(4)} FLOW`);
            return;
        }

        if (!subscription.vaultIdentifier) {
            alert('Cannot top up: Missing vault identifier. This subscription may be from an older version.');
            return;
        }

        try {
            const result = await topUpSubscription(amount, subscription.vaultIdentifier, subscription.vaultId);
            
            if (result.success) {
                // Show confetti and modal for successful top-up
                setSuccessTransactionData({
                    ...result,
                    litellmKey: subscription.litellmKey, // Include existing API key
                    isTopUp: true,
                    subscription: subscription
                });
                setShowSuccessModal(true);
                await loadUserData(); // Refresh subscriptions and balance
            } else {
                alert(`❌ Top-up failed:\n\n${result.error}`);
            }
        } catch (err) {
            alert(`❌ Top-up failed: ${err.message}`);
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

            {/* Dynamic Wallet Connection */}
            <div className="wallet-section">
                <h2>👛 Dynamic Wallet Connection</h2>
                {isConnected && flowUser?.addr ? (
                    <div className="wallet-connected">
                        <p>✅ Connected: {flowUser.addr}</p>
                        <p>💰 FLOW Balance: {flowBalance !== null ? `${flowBalance.toFixed(4)} FLOW` : 'Loading...'}</p>
                        {primaryWallet && (
                            <p>🔗 Wallet: {primaryWallet.connector?.name || 'Dynamic'}</p>
                        )}
                        <button onClick={handleDisconnectWallet} className="disconnect-button" disabled={isConnecting}>
                            {isConnecting ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    </div>
                ) : (
                    <div className="wallet-disconnected">
                        <p>Connect your Flow wallet via Dynamic to manage subscriptions</p>
                        <button onClick={handleConnectWallet} className="connect-button" disabled={isConnecting}>
                            {isConnecting ? 'Connecting...' : 'Connect Dynamic Wallet'}
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
                <button 
                    onClick={() => setActiveTab('help')}
                    className={`tab-button ${activeTab === 'help' ? 'active' : ''}`}
                >
                    📚 API Usage Guide
                </button>
                {flowUser?.addr === '0x6daee039a7b9c2f0' && (
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

                        {isConnected && flowUser?.addr ? (
                            subscriptions.length > 0 ? (
                                <div className="subscriptions-grid">
                                    {subscriptions.map((subscription) => (
                                        <SubscriptionTile
                                            key={subscription.vaultId}
                                            subscription={subscription}
                                            onUpdate={handleUpdateSubscription}
                                            onTopUp={handleTopUpSubscription}
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
                                <p>🔐 Connect your Dynamic wallet to view subscriptions</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="create-subscription">
                        <h2>🆕 Create FlareFlow.link Subscription</h2>
                        <p>Create a Flow blockchain subscription with Flare oracle monitoring and automatic LiteLLM API key generation</p>
                        
                        {flowUser?.addr && <StorageChecker userAddress={flowUser.addr} />}
                        
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
                                disabled={isLoading || !flowUser?.addr}
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

                {activeTab === 'help' && (
                    <div className="help-section">
                        <h2>📚 API Usage Guide</h2>
                        <p>Learn how to use your FlareFlow.link API keys with the OpenAI-compatible endpoint.</p>
                        
                        <div className="help-content">
                            <div className="help-card">
                                <h3>🌐 Endpoint Information</h3>
                                <div className="endpoint-details">
                                    <div className="endpoint-row">
                                        <strong>Base URL:</strong>
                                        <code className="endpoint-code">https://llm.p10p.io</code>
                                        <button onClick={() => navigator.clipboard.writeText('https://llm.p10p.io')} className="mini-copy-btn">📋</button>
                                    </div>
                                    <div className="endpoint-row">
                                        <strong>Chat Completions:</strong>
                                        <code className="endpoint-code">https://llm.p10p.io/v1/chat/completions</code>
                                        <button onClick={() => navigator.clipboard.writeText('https://llm.p10p.io/v1/chat/completions')} className="mini-copy-btn">📋</button>
                                    </div>
                                    <div className="endpoint-row">
                                        <strong>Embeddings:</strong>
                                        <code className="endpoint-code">https://llm.p10p.io/v1/embeddings</code>
                                        <button onClick={() => navigator.clipboard.writeText('https://llm.p10p.io/v1/embeddings')} className="mini-copy-btn">📋</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="help-card">
                                <h3>🚀 Quick Start</h3>
                                <ol className="help-steps">
                                    <li>Create a new subscription to get your unique API key</li>
                                    <li>Fund your subscription vault with FLOW tokens</li>
                                    <li>Copy your API key from the subscription tile</li>
                                    <li>Use the key with any OpenAI-compatible client</li>
                                    <li>Monitor usage and costs in real-time</li>
                                </ol>
                            </div>
                            
                            <div className="help-card">
                                <h3>🐍 Python Example</h3>
                                <div className="code-example">
                                    <code className="help-code-block">
{`# Install the OpenAI library
pip install openai

# Use with FlareFlow.link
from openai import OpenAI

client = OpenAI(
    api_key="your-flareflow-api-key",
    base_url="https://llm.p10p.io"
)

# Make a request
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Hello, world!"}
    ]
)

print(response.choices[0].message.content)`}
                                    </code>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText('from openai import OpenAI\n\nclient = OpenAI(\n    api_key="your-flareflow-api-key",\n    base_url="https://llm.p10p.io"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-3.5-turbo",\n    messages=[{"role": "user", "content": "Hello!"}]\n)')}
                                        className="copy-help-code"
                                    >
                                        📋 Copy Code
                                    </button>
                                </div>
                            </div>
                            
                            <div className="help-card">
                                <h3>🤖 Supported Models</h3>
                                <div className="help-models">
                                    <div className="model-category">
                                        <strong>OpenAI Models:</strong>
                                        <div className="model-tags">
                                            <span className="help-model-tag">gpt-3.5-turbo</span>
                                            <span className="help-model-tag">gpt-4</span>
                                            <span className="help-model-tag">gpt-4-turbo</span>
                                        </div>
                                    </div>
                                    <div className="model-category">
                                        <strong>Anthropic Models:</strong>
                                        <div className="model-tags">
                                            <span className="help-model-tag">claude-3-sonnet</span>
                                            <span className="help-model-tag">claude-3-haiku</span>
                                        </div>
                                    </div>
                                    <div className="model-category">
                                        <strong>Open Source:</strong>
                                        <div className="model-tags">
                                            <span className="help-model-tag">llama-2-70b</span>
                                            <span className="help-model-tag">mixtral-8x7b</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="help-card">
                                <h3>💰 Billing & Usage</h3>
                                <ul className="help-billing">
                                    <li><strong>Pay-as-you-go:</strong> Only pay for tokens you actually use</li>
                                    <li><strong>Real-time tracking:</strong> Monitor costs and usage live</li>
                                    <li><strong>Flow blockchain:</strong> Transparent, immutable billing</li>
                                    <li><strong>Top-up anytime:</strong> Add FLOW tokens to your subscription vault</li>
                                    <li><strong>Budget controls:</strong> Set spending limits per API key</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <AdminPricingControls 
                        account={flowUser?.addr}
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

            {/* Transaction Success Modal */}
            <TransactionSuccessModal 
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    setSuccessTransactionData(null);
                }}
                transactionData={successTransactionData}
            />

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

                /* Help Section Styles */
                .help-section {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 24px;
                }

                .help-section h2 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: #111827;
                }

                .help-section > p {
                    margin: 0 0 24px 0;
                    color: #6B7280;
                    font-size: 16px;
                }

                .help-content {
                    display: grid;
                    gap: 20px;
                }

                .help-card {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    padding: 20px;
                }

                .help-card h3 {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1E40AF;
                }

                .endpoint-details {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .endpoint-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .endpoint-code {
                    flex: 1;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 4px;
                    font-family: 'Monaco', monospace;
                    font-size: 14px;
                }

                .mini-copy-btn {
                    padding: 4px 8px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .mini-copy-btn:hover {
                    background: #2563EB;
                }

                .help-steps {
                    margin: 0;
                    padding-left: 20px;
                    color: #374151;
                }

                .help-steps li {
                    margin-bottom: 8px;
                }

                .code-example {
                    position: relative;
                    margin-top: 12px;
                }

                .help-code-block {
                    display: block;
                    padding: 16px;
                    background: #1F2937;
                    color: #F9FAFB;
                    border-radius: 6px;
                    font-family: 'Monaco', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }

                .copy-help-code {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    padding: 6px 12px;
                    background: #059669;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .copy-help-code:hover {
                    background: #047857;
                }

                .help-models {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .model-category {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .model-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .help-model-tag {
                    padding: 6px 12px;
                    background: #EBF4FF;
                    color: #1E40AF;
                    border: 1px solid #BFDBFE;
                    border-radius: 16px;
                    font-size: 13px;
                    font-weight: 500;
                }

                .help-billing {
                    margin: 0;
                    padding-left: 20px;
                    color: #374151;
                }

                .help-billing li {
                    margin-bottom: 8px;
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

                    .endpoint-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }

                    .help-code-block {
                        font-size: 11px;
                    }

                    .help-models {
                        gap: 12px;
                    }

                    .model-tags {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubscriptionManager;