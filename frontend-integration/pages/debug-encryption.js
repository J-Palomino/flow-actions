import React from 'react';
import EncryptedKeyDebugger from '../components/EncryptedKeyDebugger';

export default function DebugEncryption() {
    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            <div style={{ padding: '20px', textAlign: 'center', background: '#343a40', color: 'white' }}>
                <h1>🔐 Encryption Debug Console</h1>
                <p>Test and debug encrypted API key storage on Flow blockchain</p>
            </div>
            
            <EncryptedKeyDebugger />
        </div>
    );
}