import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { useUsageSubscription } from '../hooks/useUsageSubscription';
import { PRICING_TIERS, TX_STATUS } from '../config/flowConfig';
import StorageChecker from './StorageChecker';
import UsageDashboard from './UsageDashboard';

const SubscriptionDashboard = () => {
    const {
        createSubscriptionVault,
        topUpSubscription,
        getVaultInfo,
        checkFlowBalance,
        getFDCStatus,
        isLoading,
        error,
        txStatus,
        txDetails
    } = useUsageSubscription();

    const [user, setUser] = useState(null);
    const [providerAddress, setProviderAddress] = useState('0x6daee039a7b9c2f0'); // Your mainnet address
    const [depositAmount, setDepositAmount] = useState('10.0');
    const [topUpAmount, setTopUpAmount] = useState('5.0');
    const [flowBalance, setFlowBalance] = useState(null);
    const [vaultInfo, setVaultInfo] = useState(null);
    const [fdcStatus, setFdcStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('create');

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

            // Check vault info
            const vault = await getVaultInfo(user.addr);
            setVaultInfo(vault);

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

        const result = await createSubscriptionVault(providerAddress, parseFloat(depositAmount));
        
        if (result.success) {
            alert(`✅ Subscription created! Vault ID: ${result.vaultId}\n\nView transaction: ${result.explorerUrl}`);
            await loadUserData();
        }
    };

    const handleTopUp = async () => {
        if (!vaultInfo) {
            alert('No subscription found. Please create one first.');
            return;
        }

        const result = await topUpSubscription(parseFloat(topUpAmount));
        
        if (result.success) {
            alert(`✅ Top-up successful!\n\nView transaction: ${result.explorerUrl}`);
            await loadUserData();
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
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                <h1>🚀 Flow Usage-Based Subscriptions</h1>
                <p>Powered by Flare Oracle Integration on Flow Mainnet</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                    Contract: 0x6daee039a7b9c2f0 | Network: Mainnet
                </p>
            </div>

            {/* Wallet Connection */}
            <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
                <h2>👛 Wallet Connection</h2>
                {user?.addr ? (
                    <div>
                        <p>✅ Connected: {user.addr}</p>
                        <p>💰 FLOW Balance: {flowBalance !== null ? `${flowBalance.toFixed(4)} FLOW` : 'Loading...'}</p>
                        <button onClick={() => fcl.unauthenticate()} style={{ marginTop: '10px' }}>
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button onClick={() => fcl.authenticate()}>
                        Connect Wallet
                    </button>
                )}
            </div>

            {/* FDC Status */}
            {fdcStatus && (
                <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
                    <h2>📡 Flare Oracle Status</h2>
                    <p>Status: <span style={{ color: '#00FF00' }}>● {fdcStatus.integrationStatus}</span></p>
                    <p>Data Feed: <span style={{ color: '#00FF00' }}>● Active</span></p>
                    <p>Update Frequency: Every 5 minutes</p>
                    <details>
                        <summary>Supported Trigger Types</summary>
                        <ul>
                            {fdcStatus.supportedTriggerTypes?.map(type => (
                                <li key={type}>{type}</li>
                            ))}
                        </ul>
                    </details>
                </div>
            )}

            {/* Transaction Status */}
            {txStatus && (
                <div style={{ 
                    marginBottom: '30px', 
                    padding: '20px', 
                    border: `2px solid ${getTxStatusColor(txStatus)}`,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.05)'
                }}>
                    <h3>📊 Transaction Status</h3>
                    <p>Status: <span style={{ color: getTxStatusColor(txStatus) }}>● {txStatus}</span></p>
                    {txDetails && (
                        <div>
                            <p>Block: {txDetails.blockId?.slice(0, 8)}...</p>
                            <p>Events: {txDetails.events?.length || 0}</p>
                            <a 
                                href={`https://www.flowdiver.io/tx/${txDetails.txId}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#4169E1' }}
                            >
                                View on FlowDiver →
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('create')}
                    style={{ 
                        marginRight: '10px',
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'create' ? '#4169E1' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Create Subscription
                </button>
                <button 
                    onClick={() => setActiveTab('manage')}
                    style={{ 
                        marginRight: '10px',
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'manage' ? '#4169E1' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Manage Subscription
                </button>
                <button 
                    onClick={() => setActiveTab('usage')}
                    style={{ 
                        marginRight: '10px',
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'usage' ? '#4169E1' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Usage Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('pricing')}
                    style={{ 
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'pricing' ? '#4169E1' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Pricing Tiers
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'create' && (
                <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
                    <h2>🆕 Create Usage-Based Subscription</h2>
                    
                    {/* Storage Capacity Check */}
                    {user?.addr && <StorageChecker userAddress={user.addr} />}
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label>Provider Address:</label>
                        <input
                            type="text"
                            value={providerAddress}
                            onChange={(e) => setProviderAddress(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '10px',
                                marginTop: '5px',
                                fontFamily: 'monospace'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label>Initial Deposit (FLOW):</label>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            min="1"
                            step="0.1"
                            style={{ 
                                width: '100%', 
                                padding: '10px',
                                marginTop: '5px'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleCreateSubscription}
                        disabled={isLoading || !user?.addr}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: '#4169E1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Processing...' : 'Create Subscription'}
                    </button>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                        <h4>What happens next:</h4>
                        <ol>
                            <li>Your FLOW tokens are deposited into a subscription vault</li>
                            <li>Provider gets permission to charge based on actual usage</li>
                            <li>Flare oracle monitors your usage every 5 minutes</li>
                            <li>Pricing adjusts automatically based on consumption tiers</li>
                            <li>You only pay for what you use!</li>
                        </ol>
                    </div>
                </div>
            )}

            {activeTab === 'manage' && (
                <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
                    <h2>📈 Manage Subscription</h2>
                    
                    {vaultInfo ? (
                        <div>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                                <h3>Current Subscription</h3>
                                <p>Vault ID: #{vaultInfo.vaultId}</p>
                                <p>Balance: {parseFloat(vaultInfo.balance).toFixed(4)} FLOW</p>
                                <p>Current Tier: {vaultInfo.currentTier}</p>
                                <p>Current Price: ${parseFloat(vaultInfo.currentPrice).toFixed(6)}/1K tokens</p>
                                <p>Provider Can Withdraw: {parseFloat(vaultInfo.allowedWithdrawal).toFixed(4)} FLOW</p>
                                {vaultInfo.lastUsageTokens > 0 && (
                                    <p>Last Usage: {vaultInfo.lastUsageTokens} tokens</p>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label>Top-up Amount (FLOW):</label>
                                <input
                                    type="number"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    min="1"
                                    step="0.1"
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px',
                                        marginTop: '5px'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleTopUp}
                                disabled={isLoading}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: '#00AA00',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                            >
                                {isLoading ? 'Processing...' : 'Top Up Subscription'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p>No active subscription found.</p>
                            <p>Please create a subscription first.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'usage' && (
                <UsageDashboard 
                    vaultId={vaultInfo?.vaultId} 
                    account={user?.addr}
                />
            )}

            {activeTab === 'pricing' && (
                <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
                    <h2>💰 Dynamic Pricing Tiers</h2>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333' }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Tier</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Token Range</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Price/1K</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Discount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(PRICING_TIERS).map(tier => (
                                <tr key={tier.name} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '10px' }}>{tier.name}</td>
                                    <td style={{ padding: '10px' }}>{tier.range}</td>
                                    <td style={{ padding: '10px' }}>${tier.price}</td>
                                    <td style={{ padding: '10px' }}>{tier.discount}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                        <h4>Model Multipliers:</h4>
                        <ul>
                            <li>GPT-4: 1.5x base price (premium)</li>
                            <li>GPT-3.5: 0.8x base price (standard)</li>
                            <li>Claude: 1.2x base price</li>
                            <li>Llama: 0.6x base price</li>
                        </ul>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4ff', borderRadius: '4px' }}>
                        <h4>How Flare Oracle Works:</h4>
                        <ol>
                            <li>Your LiteLLM usage is tracked in real-time</li>
                            <li>Flare Data Connector aggregates usage data</li>
                            <li>Every 5 minutes, usage is sent to Flow blockchain</li>
                            <li>Smart contract calculates your tier and pricing</li>
                            <li>Provider can only withdraw the exact usage amount</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div style={{ 
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#ffcccc',
                    border: '1px solid #ff0000',
                    borderRadius: '4px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
};

export default SubscriptionDashboard;