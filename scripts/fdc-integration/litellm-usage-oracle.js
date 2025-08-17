/**
 * LiteLLM Usage Oracle for Flare Data Connector
 * Fetches usage data from LiteLLM and submits to Flow via FDC triggers
 */

const { FlowService } = require('@onflow/fcl');
const axios = require('axios');

class LiteLLMUsageOracle {
    constructor(config) {
        this.litellmApiUrl = config.litellmApiUrl;
        this.litellmApiKey = config.litellmApiKey;
        this.flowRpcUrl = config.flowRpcUrl;
        this.contractAddress = config.contractAddress;
        this.privateKey = config.privateKey;
        this.fdcEndpoint = config.fdcEndpoint;
        
        this.usageCache = new Map();
        this.lastUpdate = 0;
        this.updateInterval = 300000; // 5 minutes
    }

    /**
     * Fetch usage data from LiteLLM API
     */
    async fetchLiteLLMUsage(userId, timeRange = '24h') {
        try {
            const response = await axios.get(`${this.litellmApiUrl}/usage`, {
                headers: {
                    'Authorization': `Bearer ${this.litellmApiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    user_id: userId,
                    time_range: timeRange,
                    include_models: true,
                    include_costs: true
                }
            });

            return {
                userId: userId,
                timeRange: timeRange,
                totalTokens: response.data.total_tokens || 0,
                apiCalls: response.data.api_calls || 0,
                models: response.data.models || {},
                totalCost: response.data.total_cost || 0,
                timestamp: Date.now(),
                metadata: {
                    source: 'LiteLLM',
                    version: response.data.version || '1.0',
                    period: timeRange
                }
            };
        } catch (error) {
            console.error('Error fetching LiteLLM usage:', error);
            throw error;
        }
    }

    /**
     * Convert usage data to FDC trigger format
     */
    createFDCTrigger(vaultId, usageData) {
        return {
            id: `litellm-${vaultId}-${usageData.timestamp}`,
            triggerType: 5, // DefiProtocolEvent
            sourceChain: "LiteLLM",
            targetChain: 0, // Flow
            payload: {
                vaultId: vaultId,
                totalTokens: usageData.totalTokens,
                apiCalls: usageData.apiCalls,
                models: usageData.models,
                costEstimate: usageData.totalCost,
                period: usageData.timeRange,
                userId: usageData.userId,
                timestamp: usageData.timestamp,
                metadata: JSON.stringify(usageData.metadata)
            },
            timestamp: usageData.timestamp / 1000, // Convert to seconds
            signature: this.generateSignature(usageData)
        };
    }

    /**
     * Generate signature for FDC verification
     */
    generateSignature(data) {
        // In production, use proper cryptographic signing
        const crypto = require('crypto');
        const payload = JSON.stringify(data);
        return crypto.createHash('sha256').update(payload + this.privateKey).digest('hex');
    }

    /**
     * Submit FDC trigger to Flow blockchain
     */
    async submitToFlow(trigger) {
        const transaction = `
            import FlareFDCTriggers from ${this.contractAddress}
            
            transaction {
                prepare(signer: auth(Storage) &Account) {
                    // Create FDC trigger struct
                    let fdcTrigger = FlareFDCTriggers.FDCTrigger(
                        id: "${trigger.id}",
                        triggerType: FlareFDCTriggers.TriggerType(rawValue: ${trigger.triggerType})!,
                        sourceChain: "${trigger.sourceChain}",
                        targetChain: FlareFDCTriggers.TargetChain(rawValue: ${trigger.targetChain})!,
                        payload: {
                            "vaultId": ${trigger.payload.vaultId},
                            "totalTokens": ${trigger.payload.totalTokens},
                            "apiCalls": ${trigger.payload.apiCalls},
                            "costEstimate": ${trigger.payload.costEstimate},
                            "period": "${trigger.payload.period}",
                            "userId": "${trigger.payload.userId}",
                            "timestamp": ${trigger.payload.timestamp}
                        },
                        timestamp: ${trigger.timestamp},
                        signature: "${trigger.signature}"
                    )
                    
                    // Submit trigger
                    let success = FlareFDCTriggers.submitFDCTrigger(trigger: fdcTrigger)
                    
                    log("FDC trigger submitted: ".concat(success.toString()))
                }
            }
        `;

        try {
            // Submit transaction to Flow
            // Implementation depends on your Flow client setup
            console.log('Submitting FDC trigger to Flow:', trigger.id);
            return true;
        } catch (error) {
            console.error('Error submitting to Flow:', error);
            return false;
        }
    }

    /**
     * Process usage data for a specific vault/customer
     */
    async processCustomerUsage(vaultId, userId) {
        try {
            // Fetch latest usage data
            const usageData = await this.fetchLiteLLMUsage(userId);
            
            // Check if data has changed significantly
            const cacheKey = `${vaultId}-${userId}`;
            const cached = this.usageCache.get(cacheKey);
            
            if (cached && Math.abs(usageData.totalTokens - cached.totalTokens) < 1000) {
                console.log(`No significant usage change for vault ${vaultId}`);
                return false;
            }
            
            // Cache the new data
            this.usageCache.set(cacheKey, usageData);
            
            // Create and submit FDC trigger
            const trigger = this.createFDCTrigger(vaultId, usageData);
            const success = await this.submitToFlow(trigger);
            
            if (success) {
                console.log(`Usage data processed for vault ${vaultId}:`, {
                    tokens: usageData.totalTokens,
                    calls: usageData.apiCalls,
                    cost: usageData.totalCost
                });
            }
            
            return success;
        } catch (error) {
            console.error(`Error processing customer usage for vault ${vaultId}:`, error);
            return false;
        }
    }

    /**
     * Start monitoring all customers
     */
    async startMonitoring(customerVaultMapping) {
        console.log('Starting LiteLLM usage monitoring...');
        
        const processAll = async () => {
            for (const [vaultId, userId] of Object.entries(customerVaultMapping)) {
                await this.processCustomerUsage(parseInt(vaultId), userId);
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        };
        
        // Initial processing
        await processAll();
        
        // Set up interval monitoring
        setInterval(async () => {
            console.log('Running scheduled usage update...');
            await processAll();
        }, this.updateInterval);
    }

    /**
     * Get usage analytics for a customer
     */
    async getUsageAnalytics(userId, days = 30) {
        try {
            const response = await axios.get(`${this.litellmApiUrl}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${this.litellmApiKey}`
                },
                params: {
                    user_id: userId,
                    days: days
                }
            });

            return {
                totalTokens: response.data.total_tokens,
                avgTokensPerDay: response.data.avg_tokens_per_day,
                modelBreakdown: response.data.model_breakdown,
                costTrend: response.data.cost_trend,
                usageGrowth: response.data.usage_growth,
                recommendations: this.generateRecommendations(response.data)
            };
        } catch (error) {
            console.error('Error fetching usage analytics:', error);
            return null;
        }
    }

    /**
     * Generate pricing recommendations based on usage patterns
     */
    generateRecommendations(analyticsData) {
        const recommendations = [];
        
        if (analyticsData.usage_growth > 0.5) {
            recommendations.push({
                type: 'tier_upgrade',
                message: 'Consider upgrading to a higher tier for better rates',
                potential_savings: analyticsData.estimated_savings
            });
        }
        
        if (analyticsData.model_breakdown.premium_usage > 0.7) {
            recommendations.push({
                type: 'model_optimization',
                message: 'High premium model usage detected. Consider mixing with standard models',
                cost_impact: analyticsData.premium_cost_impact
            });
        }
        
        return recommendations;
    }
}

module.exports = { LiteLLMUsageOracle };