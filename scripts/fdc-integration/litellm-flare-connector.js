/**
 * LiteLLM to Flare Oracle Connector
 * Monitors LiteLLM usage and pushes to Flare Data Connector (FDC)
 */

const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('ws');

class LiteLLMFlareConnector {
    constructor(config) {
        this.config = {
            // LiteLLM Configuration
            litellmApiUrl: config.litellmApiUrl || 'https://c1d44f34775bd04d0ec7a1f603cc2ff895d7d881-4000.dstack-prod7.phala.network',
            litellmApiKey: config.litellmApiKey,
            
            // Flare Configuration
            flareEndpoint: config.flareEndpoint || 'https://coston2-api.flare.network/ext/bc/C/rpc',
            flareApiKey: config.flareApiKey,
            submitterAddress: config.submitterAddress,
            submitterPrivateKey: config.submitterPrivateKey,
            
            // Flow Configuration
            flowContractAddress: config.flowContractAddress || '0x6daee039a7b9c2f0',
            flowNetwork: config.flowNetwork || 'mainnet',
            
            // Monitoring Configuration
            pollInterval: config.pollInterval || 300000, // 5 minutes
            batchSize: config.batchSize || 10,
            
            ...config
        };
        
        this.usageCache = new Map();
        this.lastProcessedTimestamp = Date.now();
        this.isRunning = false;
    }

