/**
 * LiteLLM Webhook Receiver - Real-time usage data processing
 * Receives webhooks from LiteLLM and triggers automatic payments
 */

const express = require('express');
const crypto = require('crypto');
const * as fcl from '@onflow/fcl';
require('dotenv').config();

class LiteLLMWebhookReceiver {
    constructor() {
        this.app = express();
        this.port = process.env.WEBHOOK_PORT || 3001;
        this.webhookSecret = process.env.LITELLM_WEBHOOK_SECRET || 'your_webhook_secret';
        
        // Configure Flow
        this.configureFlow();
        
        // Setup middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.raw({ type: 'application/json' }));
        
        // Setup routes
        this.setupRoutes();
    }

    configureFlow() {
        fcl.config()
            .put('accessNode.api', 'https://rest-mainnet.onflow.org')
            .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn')
            .put('flow.network', 'mainnet');
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'LiteLLM Webhook Receiver',
                timestamp: new Date().toISOString()
            });
        });

        // Main webhook endpoint
        this.app.post('/webhook/usage', async (req, res) => {
            try {
                console.log('🎣 Webhook received from LiteLLM');
                
                // Verify webhook signature
                if (!this.verifyWebhookSignature(req)) {
                    console.log('❌ Invalid webhook signature');
                    return res.status(401).json({ error: 'Invalid signature' });
                }

                const usageData = req.body;
                console.log('📊 Processing usage data:', JSON.stringify(usageData, null, 2));

                // Process the usage data
                await this.processUsageWebhook(usageData);

                res.json({ 
                    success: true, 
                    message: 'Usage data processed',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('❌ Webhook processing failed:', error);
                res.status(500).json({ 
                    error: 'Processing failed',
                    message: error.message
                });
            }
        });

        // Batch processing endpoint
        this.app.post('/webhook/usage/batch', async (req, res) => {
            try {
                console.log('🎣 Batch webhook received from LiteLLM');
                
                const batchData = req.body;
                if (!Array.isArray(batchData)) {
                    return res.status(400).json({ error: 'Expected array of usage data' });
                }

                console.log(`📊 Processing ${batchData.length} usage records`);

                // Process each usage record
                const results = [];
                for (const usageData of batchData) {
                    try {
                        const result = await this.processUsageWebhook(usageData);
                        results.push({ success: true, vaultId: usageData.vault_id, result });
                    } catch (error) {
                        console.error(`❌ Failed to process vault ${usageData.vault_id}:`, error);
                        results.push({ success: false, vaultId: usageData.vault_id, error: error.message });
                    }
                }

                res.json({ 
                    success: true, 
                    processed: results.length,
                    results: results,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('❌ Batch webhook processing failed:', error);
                res.status(500).json({ 
                    error: 'Batch processing failed',
                    message: error.message
                });
            }
        });
    }

    verifyWebhookSignature(req) {
        if (!this.webhookSecret) {
            console.log('⚠️ No webhook secret configured - skipping verification');
            return true;
        }

        const signature = req.headers['x-litellm-signature'] || req.headers['x-hub-signature-256'];
        if (!signature) {
            console.log('❌ No signature header found');
            return false;
        }

        const payload = JSON.stringify(req.body);
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    async processUsageWebhook(usageData) {
        console.log('🔄 Processing usage webhook...');
        
        // Extract usage information
        const vaultId = usageData.vault_id || usageData.user_id;
        const totalTokens = usageData.total_tokens || 0;
        const apiCalls = usageData.api_calls || usageData.request_count || 1;
        const costEstimate = usageData.cost_estimate || usageData.total_cost || 0;
        const models = usageData.models || {};

        if (!vaultId) {
            throw new Error('Missing vault_id or user_id in webhook data');
        }

        console.log(`📊 Usage for vault ${vaultId}:`);
        console.log(`   Tokens: ${totalTokens}`);
        console.log(`   API Calls: ${apiCalls}`);
        console.log(`   Cost: $${costEstimate}`);

        // Submit to Flow blockchain
        const txResult = await this.submitUsageToFlow({
            vaultId: parseInt(vaultId),
            totalTokens,
            apiCalls,
            costEstimate,
            models,
            timestamp: Date.now(),
            source: 'LiteLLM Webhook'
        });

        console.log(`✅ Usage submitted to Flow: ${txResult.txId}`);
        return txResult;
    }

    async submitUsageToFlow(usageData) {
        console.log('📡 Submitting usage to Flow blockchain...');

        // Create the transaction
        const updateUsageTransaction = `
        import EncryptedUsageSubscriptions from 0x6daee039a7b9c2f0

        transaction(
            vaultId: UInt64,
            totalTokens: UInt64,
            apiCalls: UInt64,
            costEstimate: UFix64
        ) {
            prepare(signer: &Account) {
                log("🎯 Updating usage for vault: ".concat(vaultId.toString()))
                log("   Tokens: ".concat(totalTokens.toString()))
                log("   API Calls: ".concat(apiCalls.toString()))
                log("   Cost: $".concat(costEstimate.toString()))
            }
            
            execute {
                // Create usage report
                let usageReport = EncryptedUsageSubscriptions.UsageReport(
                    timestamp: getCurrentBlock().timestamp,
                    period: "realtime",
                    totalTokens: totalTokens,
                    apiCalls: apiCalls,
                    models: {},
                    costEstimate: costEstimate,
                    metadata: {
                        "source": "LiteLLM Webhook",
                        "webhook_timestamp": getCurrentBlock().timestamp,
                        "automated": true
                    }
                )
                
                // Submit usage update and trigger automatic payment
                EncryptedUsageSubscriptions.updateUsageData(
                    vaultId: vaultId,
                    usageReport: usageReport,
                    source: "LiteLLM Webhook"
                )
                
                log("✅ Usage data submitted - automatic payment triggered")
            }
        }
        `;

        // Execute transaction (requires proper signer setup)
        try {
            const txId = await fcl.mutate({
                cadence: updateUsageTransaction,
                args: (arg, t) => [
                    arg(usageData.vaultId, t.UInt64),
                    arg(usageData.totalTokens, t.UInt64),
                    arg(usageData.apiCalls, t.UInt64),
                    arg(usageData.costEstimate, t.UFix64)
                ],
                proposer: fcl.currentUser, // Would need proper authorization
                payer: fcl.currentUser,
                authorizations: [fcl.currentUser],
                limit: 1000
            });

            // Wait for transaction result
            const result = await fcl.tx(txId).onceSealed();
            
            return {
                success: true,
                txId: txId,
                blockId: result.blockId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Flow transaction failed:', error);
            throw error;
        }
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('🎯 LiteLLM Webhook Receiver Started');
            console.log('='.repeat(50));
            console.log(`📡 Listening on port: ${this.port}`);
            console.log(`🔗 Webhook URL: http://localhost:${this.port}/webhook/usage`);
            console.log(`📊 Batch URL: http://localhost:${this.port}/webhook/usage/batch`);
            console.log(`💓 Health Check: http://localhost:${this.port}/health`);
            console.log('');
            console.log('🎣 Ready to receive LiteLLM webhooks...');
            console.log('');
            console.log('📋 Configure LiteLLM webhook:');
            console.log('   Webhook URL: http://your-server:3001/webhook/usage');
            console.log('   Secret: Set LITELLM_WEBHOOK_SECRET env variable');
            console.log('   Events: request_completed, usage_updated');
        });
    }
}

// Start the webhook receiver
if (require.main === module) {
    const receiver = new LiteLLMWebhookReceiver();
    receiver.start();
}

module.exports = { LiteLLMWebhookReceiver };