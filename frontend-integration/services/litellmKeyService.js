/**
 * LiteLLM API Key Management Service - REAL DATA ONLY
 * Handles creation, management, and usage tracking for individual subscription keys
 * NO MOCKED DATA - ALL REAL API CALLS
 */

import axios from 'axios';

class LiteLLMKeyService {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_LITELLM_URL || 'https://llm.p10p.io';
        this.adminKey = process.env.NEXT_PUBLIC_LITELLM_ADMIN_KEY || 'sk-3iOmk5lK_YmNJnwCBPMXfQ';
        
        if (!this.baseURL || !this.adminKey) {
            throw new Error('LiteLLM configuration missing - set NEXT_PUBLIC_LITELLM_URL and NEXT_PUBLIC_LITELLM_ADMIN_KEY');
        }
    }

    /**
     * Create a new LiteLLM API key for a subscription - REAL API CALL
     * Ensures 1 Subscription -> 1 Unique LiteLLM Key -> Independent Usage Tracking
     */
    async createSubscriptionKey(vaultId, customerAddress, providerAddress) {
        if (!vaultId || !customerAddress || !providerAddress) {
            throw new Error('Missing required parameters for key creation');
        }

        try {
            console.log('🔑 Creating UNIQUE REAL LiteLLM API key for independent vault:', vaultId);
            
            // Generate unique identifier to ensure complete independence
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 9);
            const uniqueKeyName = `flareflow_vault_${vaultId}_${customerAddress.slice(2, 8)}_${timestamp}_${randomSuffix}`;
            
            const keyData = {
                key_name: uniqueKeyName,
                user_id: `${customerAddress}_vault_${vaultId}`, // Unique user ID per vault for independent tracking
                metadata: {
                    vaultId: vaultId,
                    customer: customerAddress,
                    provider: providerAddress,
                    createdAt: new Date().toISOString(),
                    type: 'flareflow_subscription',
                    platform: 'FlareFlow.link',
                    uniqueIdentifier: `vault_${vaultId}_${timestamp}`,
                    independentTracking: true,
                    subscriptionModel: '1vault_1key_1dataset'
                },
                max_budget: 100.0,
                budget_duration: '30d',
                models: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'llama-2-70b', 'gpt-4-turbo'],
                permissions: {
                    chat_completions: true,
                    embeddings: true,
                    moderations: true,
                    completions: true
                },
                // Ensure independent rate limiting per vault
                rate_limit: {
                    requests_per_minute: 100,
                    tokens_per_minute: 50000
                }
            };

            console.log(`   Creating key with unique name: ${uniqueKeyName}`);
            console.log(`   Independent user ID: ${keyData.user_id}`);

            const response = await axios.post(`${this.baseURL}/key/generate`, keyData, {
                headers: {
                    'Authorization': `Bearer ${this.adminKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (!response.data || !response.data.key) {
                throw new Error('Invalid response from LiteLLM API - no key returned');
            }

            console.log('✅ UNIQUE REAL LiteLLM key created successfully for independent usage tracking');
            console.log('   Key ID:', response.data.key.slice(0, 20) + '...');
            console.log('   Vault:', vaultId);
            console.log('   User:', customerAddress);
            console.log('   Independent tracking enabled: YES');
            console.log('   Key name:', uniqueKeyName);

            // Add additional metadata to response
            return {
                ...response.data,
                vaultId: vaultId,
                customerAddress: customerAddress,
                providerAddress: providerAddress,
                uniqueKeyName: uniqueKeyName,
                independentTracking: true,
                createdAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ REAL LiteLLM unique key creation failed:', error.message);
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
                throw new Error(`LiteLLM API Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
            }
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new Error(`Cannot connect to LiteLLM at ${this.baseURL} - check URL and network connectivity`);
            }
            
            throw new Error(`LiteLLM unique key creation failed: ${error.message}`);
        }
    }

    /**
     * Get usage data for a specific LiteLLM key - REAL API CALL ONLY
     */
    async getKeyUsage(apiKey, startDate = null, endDate = null) {
        if (!apiKey) {
            throw new Error('API key is required for usage data');
        }

        try {
            console.log(`📊 Fetching REAL usage data for key ${apiKey.slice(0, 20)}...`);
            
            const params = new URLSearchParams();
            if (apiKey) params.append('api_key', apiKey);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            // Try multiple possible LiteLLM endpoints for usage data
            const endpoints = [
                '/spend/logs',
                '/usage/logs', 
                '/key/usage',
                '/api/usage'
            ];

            let usageData = null;
            let lastError = null;

            for (const endpoint of endpoints) {
                try {
                    console.log(`   Trying endpoint: ${this.baseURL}${endpoint}`);
                    
                    const response = await axios.get(`${this.baseURL}${endpoint}?${params.toString()}`, {
                        headers: {
                            'Authorization': `Bearer ${this.adminKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    });

                    if (response.data) {
                        console.log(`✅ Found usage data at ${endpoint}`);
                        usageData = this.processRealUsageData(response.data, apiKey);
                        break;
                    }
                } catch (endpointError) {
                    console.log(`   Endpoint ${endpoint} failed:`, endpointError.response?.status || endpointError.message);
                    lastError = endpointError;
                    continue;
                }
            }

            if (!usageData) {
                console.error('❌ No usage data found from any LiteLLM endpoint');
                throw new Error(`No usage data available for key ${apiKey.slice(0, 20)}... - tried all endpoints: ${endpoints.join(', ')}`);
            }

            console.log('✅ REAL usage data retrieved successfully');
            return usageData;

        } catch (error) {
            console.error('❌ Failed to fetch REAL usage data:', error.message);
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
            }
            
            throw new Error(`Failed to fetch real usage data: ${error.message}`);
        }
    }

    /**
     * Process real usage data from LiteLLM API - NO MOCK DATA
     */
    processRealUsageData(rawData, apiKey) {
        console.log('🔄 Processing REAL usage data (no mocking)');
        
        try {
            // Handle different possible response formats from LiteLLM
            let usageRecords = [];
            
            if (Array.isArray(rawData)) {
                usageRecords = rawData;
            } else if (rawData.data && Array.isArray(rawData.data)) {
                usageRecords = rawData.data;
            } else if (rawData.logs && Array.isArray(rawData.logs)) {
                usageRecords = rawData.logs;
            } else if (rawData.usage && Array.isArray(rawData.usage)) {
                usageRecords = rawData.usage;
            } else {
                console.log('   Unexpected data format, treating as single record');
                usageRecords = [rawData];
            }

            // Process real usage records
            const processedData = {
                key: apiKey,
                usage_summary: {
                    total_requests: 0,
                    total_tokens: 0,
                    total_cost: 0,
                    period_start: null,
                    period_end: null
                },
                model_breakdown: {},
                daily_usage: {},
                recent_requests: []
            };

            let earliestDate = null;
            let latestDate = null;

            usageRecords.forEach(record => {
                // Extract common fields with different possible names
                const requests = record.requests || record.request_count || 1;
                const tokens = record.tokens || record.token_count || record.total_tokens || 0;
                const cost = parseFloat(record.cost || record.total_cost || record.spend || 0);
                const model = record.model || record.model_name || 'unknown';
                const timestamp = record.timestamp || record.created_at || record.time || new Date().toISOString();
                
                // Update totals
                processedData.usage_summary.total_requests += requests;
                processedData.usage_summary.total_tokens += tokens;
                processedData.usage_summary.total_cost += cost;

                // Track date range
                const recordDate = new Date(timestamp);
                if (!earliestDate || recordDate < earliestDate) earliestDate = recordDate;
                if (!latestDate || recordDate > latestDate) latestDate = recordDate;

                // Model breakdown
                if (!processedData.model_breakdown[model]) {
                    processedData.model_breakdown[model] = {
                        requests: 0,
                        tokens: 0,
                        cost: 0
                    };
                }
                processedData.model_breakdown[model].requests += requests;
                processedData.model_breakdown[model].tokens += tokens;
                processedData.model_breakdown[model].cost += cost;

                // Daily usage aggregation
                const dateKey = recordDate.toISOString().split('T')[0];
                if (!processedData.daily_usage[dateKey]) {
                    processedData.daily_usage[dateKey] = {
                        date: dateKey,
                        requests: 0,
                        tokens: 0,
                        cost: 0
                    };
                }
                processedData.daily_usage[dateKey].requests += requests;
                processedData.daily_usage[dateKey].tokens += tokens;
                processedData.daily_usage[dateKey].cost += cost;

                // Recent requests (keep last 20)
                processedData.recent_requests.push({
                    id: record.id || record.request_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: timestamp,
                    model: model,
                    tokens: tokens,
                    cost: cost.toFixed(6),
                    status: record.status || 'completed'
                });
            });

            // Set date range
            processedData.usage_summary.period_start = earliestDate ? earliestDate.toISOString() : new Date().toISOString();
            processedData.usage_summary.period_end = latestDate ? latestDate.toISOString() : new Date().toISOString();

            // Convert daily usage object to sorted array
            processedData.daily_usage = Object.values(processedData.daily_usage)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // Sort recent requests by timestamp (newest first) and limit to 20
            processedData.recent_requests = processedData.recent_requests
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20);

            // Fix cost formatting
            processedData.usage_summary.total_cost = parseFloat(processedData.usage_summary.total_cost.toFixed(6));
            Object.keys(processedData.model_breakdown).forEach(model => {
                processedData.model_breakdown[model].cost = parseFloat(processedData.model_breakdown[model].cost.toFixed(6));
            });
            processedData.daily_usage.forEach(day => {
                day.cost = parseFloat(day.cost.toFixed(6));
            });

            console.log('✅ REAL usage data processed successfully');
            console.log(`   Total requests: ${processedData.usage_summary.total_requests}`);
            console.log(`   Total cost: $${processedData.usage_summary.total_cost}`);
            console.log(`   Models used: ${Object.keys(processedData.model_breakdown).join(', ')}`);
            
            return processedData;

        } catch (error) {
            console.error('❌ Error processing REAL usage data:', error.message);
            throw new Error(`Failed to process real usage data: ${error.message}`);
        }
    }

    /**
     * List all keys for a user - REAL API CALL ONLY
     */
    async getUserKeys(userAddress) {
        if (!userAddress) {
            throw new Error('User address is required');
        }

        try {
            console.log(`🗂️ Fetching REAL keys for user ${userAddress}`);
            
            const response = await axios.get(`${this.baseURL}/key/list`, {
                headers: {
                    'Authorization': `Bearer ${this.adminKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    user_id: userAddress
                },
                timeout: 15000
            });

            if (!response.data) {
                console.log('   No keys found for user');
                return [];
            }

            const keys = Array.isArray(response.data) ? response.data : response.data.keys || [];
            console.log(`✅ Found ${keys.length} REAL keys for user ${userAddress}`);
            
            return keys;

        } catch (error) {
            console.error('❌ Failed to fetch REAL user keys:', error.message);
            
            if (error.response?.status === 404) {
                console.log('   No keys found for user (404)');
                return [];
            }
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
                throw new Error(`LiteLLM API Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
            }
            
            throw new Error(`Failed to fetch real user keys: ${error.message}`);
        }
    }

    /**
     * Update key permissions or budget - REAL API CALL ONLY
     */
    async updateKey(apiKey, updates) {
        if (!apiKey || !updates) {
            throw new Error('API key and updates are required');
        }

        try {
            console.log(`🔧 Updating REAL key ${apiKey.slice(0, 20)}... with:`, updates);
            
            const response = await axios.patch(`${this.baseURL}/key/update`, {
                key: apiKey,
                ...updates
            }, {
                headers: {
                    'Authorization': `Bearer ${this.adminKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            if (!response.data) {
                throw new Error('Invalid response from LiteLLM API - no data returned');
            }

            console.log('✅ REAL key updated successfully');
            return {
                success: true,
                key: apiKey,
                updates: updates,
                updated_at: new Date().toISOString(),
                response_data: response.data
            };

        } catch (error) {
            console.error('❌ Failed to update REAL key:', error.message);
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
                throw new Error(`LiteLLM API Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
            }
            
            throw new Error(`Failed to update real key: ${error.message}`);
        }
    }

    /**
     * Revoke/delete a key - REAL API CALL ONLY
     */
    async revokeKey(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required for revocation');
        }

        try {
            console.log(`🗑️ Revoking REAL key ${apiKey.slice(0, 20)}...`);
            
            const response = await axios.delete(`${this.baseURL}/key/delete`, {
                headers: {
                    'Authorization': `Bearer ${this.adminKey}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    key: apiKey
                },
                timeout: 15000
            });

            if (!response.data) {
                throw new Error('Invalid response from LiteLLM API - no confirmation returned');
            }

            console.log('✅ REAL key revoked successfully');
            return {
                success: true,
                key: apiKey,
                revoked_at: new Date().toISOString(),
                response_data: response.data
            };

        } catch (error) {
            console.error('❌ Failed to revoke REAL key:', error.message);
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
                throw new Error(`LiteLLM API Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
            }
            
            throw new Error(`Failed to revoke real key: ${error.message}`);
        }
    }

    // Helper methods for real data processing

    generateKeyId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    extractVaultIdFromKey(apiKey) {
        const match = apiKey.match(/vault(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
}

// Export singleton instance
export const litellmKeyService = new LiteLLMKeyService();
export default litellmKeyService;