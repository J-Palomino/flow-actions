import React, { useState, useEffect } from 'react';
import { fcl } from '../config/flowConfig';

const StorageChecker = ({ userAddress }) => {
    const [storageInfo, setStorageInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkStorageCapacity = async () => {
        if (!userAddress) return;
        
        setLoading(true);
        try {
            const result = await fcl.query({
                cadence: `
                    access(all) fun main(address: Address): {String: UFix64} {
                        let account = getAccount(address)
                        
                        return {
                            "available": account.storage.capacity,
                            "used": account.storage.used
                        }
                    }
                `,
                args: (arg, t) => [arg(userAddress, t.Address)]
            });
            
            const availableBytes = parseInt(result.available || 0) || 0;
            const usedBytes = parseInt(result.used || 0) || 0;
            const availableStorage = availableBytes - usedBytes;
            const storageNeeded = 5000; // Estimated bytes needed for subscription vault
            
            setStorageInfo({
                available: availableBytes,
                used: usedBytes,
                free: availableStorage,
                needsMoreStorage: availableStorage < storageNeeded,
                flowNeeded: availableStorage < storageNeeded ? 0.1 : 0
            });
        } catch (err) {
            console.error('Error checking storage:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userAddress) {
            checkStorageCapacity();
        }
    }, [userAddress]);

    if (!userAddress) return null;

    return (
        <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            border: storageInfo?.needsMoreStorage ? '2px solid #ff6b6b' : '1px solid #4CAF50',
            borderRadius: '8px',
            backgroundColor: storageInfo?.needsMoreStorage ? '#fff5f5' : '#f0fff0'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: storageInfo?.needsMoreStorage ? '#ff6b6b' : '#4CAF50' }}>
                {storageInfo?.needsMoreStorage ? '⚠️ Storage Check Failed' : '✅ Storage Check Passed'}
            </h3>
            
            {loading && <p>Checking storage capacity...</p>}
            
            {storageInfo && (
                <div>
                    <p><strong>Storage Used:</strong> {((storageInfo.used || 0) / 1024).toFixed(2)} KB</p>
                    <p><strong>Storage Available:</strong> {((storageInfo.available || 0) / 1024).toFixed(2)} KB</p>
                    <p><strong>Free Space:</strong> {((storageInfo.free || 0) / 1024).toFixed(2)} KB</p>
                    
                    {storageInfo.needsMoreStorage ? (
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>Action Required:</h4>
                            <p>Your account needs more FLOW tokens to store the subscription vault.</p>
                            <p><strong>Recommended:</strong> Add at least {storageInfo.flowNeeded} FLOW to your account.</p>
                            
                            <div style={{ marginTop: '10px' }}>
                                <h5>How to add FLOW:</h5>
                                <ol style={{ marginLeft: '20px', fontSize: '14px' }}>
                                    <li>Buy FLOW on an exchange (Kraken, Binance, etc.)</li>
                                    <li>Transfer to your wallet address: <code>{userAddress}</code></li>
                                    <li>Or get FLOW from Flow faucet (testnet only)</li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                            <p style={{ color: '#2e7d32', margin: 0 }}>
                                ✅ Sufficient storage capacity for subscription vault creation!
                            </p>
                        </div>
                    )}
                    
                    <button 
                        onClick={checkStorageCapacity}
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Recheck Storage
                    </button>
                </div>
            )}
        </div>
    );
};

export default StorageChecker;