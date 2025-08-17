/**
 * LiteLLM API Key Management Service
 * Handles creation, management, and usage tracking for individual subscription keys
 */

import axios from 'axios';

class LiteLLMKeyService {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_LITELLM_URL || 'https://llm.p10p.io';
        this.adminKey = process.env.NEXT_PUBLIC_LITELLM_ADMIN_KEY || 'sk-3iOmk5lK_YmNJnwCBPMXfQ';
    }

    /**
     * Create a new LiteLLM API key for a subscription
     */
    async createSubscriptionKey(vaultId, customerAddress, providerAddress) {
        try {
            const keyData = {
                key_name: `vault_${vaultId}_${customerAddress.slice(2, 8)}`,
                user_id: customerAddress,
                metadata: {
                    vaultId: vaultId,
                    customer: customerAddress,
                    provider: providerAddress,
                    createdAt: new Date().toISOString(),
                    type: 'subscription_key'
                },
                max_budget: 100.0, // Default budget
                budget_duration: '30d',
                models: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'llama-2-70b'],
                permissions: {
                    chat_completions: true,
                    embeddings: true,
                    moderations: true
                }
            };

            // In production, this would call the actual LiteLLM API
            // For demo, we'll simulate the key creation
            const mockResponse = {
                key: `sk-vault${vaultId}_${this.generateKeyId()}`,
                key_name: keyData.key_name,
                user_id: keyData.user_id,
                metadata: keyData.metadata,
                max_budget: keyData.max_budget,
                budget_duration: keyData.budget_duration,
                spend: 0,
                created_at: new Date().toISOString()
            };

            console.log('🔑 Created LiteLLM key for vault:', vaultId);
            console.log('   Key:', mockResponse.key);
            console.log('   User:', customerAddress);

            return mockResponse;

        } catch (error) {
            console.error('Error creating LiteLLM key:', error);
            throw new Error(`Failed to create LiteLLM key: ${error.message}`);
        }
    }

    /**
     * Get usage data for a specific LiteLLM key
     */
    async getKeyUsage(apiKey, startDate = null, endDate = null) {
        try {
            const params = {
                api_key: apiKey
            };

            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            // For demo, return mock usage data based on the key
            const vaultId = this.extractVaultIdFromKey(apiKey);
            const mockUsageData = this.generateMockUsageData(vaultId, apiKey);

            console.log(`📊 Fetched usage for key ${apiKey.slice(0, 20)}...`);
            
            return mockUsageData;

        } catch (error) {
            console.error('Error fetching key usage:', error);
            throw new Error(`Failed to fetch usage data: ${error.message}`);
        }
    }

    /**
     * List all keys for a user
     */
    async getUserKeys(userAddress) {
        try {
            // In production, this would query the LiteLLM API
            // For demo, return mock keys based on stored subscriptions
            const mockKeys = this.getMockKeysForUser(userAddress);
            
            console.log(`🗂️  Found ${mockKeys.length} keys for user ${userAddress}`);
            
            return mockKeys;

        } catch (error) {
            console.error('Error fetching user keys:', error);
            throw new Error(`Failed to fetch user keys: ${error.message}`);
        }
    }

    /**
     * Update key permissions or budget
     */
    async updateKey(apiKey, updates) {
        try {
            console.log(`🔧 Updating key ${apiKey.slice(0, 20)}... with:`, updates);
            
            // For demo, return updated key data
            return {
                success: true,
                key: apiKey,
                updates: updates,
                updated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error updating key:', error);
            throw new Error(`Failed to update key: ${error.message}`);
        }
    }

    /**
     * Revoke/delete a key
     */
    async revokeKey(apiKey) {
        try {
            console.log(`🗑️  Revoking key ${apiKey.slice(0, 20)}...`);
            
            return {
                success: true,
                key: apiKey,
                revoked_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error revoking key:', error);
            throw new Error(`Failed to revoke key: ${error.message}`);
        }
    }

    // Helper methods

    generateKeyId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    extractVaultIdFromKey(apiKey) {
        const match = apiKey.match(/vault(\d+)/);
        return match ? parseInt(match[1]) : Math.floor(Math.random() * 1000000);
    }

    generateMockUsageData(vaultId, apiKey) {
        // Generate realistic mock data based on vault ID
        const daysSinceCreation = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
        const baseUsage = vaultId % 100;
        
        return {
            key: apiKey,
            vault_id: vaultId,
            usage_summary: {
                total_requests: baseUsage + Math.floor(Math.random() * 50),
                total_tokens: (baseUsage + Math.floor(Math.random() * 50)) * 847,
                total_cost: ((baseUsage + Math.floor(Math.random() * 50)) * 0.0015).toFixed(6),
                period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                period_end: new Date().toISOString()
            },
            model_breakdown: {
                'gpt-3.5-turbo': {
                    requests: Math.floor(baseUsage * 0.6),
                    tokens: Math.floor((baseUsage * 0.6) * 423),
                    cost: (Math.floor(baseUsage * 0.6) * 0.0008).toFixed(6)
                },
                'gpt-4': {
                    requests: Math.floor(baseUsage * 0.3),
                    tokens: Math.floor((baseUsage * 0.3) * 1247),
                    cost: (Math.floor(baseUsage * 0.3) * 0.012).toFixed(6)
                },
                'claude-3-sonnet': {
                    requests: Math.floor(baseUsage * 0.1),
                    tokens: Math.floor((baseUsage * 0.1) * 892),
                    cost: (Math.floor(baseUsage * 0.1) * 0.003).toFixed(6)
                }
            },
            daily_usage: this.generateDailyUsage(30, baseUsage),
            recent_requests: this.generateRecentRequests(vaultId, 10)
        };
    }

    generateDailyUsage(days, baseUsage) {
        const dailyData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dailyRequests = Math.floor(Math.random() * (baseUsage / 7)) + 1;
            dailyData.push({
                date: date.toISOString().split('T')[0],
                requests: dailyRequests,
                tokens: dailyRequests * (400 + Math.floor(Math.random() * 800)),
                cost: (dailyRequests * (0.001 + Math.random() * 0.005)).toFixed(6)
            });
        }
        return dailyData;
    }

    generateRecentRequests(vaultId, count) {
        const requests = [];
        for (let i = 0; i < count; i++) {
            const timestamp = new Date(Date.now() - i * 60 * 60 * 1000 * Math.random() * 24);
            requests.push({
                id: `req_${vaultId}_${i + 1}`,
                timestamp: timestamp.toISOString(),
                model: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'][Math.floor(Math.random() * 3)],
                tokens: 200 + Math.floor(Math.random() * 1000),
                cost: (0.001 + Math.random() * 0.01).toFixed(6),
                status: 'completed'
            });
        }
        return requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getMockKeysForUser(userAddress) {
        // This would typically query a database or the LiteLLM API
        // For demo, generate some mock keys based on user address
        const userHash = userAddress.slice(2, 8);
        const keyCount = (parseInt(userHash, 16) % 3) + 1; // 1-3 keys per user
        
        const keys = [];
        for (let i = 0; i < keyCount; i++) {
            const vaultId = parseInt(userHash + i.toString(), 16) % 1000000;
            keys.push({
                key: `sk-vault${vaultId}_${this.generateKeyId()}`,
                key_name: `vault_${vaultId}_${userHash}`,
                vault_id: vaultId,
                user_id: userAddress,
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                max_budget: 100.0,
                current_spend: (Math.random() * 25).toFixed(2),
                status: 'active'
            });
        }
        
        return keys;
    }
}

// Export singleton instance
export const litellmKeyService = new LiteLLMKeyService();
export default litellmKeyService;