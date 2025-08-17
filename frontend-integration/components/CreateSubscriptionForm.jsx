import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { useUsageSubscription } from '../hooks/useUsageSubscription';

const CreateSubscriptionForm = () => {
    const [user, setUser] = useState({ loggedIn: null });
    const [providerAddress, setProviderAddress] = useState('0xf8d6e0586b0a20c7'); // Default provider
    const [depositAmount, setDepositAmount] = useState('100.0');
    const [flowBalance, setFlowBalance] = useState(null);
    const [vaultInfo, setVaultInfo] = useState(null);

    const {
        createSubscriptionVault,
        getVaultInfo,
        checkFlowBalance,
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

            // Check if user already has a vault
            const info = await getVaultInfo(user.addr);
            setVaultInfo(info);
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
                {vaultInfo && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-green-800"><strong>✅ Subscription Vault Active</strong></p>
                        <p>Balance: {parseFloat(vaultInfo.balance).toFixed(2)} FLOW</p>
                        <p>Tier: {vaultInfo.tier}</p>
                        <p>Current Price: ${parseFloat(vaultInfo.currentPrice).toFixed(4)}</p>
                    </div>
                )}
            </div>

            {!vaultInfo ? (
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
                /* Existing Vault Display */
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">
                        🎉 Your Usage-Based Subscription is Active!
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p><strong>Vault Balance:</strong> {parseFloat(vaultInfo.balance).toFixed(2)} FLOW</p>
                        <p><strong>Current Tier:</strong> {vaultInfo.tier}</p>
                        <p><strong>Current Price:</strong> ${parseFloat(vaultInfo.currentPrice).toFixed(4)}</p>
                        <p><strong>Allowed Withdrawal:</strong> ${parseFloat(vaultInfo.allowedWithdrawal).toFixed(4)}</p>
                        <p className="text-sm text-gray-600 mt-2">
                            Last updated: {new Date(parseFloat(vaultInfo.lastUpdate) * 1000).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={loadUserData}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Refresh Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default CreateSubscriptionForm;