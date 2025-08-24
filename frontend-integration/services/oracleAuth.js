/**
 * Oracle Service Account Authentication
 * Handles Flow transactions using dedicated oracle account
 */

import { config, authz } from '@onflow/fcl';
import { ec as EC } from 'elliptic';
import { SHA3 } from 'sha3';

export class OracleAuth {
    constructor() {
        this.oracleAddress = process.env.ORACLE_FLOW_ADDRESS;
        this.privateKey = process.env.ORACLE_PRIVATE_KEY;
        this.keyId = parseInt(process.env.ORACLE_KEY_ID || '0');
        
        if (!this.oracleAddress || !this.privateKey) {
            throw new Error('Oracle Flow account credentials not configured');
        }
        
        this.setupFlowConfig();
    }
    
    setupFlowConfig() {
        config({
            'accessNode.api': process.env.FLOW_NETWORK === 'testnet' 
                ? 'https://rest-testnet.onflow.org'
                : 'https://rest-mainnet.onflow.org',
            'flow.network': process.env.FLOW_NETWORK || 'mainnet',
            'app.detail.title': 'LiteLLM Oracle Service',
            'service.OpenID.scopes': 'email'
        });
    }
    
    // Sign message with oracle private key
    signMessage(message) {
        const ec = new EC('p256');
        const key = ec.keyFromPrivate(Buffer.from(this.privateKey, 'hex'));
        const sha = new SHA3(256);
        sha.update(Buffer.from(message, 'hex'));
        const hash = sha.digest();
        const sig = key.sign(hash);
        
        const n = 32;
        const r = sig.r.toArrayLike(Buffer, 'be', n);
        const s = sig.s.toArrayLike(Buffer, 'be', n);
        
        return Buffer.concat([r, s]).toString('hex');
    }
    
    // Create authorization for oracle transactions
    createAuthz() {
        return {
            addr: this.oracleAddress,
            keyId: this.keyId,
            signingFunction: (signable) => {
                return {
                    addr: this.oracleAddress,
                    keyId: this.keyId,
                    signature: this.signMessage(signable.message)
                };
            }
        };
    }
    
    // Execute transaction as oracle service account
    async executeTransaction(cadence, args = []) {
        try {
            const authz = this.createAuthz();
            
            const txId = await fcl.mutate({
                cadence: cadence,
                args: args,
                payer: authz,
                proposer: authz,
                authorizations: [authz],
                limit: 1000
            });
            
            console.log(`Oracle transaction submitted: ${txId}`);
            
            // Wait for transaction to be sealed
            const result = await fcl.tx(txId).onceSealed();
            console.log(`Oracle transaction confirmed: ${txId}`);
            
            return { success: true, txId, result };
            
        } catch (error) {
            console.error('Oracle transaction failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Submit usage data using oracle account
    async submitUsageData(vaultId, usageReport) {
        const transaction = `
            import EncryptedUsageSubscriptions from ${process.env.FLOW_CONTRACT_ADDRESS}
            
            transaction(vaultId: UInt64, tokens: UInt64, calls: UInt64, cost: UFix64, source: String) {
                prepare(oracleSigner: auth(Storage) &Account) {
                    let usageReport = EncryptedUsageSubscriptions.UsageReport(
                        timestamp: getCurrentBlock().timestamp,
                        period: "oracle_service",
                        totalTokens: tokens,
                        apiCalls: calls,
                        models: {},
                        costEstimate: cost,
                        metadata: {
                            "source": source,
                            "oracle_account": "${this.oracleAddress}",
                            "automated": true
                        }
                    )
                    
                    // Oracle submits usage data on behalf of system
                    EncryptedUsageSubscriptions.updateUsageData(
                        vaultId: vaultId,
                        usageReport: usageReport,
                        source: source
                    )
                    
                    log("✅ Oracle processed usage data for vault ".concat(vaultId.toString()))
                }
            }
        `;
        
        const args = [
            { value: vaultId.toString(), type: 'UInt64' },
            { value: usageReport.totalTokens.toString(), type: 'UInt64' },
            { value: usageReport.apiCalls.toString(), type: 'UInt64' },
            { value: usageReport.costEstimate.toFixed(6), type: 'UFix64' },
            { value: 'Dedicated Oracle Service', type: 'String' }
        ];
        
        return this.executeTransaction(transaction, args);
    }
    
    // Get oracle account info
    getAccountInfo() {
        return {
            address: this.oracleAddress,
            keyId: this.keyId,
            role: 'Oracle Service Account',
            permissions: ['Submit Usage Data', 'Process Payments'],
            contractAddress: process.env.FLOW_CONTRACT_ADDRESS
        };
    }
}

export default OracleAuth;