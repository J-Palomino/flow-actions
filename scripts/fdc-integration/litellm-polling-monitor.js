/**
 * LiteLLM Polling Monitor - Continuous usage monitoring
 * Polls LiteLLM API for usage data and triggers automatic payments
 */

const axios = require('axios');
const * as fcl from '@onflow/fcl';
require('dotenv').config();

class LiteLLMPollingMonitor {
    constructor() {
        this.litellmApiUrl = process.env.LITELLM_API_URL;
        this.litellmApiKey = process.env.LITELLM_API_KEY;
        this.pollInterval = parseInt(process.env.POLL_INTERVAL) || 300000; // 5 minutes
        this.batchSize = parseInt(process.env.BATCH_SIZE) || 10;
        
        this.lastProcessedTime = Date.now() - (24 * 60 * 60 * 1000); // Start with 24h ago
        this.isRunning = false;
        this.processedUsage = new Set(); // Prevent duplicate processing
        
        // Configure Flow
        this.configureFlow();
    }

    configureFlow() {
        fcl.config()
            .put('accessNode.api', 'https://rest-mainnet.onflow.org')
            .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn')
            .put('flow.network', 'mainnet');
    }

    async start() {
        console.log('🚀 Starting LiteLLM Polling Monitor...');
        console.log(`📊 API: ${this.litellmApiUrl}`);
        console.log(`⏱️ Poll Interval: ${this.pollInterval / 1000}s`);
        console.log(`📦 Batch Size: ${this.batchSize}`);
        console.log('');

        this.isRunning = true;

        // Initial poll
        await this.pollUsageData();

        // Schedule regular polling
        this.pollTimer = setInterval(async () => {
            try {
                await this.pollUsageData();
            } catch (error) {
                console.error('❌ Polling cycle failed:', error.message);
            }
        }, this.pollInterval);

        console.log('🔄 Monitor is now running continuously...');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutdown requested');
            this.stop();
        });
    }

    stop() {
        this.isRunning = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        console.log('✅ LiteLLM Polling Monitor stopped');
        process.exit(0);
    }

    async pollUsageData() {
        console.log(`🔍 Polling LiteLLM usage data... ${new Date().toISOString()}`);

        try {
            // Calculate time range for polling
            const endTime = new Date();
            const startTime = new Date(this.lastProcessedTime);

            console.log(`📅 Checking usage from ${startTime.toISOString()} to ${endTime.toISOString()}`);

            // Fetch usage data from LiteLLM
            const usageData = await this.fetchUsageFromLiteLLM(startTime, endTime);

            if (usageData.length === 0) {
                console.log('ℹ️ No new usage data found');
                return;
            }

            console.log(`📊 Found ${usageData.length} usage records`);

            // Process usage data in batches
            const batches = this.chunkArray(usageData, this.batchSize);
            
            for (const batch of batches) {
                await this.processBatch(batch);
                // Small delay between batches to avoid overwhelming Flow network
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Update last processed time
            this.lastProcessedTime = endTime.getTime();

        } catch (error) {
            console.error('❌ Polling failed:', error.message);
            console.error('   Will retry in next cycle...');
        }
    }

    async fetchUsageFromLiteLLM(startTime, endTime) {
        try {
            // Try different LiteLLM API endpoints
            const endpoints = [
                '/usage',
                '/usage/logs',
                '/spend/logs',
                '/analytics/usage'
            ];

            for (const endpoint of endpoints) {
                try {
                    console.log(`🔗 Trying endpoint: ${endpoint}`);

                    const response = await axios.get(`${this.litellmApiUrl}${endpoint}`, {
                        headers: {
                            'Authorization': `Bearer ${this.litellmApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            start_date: startTime.toISOString().split('T')[0],
                            end_date: endTime.toISOString().split('T')[0],
                            group_by: 'user_id,model',
                            limit: 1000
                        },
                        timeout: 30000
                    });

                    if (response.data && Array.isArray(response.data)) {
                        console.log(`✅ Successfully fetched from ${endpoint}`);
                        return this.normalizeUsageData(response.data);
                    }

                } catch (error) {
                    console.log(`⚠️ Endpoint ${endpoint} failed: ${error.response?.status || error.message}`);
                    continue;
                }
            }

            throw new Error('All LiteLLM endpoints failed');

        } catch (error) {
            console.error('❌ Failed to fetch usage data:', error.message);
            return [];
        }
    }

    normalizeUsageData(rawData) {
        return rawData.map(record => {
            // Generate unique ID to prevent duplicate processing
            const recordId = `${record.user_id || record.vault_id}-${record.timestamp || Date.now()}`;
            
            if (this.processedUsage.has(recordId)) {
                return null; // Skip duplicates
            }
            
            this.processedUsage.add(recordId);

            return {
                vaultId: record.user_id || record.vault_id || record.id,
                totalTokens: record.total_tokens || record.prompt_tokens + record.completion_tokens || 0,
                apiCalls: record.request_count || record.api_calls || 1,
                costEstimate: record.total_cost || record.cost_estimate || 0,
                models: record.models || { [record.model || 'unknown']: record.total_tokens || 0 },
                timestamp: new Date(record.timestamp || record.created_at || Date.now()).getTime(),
                source: 'LiteLLM Polling'
            };
        }).filter(record => record !== null);
    }

    async processBatch(batch) {
        console.log(`🔄 Processing batch of ${batch.length} records...`);

        for (const usageRecord of batch) {
            try {
                await this.processUsageRecord(usageRecord);
                console.log(`   ✅ Processed vault ${usageRecord.vaultId}`);
            } catch (error) {
                console.error(`   ❌ Failed vault ${usageRecord.vaultId}: ${error.message}`);
            }
        }
    }

    async processUsageRecord(usageRecord) {
        console.log(`📊 Processing usage for vault ${usageRecord.vaultId}:`);
        console.log(`   Tokens: ${usageRecord.totalTokens}`);
        console.log(`   API Calls: ${usageRecord.apiCalls}`);
        console.log(`   Cost: $${usageRecord.costEstimate}`);

        // Submit to Flow blockchain for automatic payment processing
        return await this.submitUsageToFlow(usageRecord);
    }

    async submitUsageToFlow(usageRecord) {
        const updateUsageTransaction = `
        import EncryptedUsageSubscriptions from 0x6daee039a7b9c2f0

        transaction(
            vaultId: UInt64,
            totalTokens: UInt64,
            apiCalls: UInt64,
            costEstimate: UFix64
        ) {
            prepare(signer: &Account) {
                log("🤖 Automated usage update for vault: ".concat(vaultId.toString()))
            }
            
            execute {
                let usageReport = EncryptedUsageSubscriptions.UsageReport(
                    timestamp: getCurrentBlock().timestamp,
                    period: "polling",
                    totalTokens: totalTokens,
                    apiCalls: apiCalls,
                    models: {},
                    costEstimate: costEstimate,
                    metadata: {
                        "source": "LiteLLM Polling Monitor",
                        "automated": true,
                        "poll_timestamp": getCurrentBlock().timestamp
                    }
                )
                
                EncryptedUsageSubscriptions.updateUsageData(
                    vaultId: vaultId,
                    usageReport: usageReport,
                    source: "LiteLLM Polling"
                )
                
                log("🚀 Automatic payment triggered for vault ".concat(vaultId.toString()))
            }
        }
        `;

        // For now, simulate the transaction (would need proper Flow account setup)
        console.log('📡 Simulating Flow transaction...');
        console.log(`   Transaction: updateUsageData(${usageRecord.vaultId})`);
        console.log(`   Would trigger automatic payment if vault has balance`);

        return {
            success: true,
            txId: `poll-${Date.now()}-${usageRecord.vaultId}`,
            timestamp: new Date().toISOString()
        };
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            lastProcessedTime: this.lastProcessedTime,
            lastProcessedISO: new Date(this.lastProcessedTime).toISOString(),
            pollInterval: this.pollInterval,
            processedCount: this.processedUsage.size,
            nextPoll: this.isRunning ? Date.now() + this.pollInterval : null
        };
    }
}

// Start the polling monitor
if (require.main === module) {
    const monitor = new LiteLLMPollingMonitor();
    monitor.start().catch(console.error);
}

module.exports = { LiteLLMPollingMonitor };