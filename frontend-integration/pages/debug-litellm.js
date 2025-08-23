import React, { useState, useEffect } from 'react';
import litellmKeyService from '../services/litellmKeyService';

const DebugLiteLLM = () => {
    const [debugInfo, setDebugInfo] = useState({});
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check environment configuration
        const info = {
            baseURL: process.env.NEXT_PUBLIC_LITELLM_URL || 'https://llm.p10p.io',
            adminKey: process.env.NEXT_PUBLIC_LITELLM_ADMIN_KEY ? 
                process.env.NEXT_PUBLIC_LITELLM_ADMIN_KEY.slice(0, 10) + '...' : 'NOT SET',
            localStorageSubscriptions: localStorage.getItem('subscriptions') ? 
                JSON.parse(localStorage.getItem('subscriptions')).length : 0
        };
        setDebugInfo(info);

        // Also check what's in localStorage
        try {
            const allSubscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
            const subscriptionsWithKeys = allSubscriptions.filter(sub => sub.litellmKey);
            
            info.totalSubscriptions = allSubscriptions.length;
            info.subscriptionsWithKeys = subscriptionsWithKeys.length;
            info.subscriptionDetails = allSubscriptions.map(sub => ({
                vaultId: sub.vaultId,
                hasKey: !!sub.litellmKey,
                keyPreview: sub.litellmKey ? sub.litellmKey.slice(0, 20) + '...' : 'NO KEY'
            }));
        } catch (e) {
            info.localStorageError = e.message;
        }
        
        setDebugInfo(info);
    }, []);

    const testLiteLLMConnection = async () => {
        setLoading(true);
        const results = {};
        
        try {
            // Test 1: Basic connectivity
            results.connectivity = 'Testing...';
            setTestResults({...results});

            const response = await fetch(`${debugInfo.baseURL}/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LITELLM_ADMIN_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            results.connectivity = response.ok ? 'SUCCESS' : `Failed: ${response.status}`;
            setTestResults({...results});

            // Test 2: Try to fetch available models
            results.models = 'Testing...';
            setTestResults({...results});
            
            try {
                const models = await litellmKeyService.getAvailableModels();
                results.models = `SUCCESS: Found ${models.length} models`;
            } catch (modelErr) {
                results.models = `Failed: ${modelErr.message}`;
            }
            setTestResults({...results});

            // Test 3: Try to get usage data for first key if available
            const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
            const subWithKey = subscriptions.find(sub => sub.litellmKey);
            
            if (subWithKey) {
                results.usageData = 'Testing...';
                setTestResults({...results});
                
                try {
                    const usage = await litellmKeyService.getKeyUsage(subWithKey.litellmKey);
                    results.usageData = `SUCCESS: ${usage.usage_summary?.total_requests || 0} requests, $${usage.usage_summary?.total_cost || 0}`;
                } catch (usageErr) {
                    results.usageData = `Failed: ${usageErr.message}`;
                }
            } else {
                results.usageData = 'No keys found to test';
            }
            setTestResults({...results});

        } catch (error) {
            results.error = error.message;
            setTestResults({...results});
        }
        
        setLoading(false);
    };

    const clearLocalStorage = () => {
        if (confirm('Clear all subscription data from localStorage? This cannot be undone.')) {
            localStorage.removeItem('subscriptions');
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🔍 LiteLLM Debug Dashboard</h1>
            
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h2>📋 Configuration</h2>
                <p><strong>Base URL:</strong> {debugInfo.baseURL}</p>
                <p><strong>Admin Key:</strong> {debugInfo.adminKey}</p>
                <p><strong>Total Subscriptions in localStorage:</strong> {debugInfo.totalSubscriptions || 0}</p>
                <p><strong>Subscriptions with LiteLLM Keys:</strong> {debugInfo.subscriptionsWithKeys || 0}</p>
                
                {debugInfo.subscriptionDetails && (
                    <div>
                        <h3>Subscription Details:</h3>
                        {debugInfo.subscriptionDetails.map((sub, index) => (
                            <p key={index}>
                                Vault {sub.vaultId}: {sub.hasKey ? '✅' : '❌'} Key: {sub.keyPreview}
                            </p>
                        ))}
                    </div>
                )}
                
                {debugInfo.localStorageError && (
                    <p style={{ color: 'red' }}>❌ localStorage error: {debugInfo.localStorageError}</p>
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={testLiteLLMConnection} 
                    disabled={loading}
                    style={{ padding: '10px 20px', marginRight: '10px' }}
                >
                    🧪 Test LiteLLM Connection
                </button>
                
                <button 
                    onClick={clearLocalStorage}
                    style={{ padding: '10px 20px', background: '#ff4444', color: 'white' }}
                >
                    🗑️ Clear All Data
                </button>
            </div>

            {Object.keys(testResults).length > 0 && (
                <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <h2>🧪 Test Results</h2>
                    {Object.entries(testResults).map(([test, result]) => (
                        <p key={test}>
                            <strong>{test}:</strong> {result}
                        </p>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
                <h2>💡 Troubleshooting Tips</h2>
                <ul>
                    <li>Check if NEXT_PUBLIC_LITELLM_URL and NEXT_PUBLIC_LITELLM_ADMIN_KEY are set correctly</li>
                    <li>Verify LiteLLM server is running and accessible</li>
                    <li>Check browser network tab for failed requests</li>
                    <li>Ensure subscriptions were created successfully and keys stored in localStorage</li>
                    <li>Try creating a new subscription to see if keys are generated</li>
                </ul>
            </div>
        </div>
    );
};

export default DebugLiteLLM;