    /**
     * Start monitoring LiteLLM usage
     */
    async start() {
        console.log('🚀 Starting LiteLLM → Flare Oracle Connector...');
        console.log(`📊 Monitoring: ${this.config.litellmApiUrl}`);
        console.log(`🔗 Flare Network: ${this.config.flareEndpoint}`);
        console.log(`⏱️  Update Interval: ${this.config.pollInterval / 1000}s`);
        
        this.isRunning = true;
        
        // Start periodic usage monitoring
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectAndSubmitUsage();
            } catch (error) {
                console.error('❌ Error in monitoring cycle:', error);
            }
        }, this.config.pollInterval);
        
        // Initial collection
        await this.collectAndSubmitUsage();
        
        console.log('✅ LiteLLM → Flare connector started successfully!');
    }

    /**
     * Stop monitoring
     */
    stop() {
        console.log('🛑 Stopping LiteLLM → Flare connector...');
        this.isRunning = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        console.log('✅ Connector stopped.');
    }

    /**
     * Collect usage data from LiteLLM and submit to Flare
     */
    async collectAndSubmitUsage() {
        console.log('📊 Collecting LiteLLM usage data...');
        
        try {
            // Step 1: Get usage data from LiteLLM
            const usageData = await this.getLiteLLMUsage();
            
            if (!usageData || usageData.length === 0) {
                console.log('ℹ️  No new usage data to process');
                return;
            }
            
            console.log(`📈 Processing ${usageData.length} usage records`);
            
            // Step 2: Process and aggregate usage by vault ID
            const aggregatedUsage = this.aggregateUsageByVault(usageData);
            
            // Step 3: Submit to Flare oracle for each vault
            for (const [vaultId, usage] of aggregatedUsage) {
                await this.submitToFlareOracle(vaultId, usage);
            }
            
            // Step 4: Update last processed timestamp
            this.lastProcessedTimestamp = Date.now();
            
            console.log('✅ Usage data collection and submission completed');
            
        } catch (error) {
            console.error('❌ Error collecting/submitting usage:', error);
            throw error;
        }
    }

    /**
     * Get usage data from LiteLLM API
     */
    async getLiteLLMUsage() {
        try {
            // Use LiteLLM proxy spend/logs endpoint
            const response = await axios.get(`${this.config.litellmApiUrl}/spend/logs`, {
                headers: {
                    'Authorization': `Bearer ${this.config.litellmApiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    start_date: new Date(this.lastProcessedTimestamp).toISOString(),
                    end_date: new Date().toISOString()
                }
            });
            
            return this.transformSpendLogsData(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                // Try alternative endpoint
                return await this.getLiteLLMUsageAlternative();
            }
            throw new Error(`LiteLLM API error: ${error.message}`);
        }
    }

    /**
     * Alternative method to get LiteLLM usage (for different LiteLLM versions)
     */
    async getLiteLLMUsageAlternative() {
        try {
            // Try global spend logs
            const response = await axios.get(`${this.config.litellmApiUrl}/global/spend/logs`, {
                headers: {
                    'Authorization': `Bearer ${this.config.litellmApiKey}`
                },
                params: {
                    start_date: new Date(this.lastProcessedTimestamp).toISOString(),
                    end_date: new Date().toISOString()
                }
            });
            
            return this.transformSpendLogsData(response.data);
        } catch (error) {
            console.warn('⚠️  Could not fetch usage from alternative endpoint:', error.message);
            return [];
        }
    }

    /**
     * Transform spend logs data from LiteLLM proxy
     */
    transformSpendLogsData(data) {
        if (!data || !Array.isArray(data)) return [];
        
        return data.map(record => ({
            user_id: record.user || record.end_user || record.metadata?.user_api_key_user_id || record.session_id || 'api_user',
            model: record.model || 'unknown',
            prompt_tokens: record.prompt_tokens || 0,
            completion_tokens: record.completion_tokens || 0,
            total_tokens: record.total_tokens || (record.prompt_tokens || 0) + (record.completion_tokens || 0),
            timestamp: record.startTime || record.timestamp || record.created_at,
            api_calls: 1,
            cost: record.spend || 0,
            request_id: record.request_id,
            status: record.status || 'unknown'
        }));
    }

    /**
     * Transform alternative usage data format
     */
    transformAlternativeUsageData(data) {
        if (!Array.isArray(data)) return [];
        
        return data.map(record => ({
            user_id: record.user_id || record.userId,
            model: record.model,
            prompt_tokens: record.prompt_tokens || record.promptTokens || 0,
            completion_tokens: record.completion_tokens || record.completionTokens || 0,
            total_tokens: record.total_tokens || record.totalTokens || 0,
            timestamp: record.timestamp || record.created_at,
            api_calls: 1
        }));
    }

    /**
     * Aggregate usage data by vault ID (user_id maps to vault ID)
     */
    aggregateUsageByVault(usageData) {
        const aggregated = new Map();
        
        for (const record of usageData) {
            const vaultId = this.mapUserIdToVaultId(record.user_id);
            
            if (!vaultId) {
                console.warn(`⚠️  Could not map user_id ${record.user_id} to vault ID`);
                continue;
            }
            
            if (!aggregated.has(vaultId)) {
                aggregated.set(vaultId, {
                    vaultId: vaultId,
                    totalTokens: 0,
                    apiCalls: 0,
                    gpt4Tokens: 0,
                    gpt35Tokens: 0,
                    claudeTokens: 0,
                    llamaTokens: 0,
                    models: new Set(),
                    timestamp: Date.now()
                });
            }
            
            const usage = aggregated.get(vaultId);
            usage.totalTokens += record.total_tokens || 0;
            usage.apiCalls += 1;
            usage.models.add(record.model);
            
            // Model-specific token counting
            if (record.model?.toLowerCase().includes('gpt-4')) {
                usage.gpt4Tokens += record.total_tokens || 0;
            } else if (record.model?.toLowerCase().includes('gpt-3.5')) {
                usage.gpt35Tokens += record.total_tokens || 0;
            } else if (record.model?.toLowerCase().includes('claude')) {
                usage.claudeTokens += record.total_tokens || 0;
            } else if (record.model?.toLowerCase().includes('llama')) {
                usage.llamaTokens += record.total_tokens || 0;
            }
        }
        
        return aggregated;
    }

    /**
     * Map LiteLLM user_id to Flow vault ID
     * This should be customized based on your user mapping strategy
     */
    mapUserIdToVaultId(userId) {
        // Option 1: Direct mapping (user_id is vault ID)
        if (typeof userId === 'number' || /^\d+$/.test(userId)) {
            return parseInt(userId);
        }
        
        // Option 2: Database lookup (implement as needed)
        // return await this.lookupVaultIdInDatabase(userId);
        
        // Option 3: Hash-based mapping
        const hash = crypto.createHash('md5').update(userId.toString()).digest('hex');
        return parseInt(hash.substring(0, 8), 16) % 1000000; // Generate vault ID from hash
        
        // You should implement proper user → vault mapping here
    }

    /**
     * Submit usage data to Flare oracle
     */
    async submitToFlareOracle(vaultId, usage) {
        console.log(`📤 Submitting usage for vault ${vaultId}: ${usage.totalTokens} tokens`);
        
        try {
            // Create Flare FDC trigger payload
            const trigger = {
                id: `usage-${vaultId}-${Date.now()}`,
                triggerType: 5, // DefiProtocolEvent
                sourceChain: 'litellm',
                targetChain: 0, // Ethereum (for Flow via bridge)
                payload: {
                    vaultId: vaultId,
                    totalTokens: usage.totalTokens,
                    apiCalls: usage.apiCalls,
                    gpt4Tokens: usage.gpt4Tokens,
                    gpt35Tokens: usage.gpt35Tokens,
                    claudeTokens: usage.claudeTokens,
                    llamaTokens: usage.llamaTokens,
                    models: Array.from(usage.models),
                    timestamp: usage.timestamp,
                    flowContract: this.config.flowContractAddress
                },
                timestamp: Math.floor(usage.timestamp / 1000),
                signature: this.signPayload(usage)
            };
            
            // Submit to Flare Data Connector
            await this.submitToFDC(trigger);
            
            // Optional: Also submit directly to Flow (for testing)
            if (this.config.directFlowSubmission) {
                await this.submitDirectlyToFlow(vaultId, usage);
            }
            
            console.log(`✅ Usage submitted for vault ${vaultId}`);
            
        } catch (error) {
            console.error(`❌ Error submitting usage for vault ${vaultId}:`, error);
            throw error;
        }
    }

    /**
     * Sign payload for Flare oracle verification
     */
    signPayload(usage) {
        const message = JSON.stringify({
            vaultId: usage.vaultId,
            totalTokens: usage.totalTokens,
            timestamp: usage.timestamp
        });
        
        return crypto
            .createHmac('sha256', this.config.submitterPrivateKey || 'default-key')
            .update(message)
            .digest('hex');
    }

    /**
     * Submit trigger to Flare Data Connector
     */
    async submitToFDC(trigger) {
        try {
            const response = await axios.post(`${this.config.flareEndpoint}/fdc/submit`, {
                trigger: trigger,
                submitter: this.config.submitterAddress
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.flareApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`📡 FDC submission successful: ${response.data.txId || 'pending'}`);
            return response.data;
            
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn('⚠️  FDC endpoint not available, using mock submission');
                return { txId: 'mock-' + Date.now() };
            }
            throw error;
        }
    }

    /**
     * Submit directly to Flow contract (for testing)
     */
    async submitDirectlyToFlow(vaultId, usage) {
        // This would use Flow CLI or FCL to submit directly
        console.log(`🔄 Direct Flow submission for vault ${vaultId} (${usage.totalTokens} tokens)`);
        
        // Implementation would call Flow contract's updateUsage method
        // This is optional and mainly for testing purposes
    }

    /**
     * Get connector status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastProcessedTimestamp: this.lastProcessedTimestamp,
            cacheSize: this.usageCache.size,
            config: {
                litellmApiUrl: this.config.litellmApiUrl,
                pollInterval: this.config.pollInterval,
                flowContractAddress: this.config.flowContractAddress
            }
        };
    }
}

module.exports = LiteLLMFlareConnector;

// Example usage
if (require.main === module) {
    const connector = new LiteLLMFlareConnector({
        litellmApiUrl: 'https://llm.p10p.io',
        litellmApiKey: process.env.LITELLM_API_KEY,
        flareEndpoint: 'https://coston2-api.flare.network/ext/bc/C/rpc',
        flareApiKey: process.env.FLARE_API_KEY,
        submitterAddress: process.env.FLARE_SUBMITTER_ADDRESS,
        submitterPrivateKey: process.env.FLARE_SUBMITTER_PRIVATE_KEY,
        flowContractAddress: '0x6daee039a7b9c2f0',
        pollInterval: 300000 // 5 minutes
    });
    
    // Start monitoring
    connector.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        connector.stop();
        process.exit(0);
    });
}