/**
 * Production Secure LiteLLM Oracle
 * 🔒 API key encrypted in vault → off-chain decryption → usage results only to Flow
 * 
 * Setup Instructions:
 * 1. Store encrypted API key: node setup-encrypted-oracle-key.js  
 * 2. Start oracle: ORACLE_DECRYPT_KEY=your_password node secure-litellm-oracle-production.js
 * 3. Monitor: tail -f logs/secure-oracle.log
 */

const crypto = require('crypto');
const axios = require('axios');
const fcl = require('@onflow/fcl');
const fs = require('fs');
const path = require('path');

// Load .env from root directory (two levels up)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class ProductionSecureLiteLLMOracle {
    constructor() {
        this.decryptPassword = process.env.ORACLE_DECRYPT_KEY;
        this.apiKey = null;
        this.isRunning = false;
        this.processedVaults = new Set();
        this.lastProcessTime = 0;
        
        // Flow configuration
        fcl.config()
            .put('accessNode.api', process.env.FLOW_NETWORK === 'testnet' 
                ? 'https://rest-testnet.onflow.org' 
                : 'https://rest-mainnet.onflow.org')
            .put('flow.network', process.env.FLOW_NETWORK || 'mainnet')
            .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn');
        
        this.contractAddress = process.env.FLOW_CONTRACT_ADDRESS || '0x6daee039a7b9c2f0';
        
        // Ensure logs directory exists
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
        
        this.log('🔒 Production Secure Oracle initialized');
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${message}`;
        
        console.log(logEntry);
        fs.appendFileSync('logs/secure-oracle.log', logEntry + '\n');
    }

    // Decrypt API key from Flow storage (SECURE)
    async loadApiKey() {
        try {
            this.log('🔐 Loading encrypted API key from Flow storage...');
            
            const script = `
                access(all) fun main(): String? {
                    let account = getAccount(${this.contractAddress})
                    if let storage = account.storage.borrow<&String>(from: /storage/LiteLLMOracleKey) {
                        return storage
                    }
                    return nil
                }
            `;
            
            const encryptedKey = await fcl.query({ cadence: script });
            
            if (!encryptedKey) {
                throw new Error('No encrypted API key found in storage');
            }
            
            // Decrypt off-chain (NEVER on blockchain)
            this.apiKey = this.decryptApiKey(encryptedKey);
            this.log('✅ API key decrypted successfully (off-chain)');
            
        } catch (error) {
            this.log(`❌ Failed to load API key: ${error.message}`);
            throw error;
        }
    }

    decryptApiKey(encryptedKey) {
        if (!this.decryptPassword) {
            throw new Error('ORACLE_DECRYPT_KEY environment variable required');
        }
        
        try {
            const parts = encryptedKey.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedData = parts[1];
            const key = crypto.scryptSync(this.decryptPassword, 'salt', 32);
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
            
        } catch (error) {
            throw new Error('Failed to decrypt API key - check ORACLE_DECRYPT_KEY');
        }
    }

    // Fetch usage data from LiteLLM API (OFF-CHAIN with decrypted key)
    async fetchLiteLLMUsage(vaultId) {
        if (!this.apiKey) await this.loadApiKey();
        
        try {
            // Real LiteLLM API call (adapt to your LiteLLM endpoint)
            const response = await axios.get(`${process.env.LITELLM_API_URL}/v1/usage/${vaultId}`, {
                headers: { 
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            if (!response.data) {
                throw new Error(`No usage data returned for vault ${vaultId}`);
            }
            
            this.log(`📊 Fetched usage for vault ${vaultId}: ${response.data.total_tokens} tokens`);
            
            return {
                vaultId: vaultId,
                totalTokens: response.data.total_tokens || 0,
                apiCalls: response.data.api_calls || 0,
                costEstimate: response.data.cost_estimate || 0.0,
                models: response.data.models || {},
                timestamp: response.data.timestamp || Date.now()
            };
            
        } catch (error) {
            // Handle different error types
            if (error.response?.status === 404) {
                this.log(`ℹ️  No new usage data for vault ${vaultId}`);
                return null; // No new usage
            } else if (error.response?.status === 401) {
                this.log(`🔑 Authentication failed for vault ${vaultId} - may need to refresh key`);
                this.apiKey = null; // Force key reload
                throw error;
            } else {
                this.log(`❌ API error for vault ${vaultId}: ${error.message}`);
                throw error;
            }
        }
    }

    // Submit ONLY usage results to Flow (NO API KEY EXPOSURE)
    async submitUsageResults(usageData) {
        try {
            this.log(`📤 Submitting usage results for vault ${usageData.vaultId}...`);
            
            const transaction = `
                import EncryptedUsageSubscriptions from ${this.contractAddress}
                
                transaction(vaultId: UInt64, tokens: UInt64, calls: UInt64, cost: UFix64) {
                    prepare(signer: auth(Storage) &Account) {
                        let usageReport = EncryptedUsageSubscriptions.UsageReport(
                            timestamp: getCurrentBlock().timestamp,
                            period: "oracle_production",
                            totalTokens: tokens,
                            apiCalls: calls,
                            models: {},
                            costEstimate: cost,
                            metadata: {
                                "source": "Production Secure Oracle",
                                "version": "1.0.0",
                                "vault_id": vaultId.toString()
                            }
                        )
                        
                        EncryptedUsageSubscriptions.updateUsageData(
                            vaultId: vaultId,
                            usageReport: usageReport,
                            source: "Production Secure LiteLLM Oracle"
                        )
                        
                        log("✅ Usage data processed - automatic payment triggered")
                    }
                }
            `;

            // Execute transaction
            const txId = await fcl.mutate({
                cadence: transaction,
                args: (arg, t) => [
                    arg(usageData.vaultId.toString(), t.UInt64),
                    arg(usageData.totalTokens.toString(), t.UInt64),
                    arg(usageData.apiCalls.toString(), t.UInt64),
                    arg(usageData.costEstimate.toFixed(6), t.UFix64)
                ],
                payer: fcl.authz,
                proposer: fcl.authz,
                authorizations: [fcl.authz],
                limit: 1000
            });

            this.log(`✅ Transaction submitted: ${txId}`);
            
            // Wait for confirmation
            const result = await fcl.tx(txId).onceSealed();
            this.log(`🎯 Usage processed for vault ${usageData.vaultId} - automatic payment triggered`);
            
            return result;
            
        } catch (error) {
            this.log(`❌ Failed to submit usage for vault ${usageData.vaultId}: ${error.message}`);
            throw error;
        }
    }

    // Monitor specific vaults for usage
    async processVault(vaultId) {
        try {
            // Check if we've processed this vault recently
            const vaultKey = `${vaultId}-${Math.floor(Date.now() / (5 * 60 * 1000))}`; // 5min buckets
            if (this.processedVaults.has(vaultKey)) {
                return; // Skip, processed recently
            }
            
            this.log(`🔍 Checking vault ${vaultId} for usage updates...`);
            
            // Fetch usage data (OFF-CHAIN)
            const usageData = await this.fetchLiteLLMUsage(vaultId);
            
            if (!usageData || usageData.totalTokens === 0) {
                this.log(`ℹ️  No billable usage found for vault ${vaultId}`);
                return;
            }
            
            // Submit results to Flow (NO API KEY EXPOSURE)
            await this.submitUsageResults(usageData);
            
            // Mark as processed
            this.processedVaults.add(vaultKey);
            this.log(`✅ Successfully processed vault ${vaultId}: $${usageData.costEstimate} → automatic FLOW payment`);
            
        } catch (error) {
            this.log(`❌ Error processing vault ${vaultId}: ${error.message}`);
        }
    }

    // Start continuous monitoring
    async start() {
        this.log('🚀 Starting Production Secure LiteLLM Oracle');
        this.log('='.repeat(50));
        this.log(`🔗 Flow Network: ${process.env.FLOW_NETWORK || 'mainnet'}`);
        this.log(`📡 Contract: ${this.contractAddress}`);
        this.log(`🔐 Encrypted API key will be loaded from Flow storage`);
        
        try {
            // Load encrypted API key
            await this.loadApiKey();
            
            // Get vault list from environment or config
            const vaultIds = (process.env.MONITOR_VAULT_IDS || '424965,746865,258663')
                .split(',')
                .map(id => parseInt(id.trim()));
            
            this.log(`📊 Monitoring ${vaultIds.length} vaults: ${vaultIds.join(', ')}`);
            this.log('');
            
            this.isRunning = true;
            
            // Continuous monitoring loop
            const monitorInterval = parseInt(process.env.MONITOR_INTERVAL || '300000'); // 5 minutes default
            this.log(`⏰ Oracle monitoring every ${monitorInterval / 1000} seconds`);
            
            setInterval(async () => {
                if (!this.isRunning) return;
                
                const cycleStart = Date.now();
                this.log(`🔄 Oracle cycle started at ${new Date().toISOString()}`);
                
                for (const vaultId of vaultIds) {
                    await this.processVault(vaultId);
                    
                    // Brief pause between vaults to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                const cycleTime = Date.now() - cycleStart;
                this.log(`⏱️  Oracle cycle completed in ${cycleTime}ms`);
                this.log('');
                
            }, monitorInterval);
            
            this.log('✅ Production oracle is now running continuously!');
            this.log('');
            this.log('🎯 Oracle Process:');
            this.log('   1. 🔐 Load encrypted API key from Flow (secure)');
            this.log('   2. 🔓 Decrypt key off-chain (never on blockchain)');
            this.log('   3. 📡 Query LiteLLM for usage data');
            this.log('   4. 📤 Submit only results to Flow contract');
            this.log('   5. 💰 Automatic FLOW payment triggered');
            this.log('   6. 🔄 Repeat every 5 minutes');
            this.log('');
            this.log('🛑 Press Ctrl+C to stop oracle');
            
        } catch (error) {
            this.log(`💥 Oracle startup failed: ${error.message}`);
            process.exit(1);
        }
    }

    // Graceful shutdown
    stop() {
        this.log('🛑 Oracle shutdown requested');
        this.isRunning = false;
        this.log('✅ Oracle stopped - automatic payments paused');
    }

    // Health check endpoint data
    getStatus() {
        return {
            isRunning: this.isRunning,
            hasApiKey: !!this.apiKey,
            flowNetwork: process.env.FLOW_NETWORK || 'mainnet',
            contractAddress: this.contractAddress,
            lastProcessTime: this.lastProcessTime,
            processedVaults: this.processedVaults.size,
            uptime: process.uptime()
        };
    }
}

// Start the production oracle
if (require.main === module) {
    const oracle = new ProductionSecureLiteLLMOracle();
    
    // Environment validation
    if (!process.env.ORACLE_DECRYPT_KEY) {
        console.error('❌ ORACLE_DECRYPT_KEY environment variable required');
        process.exit(1);
    }
    
    if (!process.env.LITELLM_API_URL) {
        console.error('❌ LITELLM_API_URL environment variable required');
        process.exit(1);
    }
    
    oracle.start().catch(error => {
        console.error('💥 Oracle failed:', error);
        process.exit(1);
    });
    
    // Graceful shutdown handlers
    process.on('SIGINT', () => oracle.stop());
    process.on('SIGTERM', () => oracle.stop());
    
    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
        oracle.log(`💥 Uncaught exception: ${error.message}`);
        oracle.stop();
        process.exit(1);
    });
}

module.exports = { ProductionSecureLiteLLMOracle };