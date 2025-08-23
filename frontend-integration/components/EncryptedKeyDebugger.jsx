import React, { useState } from 'react';
import * as fcl from '@onflow/fcl';
import encryptionService from '../services/encryptionService';
import { useUsageSubscription } from '../hooks/useUsageSubscription';

export default function EncryptedKeyDebugger() {
    const [vaultId, setVaultId] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [encryptedData, setEncryptedData] = useState(null);
    const [decryptedKey, setDecryptedKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testResult, setTestResult] = useState(null);

    const { getEncryptedKeyData } = useUsageSubscription();

    // Auto-populate with current user address
    const getCurrentUser = async () => {
        try {
            const user = await fcl.currentUser.snapshot();
            if (user.addr) {
                setUserAddress(user.addr);
            }
        } catch (err) {
            console.error('Error getting current user:', err);
        }
    };

    React.useEffect(() => {
        getCurrentUser();
    }, []);

    const fetchEncryptedData = async () => {
        if (!vaultId) {
            setError('Please enter a vault ID');
            return;
        }

        setLoading(true);
        setError(null);
        setEncryptedData(null);
        setDecryptedKey('');

        try {
            console.log('🔍 Fetching encrypted key data for vault:', vaultId);
            const data = await getEncryptedKeyData(parseInt(vaultId, 10));
            
            if (data) {
                setEncryptedData(data);
                console.log('✅ Retrieved encrypted data:', data);
            } else {
                setError('No encrypted key data found for this vault');
            }
        } catch (err) {
            console.error('Error fetching encrypted data:', err);
            setError(`Failed to fetch encrypted data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const decryptKey = async () => {
        if (!encryptedData || !userAddress) {
            setError('Need encrypted data and user address to decrypt');
            return;
        }

        setLoading(true);
        setError(null);
        setDecryptedKey('');

        try {
            console.log('🔓 Decrypting API key...');
            const key = await encryptionService.decryptApiKey(
                encryptedData.encryptedApiKey,
                encryptedData.keyEncryptionSalt,
                userAddress
            );
            
            setDecryptedKey(key);
            console.log('✅ Successfully decrypted key');
        } catch (err) {
            console.error('Decryption error:', err);
            setError(`Failed to decrypt key: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testEncryptionCycle = async () => {
        if (!userAddress) {
            setError('Please enter a user address');
            return;
        }

        setLoading(true);
        setError(null);
        setTestResult(null);

        try {
            const testApiKey = 'sk-test-' + Math.random().toString(36).substring(2, 15);
            console.log('🧪 Testing encryption cycle with key:', testApiKey);

            // Encrypt
            const encrypted = await encryptionService.encryptApiKey(testApiKey, userAddress);
            console.log('✅ Encrypted successfully');

            // Decrypt
            const decrypted = await encryptionService.decryptApiKey(
                encrypted.encryptedData,
                encrypted.salt,
                userAddress
            );
            console.log('✅ Decrypted successfully');

            // Verify
            const isValid = await encryptionService.verifyEncryption(
                testApiKey,
                encrypted.encryptedData,
                encrypted.salt,
                userAddress
            );

            setTestResult({
                original: testApiKey,
                decrypted: decrypted,
                matches: testApiKey === decrypted,
                verificationPassed: isValid,
                encryptedData: encrypted.encryptedData.substring(0, 20) + '...',
                salt: encrypted.salt.substring(0, 20) + '...'
            });

        } catch (err) {
            console.error('Test error:', err);
            setError(`Test failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
            <h2>🔐 Encrypted Key Debugger</h2>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                <h3>Vault Key Retrieval & Decryption</h3>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>Vault ID: </label>
                    <input 
                        type="number" 
                        value={vaultId}
                        onChange={(e) => setVaultId(e.target.value)}
                        placeholder="Enter vault ID"
                        style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
                    />
                    <button 
                        onClick={fetchEncryptedData}
                        disabled={loading}
                        style={{ marginLeft: '10px', padding: '5px 15px' }}
                    >
                        {loading ? 'Fetching...' : 'Fetch Encrypted Data'}
                    </button>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>User Address: </label>
                    <input 
                        type="text" 
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="0x..."
                        style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
                    />
                    <button 
                        onClick={getCurrentUser}
                        style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
                    >
                        Use Current User
                    </button>
                </div>

                {encryptedData && (
                    <div style={{ marginBottom: '15px', padding: '10px', background: '#e9ecef', borderRadius: '3px' }}>
                        <strong>Encrypted Data Retrieved:</strong>
                        <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                            <div><strong>Encrypted Key:</strong> {encryptedData.encryptedApiKey?.substring(0, 50)}...</div>
                            <div><strong>Salt:</strong> {encryptedData.keyEncryptionSalt?.substring(0, 50)}...</div>
                        </div>
                        <button 
                            onClick={decryptKey}
                            disabled={loading || !userAddress}
                            style={{ marginTop: '10px', padding: '5px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
                        >
                            {loading ? 'Decrypting...' : 'Decrypt Key'}
                        </button>
                    </div>
                )}

                {decryptedKey && (
                    <div style={{ padding: '10px', background: '#d4edda', borderRadius: '3px', border: '1px solid #c3e6cb' }}>
                        <strong>✅ Decrypted API Key:</strong>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all', marginTop: '5px' }}>
                            {encryptionService.generateKeyPreview(decryptedKey)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#155724', marginTop: '5px' }}>
                            Full key: {decryptedKey.length} characters
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
                <h3>Encryption Test</h3>
                <p style={{ fontSize: '14px', margin: '10px 0' }}>
                    Test the full encrypt/decrypt cycle with a random API key.
                </p>
                
                <button 
                    onClick={testEncryptionCycle}
                    disabled={loading || !userAddress}
                    style={{ padding: '10px 20px', background: '#ffc107', color: '#212529', border: 'none', borderRadius: '3px' }}
                >
                    {loading ? 'Testing...' : 'Run Encryption Test'}
                </button>

                {testResult && (
                    <div style={{ marginTop: '15px', padding: '10px', background: testResult.matches && testResult.verificationPassed ? '#d4edda' : '#f8d7da', borderRadius: '3px' }}>
                        <div><strong>Original:</strong> {testResult.original}</div>
                        <div><strong>Decrypted:</strong> {testResult.decrypted}</div>
                        <div><strong>Match:</strong> {testResult.matches ? '✅ Yes' : '❌ No'}</div>
                        <div><strong>Verification:</strong> {testResult.verificationPassed ? '✅ Passed' : '❌ Failed'}</div>
                        <div style={{ fontSize: '12px', marginTop: '10px', color: '#6c757d' }}>
                            <div>Encrypted: {testResult.encryptedData}</div>
                            <div>Salt: {testResult.salt}</div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ padding: '10px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '3px', marginBottom: '15px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ fontSize: '12px', color: '#6c757d', borderTop: '1px solid #dee2e6', paddingTop: '15px' }}>
                <strong>How it works:</strong>
                <ol style={{ margin: '10px 0' }}>
                    <li>API keys are encrypted using AES-256-GCM with user's wallet address as key derivation input</li>
                    <li>Each encryption uses a unique salt stored alongside the encrypted data</li>
                    <li>Only the vault owner (with the correct wallet address) can decrypt the keys</li>
                    <li>Keys are stored on-chain in Flow blockchain for persistence and security</li>
                </ol>
            </div>
        </div>
    );
}