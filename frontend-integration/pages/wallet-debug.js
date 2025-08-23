import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';

export default function WalletDebug() {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('Initializing...');
    const [logs, setLogs] = useState([]);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    useEffect(() => {
        addLog('🚀 Starting FCL initialization...');
        
        // Minimal FCL config for debugging
        fcl.config()
            .put('accessNode.api', 'https://rest-mainnet.onflow.org')
            .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn')
            .put('flow.network', 'mainnet');
        
        addLog('✅ FCL configured');
        setStatus('Ready to connect');

        // Subscribe to user changes
        const unsubscribe = fcl.currentUser.subscribe(user => {
            addLog(`👤 User state changed: ${user?.loggedIn ? 'Logged In' : 'Not logged in'}`);
            if (user?.addr) {
                addLog(`📬 Address: ${user.addr}`);
            }
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    const connectWallet = async () => {
        try {
            setStatus('Connecting...');
            addLog('🔗 Starting authentication...');
            
            // Simple authenticate without extra config
            await fcl.authenticate();
            
            addLog('✅ Authentication complete');
            setStatus('Connected');
        } catch (error) {
            addLog(`❌ Error: ${error.message}`);
            setStatus('Connection failed');
            console.error('Full error:', error);
        }
    };

    const disconnectWallet = async () => {
        try {
            addLog('🔌 Disconnecting...');
            await fcl.unauthenticate();
            addLog('✅ Disconnected');
            setStatus('Disconnected');
        } catch (error) {
            addLog(`❌ Disconnect error: ${error.message}`);
        }
    };

    const testQuery = async () => {
        if (!user?.loggedIn) {
            addLog('❌ Please connect wallet first');
            return;
        }

        try {
            addLog('🔍 Testing mainnet query...');
            
            const script = `
                import FlowToken from 0x1654653399040a61
                import FungibleToken from 0xf233dcee88fe0abe
                
                access(all) fun main(address: Address): UFix64 {
                    let account = getAccount(address)
                    
                    // Try the standard FlowToken receiver path first
                    if let receiverRef = account.capabilities.get<&{FungibleToken.Balance}>(/public/flowTokenReceiver).borrow() {
                        return receiverRef.balance
                    }
                    
                    // Fallback to alternative paths that might exist
                    if let vaultRef = account.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance).borrow() {
                        return vaultRef.balance
                    }
                    
                    // If no public capability exists, return 0
                    return 0.0
                }
            `;
            
            const balance = await fcl.query({
                cadence: script,
                args: (arg, t) => [arg(user.addr, fcl.t.Address)]
            });
            
            addLog(`✅ Balance: ${balance} FLOW`);
        } catch (error) {
            addLog(`❌ Query error: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🔧 Flow Wallet Connection Debug</h1>
            
            <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                <strong>Status:</strong> {status}<br/>
                <strong>Connected:</strong> {user?.loggedIn ? 'Yes' : 'No'}<br/>
                {user?.addr && <><strong>Address:</strong> {user.addr}</>}
            </div>

            <div style={{ marginBottom: '20px' }}>
                {!user?.loggedIn ? (
                    <button onClick={connectWallet} style={{ padding: '10px 20px', marginRight: '10px' }}>
                        🔗 Connect Wallet
                    </button>
                ) : (
                    <>
                        <button onClick={disconnectWallet} style={{ padding: '10px 20px', marginRight: '10px' }}>
                            🔌 Disconnect
                        </button>
                        <button onClick={testQuery} style={{ padding: '10px 20px' }}>
                            💰 Check Balance
                        </button>
                    </>
                )}
            </div>

            <div style={{ background: '#1a1a1a', color: '#0f0', padding: '10px', borderRadius: '5px', maxHeight: '400px', overflow: 'auto' }}>
                <strong>Console Logs:</strong>
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>

            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <strong>Debug Info:</strong><br/>
                FCL Version: {fcl.VERSION || 'Unknown'}<br/>
                Network: Mainnet<br/>
                Access Node: https://rest-mainnet.onflow.org<br/>
                Discovery: https://fcl-discovery.onflow.org/authn
            </div>
        </div>
    );
}