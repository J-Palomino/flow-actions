import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { useUsageSubscription } from '../hooks/useUsageSubscription';

const CreateSubscriptionForm = () => {
    const [user, setUser] = useState({ loggedIn: null });
    const [providerAddress, setProviderAddress] = useState('0xf8d6e0586b0a20c7'); // Default provider
    const [depositAmount, setDepositAmount] = useState('100.0');
    const [flowBalance, setFlowBalance] = useState(null);
    const [vaultInfo, setVaultInfo] = useState(null);
    const [topUpAmount, setTopUpAmount] = useState('50.0');

    const {
        createSubscriptionVault,
        getVaultInfo,
        checkFlowBalance,
        checkVaultExists,
        topUpSubscription,
        isLoading,
        error,
        txStatus
    } = useUsageSubscription();

    // Subscribe to user authentication state
    useEffect(() => {
        fcl.currentUser.subscribe(setUser);
    }, []);

    // Load user's Flow balance and vault info when connected
    useEffect(() => {
        if (user.loggedIn && user.addr) {
            loadUserData();
        }
    }, [user.loggedIn, user.addr]);

    const loadUserData = async () => {
        try {
            // Check Flow balance
            const balance = await checkFlowBalance(user.addr);
            setFlowBalance(balance);

            // Check if vault exists first
            const vaultExists = await checkVaultExists(user.addr);
            console.log('Vault exists:', vaultExists);

            if (vaultExists) {
                // Try to get vault info
                try {
                    const info = await getVaultInfo(user.addr);
                    console.log('Vault info:', info);
                    setVaultInfo(info);
                } catch (infoErr) {
                    console.error('Error getting vault info:', infoErr);
                    // Vault exists but can't read info - might be a capability issue
                    setVaultInfo({
                        exists: true,
                        error: 'Unable to read vault details. Check capability setup.'
                    });
                }
            } else {
                setVaultInfo(null);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
        }
    };

    const handleCreateSubscription = async (e) => {
        e.preventDefault();
        
        if (!user.loggedIn) {
            alert('Please connect your Flow wallet first');
            return;
        }

        if (flowBalance < parseFloat(depositAmount)) {
            alert('Insufficient Flow balance');
            return;
        }

        const result = await createSubscriptionVault(providerAddress, parseFloat(depositAmount));
        
        if (result.success) {
            alert(`✅ Subscription vault created! Vault ID: ${result.vaultId}`);
            // Reload user data to show new vault
            loadUserData();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        
        if (!user.loggedIn) {
            alert('Please connect your Flow wallet first');
            return;
        }

        if (flowBalance < parseFloat(topUpAmount)) {
            alert('Insufficient Flow balance');
            return;
        }

        const result = await topUpSubscription(parseFloat(topUpAmount));
        
        if (result.success) {
            alert(`✅ Successfully added ${topUpAmount} FLOW to your subscription!`);
            // Reload user data to show updated balance
            loadUserData();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    const connectWallet = () => fcl.authenticate();
    const disconnectWallet = () => fcl.unauthenticate();

    if (!user.loggedIn) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Usage-Based Subscriptions</h2>
                <p className="text-gray-600 mb-4">
                    Connect your Flow wallet to create a usage-based subscription vault for LiteLLM billing.
                </p>
                <button
                    onClick={connectWallet}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Connect Flow Wallet
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Usage-Based Subscription</h2>
                <button
                    onClick={disconnectWallet}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Disconnect ({user.addr})
                </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p><strong>Address:</strong> {user.addr}</p>
                <p><strong>Flow Balance:</strong> {flowBalance !== null ? `${flowBalance.toFixed(2)} FLOW` : 'Loading...'}</p>
                {vaultInfo && !vaultInfo.error && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-green-800"><strong>✅ Subscription Vault Active</strong></p>
                        <p>Balance: {parseFloat(vaultInfo.balance || 0).toFixed(2)} FLOW</p>
                        <p>Tier: {vaultInfo.tier || 'Unknown'}</p>
                        <p>Current Price: ${parseFloat(vaultInfo.currentPrice || 0).toFixed(4)}</p>
                    </div>
                )}
                {vaultInfo && vaultInfo.error && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded">
                        <p className="text-yellow-800"><strong>⚠️ Vault Found but Not Accessible</strong></p>
                        <p className="text-sm">{vaultInfo.error}</p>
                    </div>
                )}
            </div>

            {!vaultInfo || vaultInfo.error ? (
                /* Create Subscription Form */
                <form onSubmit={handleCreateSubscription}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Provider Address
                        </label>
                        <input
                            type="text"
                            value={providerAddress}
                            onChange={(e) => setProviderAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Deposit (FLOW)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-800 mb-2">💰 Variable Pricing Features:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>✅ Real-time usage tracking from LiteLLM</li>
                            <li>✅ Dynamic pricing with volume discounts</li>
                            <li>✅ Model-specific rates (GPT-4 premium, GPT-3.5 standard)</li>
                            <li>✅ Automatic payment entitlements based on actual usage</li>
                            <li>✅ Transparent blockchain billing</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">📊 Pricing Tiers:</h4>
                        <div className="text-sm text-yellow-700">
                            <p><strong>Starter:</strong> 0-100K tokens @ $0.02/1K (0% discount)</p>
                            <p><strong>Growth:</strong> 100K-1M tokens @ $0.015/1K (10% discount)</p>
                            <p><strong>Scale:</strong> 1M-10M tokens @ $0.01/1K (20% discount)</p>
                            <p><strong>Enterprise:</strong> 10M+ tokens @ $0.008/1K (30% discount)</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !flowBalance || flowBalance < parseFloat(depositAmount)}
                        className={`w-full py-3 px-4 rounded-lg font-medium ${
                            isLoading || !flowBalance || flowBalance < parseFloat(depositAmount)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                    >
                        {isLoading 
                            ? `Creating Subscription... (${txStatus})` 
                            : 'Create Usage-Based Subscription'
                        }
                    </button>

                    {txStatus && (
                        <div className="mt-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                txStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                txStatus === 'ERROR' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                                {txStatus}
                            </span>
                        </div>
                    )}
                </form>
            ) : (
                /* Existing Vault Management */
                <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">
                        🎉 Your Usage-Based Subscription is Active!
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p><strong>Vault ID:</strong> {vaultInfo.vaultId || 'N/A'}</p>
                                <p><strong>Balance:</strong> {parseFloat(vaultInfo.balance || 0).toFixed(2)} FLOW</p>
                                <p><strong>Current Tier:</strong> {vaultInfo.tier || 'Starter'}</p>
                            </div>
                            <div>
                                <p><strong>Current Price:</strong> ${parseFloat(vaultInfo.currentPrice || 0).toFixed(4)}</p>
                                <p><strong>Allowed Withdrawal:</strong> ${parseFloat(vaultInfo.allowedWithdrawal || 0).toFixed(4)}</p>
                                <p className="text-sm text-gray-600">
                                    Last updated: {vaultInfo.lastUpdate && parseFloat(vaultInfo.lastUpdate) > 0 
                                        ? new Date(parseFloat(vaultInfo.lastUpdate) * 1000).toLocaleString()
                                        : 'Never'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top Up Form */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-800 mb-3">💰 Add Funds to Subscription</h4>
                        <form onSubmit={handleTopUp} className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Amount in FLOW"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !flowBalance || flowBalance < parseFloat(topUpAmount)}
                                className={`px-4 py-2 rounded font-medium ${
                                    isLoading || !flowBalance || flowBalance < parseFloat(topUpAmount)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                {isLoading ? 'Adding...' : 'Add Funds'}
                            </button>
                        </form>
                        <p className="text-sm text-blue-700 mt-2">
                            Your current balance: {flowBalance ? flowBalance.toFixed(2) : '...'} FLOW
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={loadUserData}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            🔄 Refresh Data
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateSubscriptionForm;