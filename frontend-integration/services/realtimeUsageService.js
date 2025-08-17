/**
 * Real-Time Usage Service
 * Provides instant usage updates while maintaining Flare as source of truth
 */

import axios from 'axios';

class RealtimeUsageService {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_LITELLM_URL || 'https://llm.p10p.io';
        this.adminKey = process.env.NEXT_PUBLIC_LITELLM_ADMIN_KEY || 'sk-3iOmk5lK_YmNJnwCBPMXfQ';
        
        // Cache for pending (unconfirmed) usage
        this.pendingUsage = new Map();
        
        // Cache for confirmed (oracle-verified) usage
        this.confirmedUsage = new Map();
        
        // WebSocket for real-time updates (if available)
        this.ws = null;
        
        // Polling interval for near-real-time updates
        this.pollingInterval = 5000; // 5 seconds for UI updates
        this.pollingTimer = null;
    }

    /**
     * Get combined usage data (pending + confirmed)
     */
    async getHybridUsage(apiKey, vaultId) {
        try {
            // Get both pending and confirmed data
            const [pending, confirmed] = await Promise.all([
                this.getPendingUsage(apiKey),
                this.getConfirmedUsage(vaultId)
            ]);

            // Combine the data
            return {
                // Real-time data (may not be billed yet)
                pending: {
                    tokens: pending.tokens || 0,
                    requests: pending.requests || 0,
                    cost: pending.cost || 0,
                    lastUpdate: pending.timestamp || new Date().toISOString(),
                    status: 'PENDING_ORACLE_CONFIRMATION'
                },
                
                // Oracle-confirmed data (will be billed)
                confirmed: {
                    tokens: confirmed.tokens || 0,
                    requests: confirmed.requests || 0,
                    cost: confirmed.cost || 0,
                    lastAttestation: confirmed.attestationTime || null,
                    flareRoundId: confirmed.roundId || null,
                    status: 'ORACLE_VERIFIED'
                },
                
                // Combined totals
                total: {
                    tokens: (pending.tokens || 0) + (confirmed.tokens || 0),
                    requests: (pending.requests || 0) + (confirmed.requests || 0),
                    estimatedCost: (pending.cost || 0) + (confirmed.cost || 0),
                    billableCost: confirmed.cost || 0, // Only confirmed is billable
                },
                
                // Time until next oracle update
                nextOracleUpdate: this.getNextOracleUpdateTime(),
                
                // Data freshness
                dataFreshness: {
                    pending: this.getDataAge(pending.timestamp),
                    confirmed: this.getDataAge(confirmed.attestationTime)
                }
            };
        } catch (error) {
            console.error('Error getting hybrid usage:', error);
            throw error;
        }
    }

    /**
     * Get pending (unconfirmed) usage directly from LiteLLM
     */
    async getPendingUsage(apiKey) {
        try {
            // First check cache
            const cached = this.pendingUsage.get(apiKey);
            if (cached && this.isCacheFresh(cached.timestamp, 5000)) {
                return cached;
            }

            // Fetch fresh data from LiteLLM
            console.log('🔄 Fetching real-time usage from LiteLLM...');
            
            const response = await axios.get(`${this.baseURL}/key/usage`, {
                headers: {
                    'Authorization': `Bearer ${this.adminKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    api_key: apiKey,
                    // Get usage from last oracle update to now
                    start_date: this.getLastOracleUpdateTime(),
                    end_date: new Date().toISOString()
                },
                timeout: 3000 // Fast timeout for UI responsiveness
            });

            const usage = this.processPendingUsage(response.data);
            
            // Update cache
            this.pendingUsage.set(apiKey, {
                ...usage,
                timestamp: new Date().toISOString()
            });

            return usage;

        } catch (error) {
            console.warn('Could not fetch real-time usage:', error.message);
            // Return cached data if available
            return this.pendingUsage.get(apiKey) || { tokens: 0, requests: 0, cost: 0 };
        }
    }

    /**
     * Get confirmed usage from Flare oracle records
     */
    async getConfirmedUsage(vaultId) {
        try {
            // This would query the Flow blockchain for oracle-attested data
            // For now, we'll simulate it
            console.log('✅ Fetching oracle-confirmed usage for vault:', vaultId);
            
            // In production, this would be:
            // const records = await fcl.query({
            //     cadence: GET_ORACLE_ATTESTATIONS,
            //     args: (arg, t) => [arg(vaultId, t.UInt64)]
            // });
            
            const cached = this.confirmedUsage.get(vaultId);
            if (cached) {
                return cached;
            }

            // Default confirmed data
            return {
                tokens: 0,
                requests: 0,
                cost: 0,
                attestationTime: null,
                roundId: null
            };

        } catch (error) {
            console.error('Error fetching confirmed usage:', error);
            return { tokens: 0, requests: 0, cost: 0 };
        }
    }

    /**
     * Process pending usage data from LiteLLM
     */
    processPendingUsage(data) {
        if (!data) return { tokens: 0, requests: 0, cost: 0 };

        let totalTokens = 0;
        let totalRequests = 0;
        let totalCost = 0;

        // Handle different response formats
        const records = Array.isArray(data) ? data : (data.usage || data.logs || []);

        records.forEach(record => {
            totalTokens += (record.total_tokens || record.tokens || 0);
            totalRequests += 1;
            totalCost += (record.cost || record.spend || 0);
        });

        return {
            tokens: totalTokens,
            requests: totalRequests,
            cost: totalCost
        };
    }

    /**
     * Start real-time usage monitoring
     */
    startRealtimeMonitoring(apiKey, onUpdate) {
        console.log('🚀 Starting real-time usage monitoring...');
        
        // Poll for updates every 5 seconds
        this.pollingTimer = setInterval(async () => {
            try {
                const usage = await this.getPendingUsage(apiKey);
                onUpdate(usage);
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, this.pollingInterval);

        // Also try to establish WebSocket connection for instant updates
        this.connectWebSocket(apiKey, onUpdate);
    }

    /**
     * Connect WebSocket for instant updates (if LiteLLM supports it)
     */
    connectWebSocket(apiKey, onUpdate) {
        try {
            const wsUrl = this.baseURL.replace('https://', 'wss://').replace('http://', 'ws://');
            this.ws = new WebSocket(`${wsUrl}/ws/usage/${apiKey}`);

            this.ws.onmessage = (event) => {
                const usage = JSON.parse(event.data);
                console.log('⚡ Real-time usage update:', usage);
                
                // Update pending cache
                this.pendingUsage.set(apiKey, {
                    ...usage,
                    timestamp: new Date().toISOString()
                });
                
                onUpdate(usage);
            };

            this.ws.onerror = (error) => {
                console.warn('WebSocket not available, using polling instead');
            };

        } catch (error) {
            console.log('WebSocket not supported, using polling for updates');
        }
    }

    /**
     * Stop real-time monitoring
     */
    stopRealtimeMonitoring() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        console.log('🛑 Stopped real-time monitoring');
    }

    /**
     * Update confirmed usage when oracle attestation arrives
     */
    updateConfirmedUsage(vaultId, attestationData) {
        console.log('✅ Oracle attestation received for vault:', vaultId);
        
        this.confirmedUsage.set(vaultId, {
            tokens: attestationData.totalTokens,
            requests: attestationData.apiCalls,
            cost: attestationData.totalCost,
            attestationTime: new Date().toISOString(),
            roundId: attestationData.flareRoundId
        });

        // Clear pending usage that's now confirmed
        // This prevents double-counting
        this.clearConfirmedPendingUsage(vaultId);
    }

    /**
     * Clear pending usage that has been confirmed by oracle
     */
    clearConfirmedPendingUsage(vaultId) {
        // Find and clear pending usage for this vault
        for (const [apiKey, usage] of this.pendingUsage) {
            // If this usage is before the last oracle update, clear it
            if (usage.timestamp < this.getLastOracleUpdateTime()) {
                this.pendingUsage.delete(apiKey);
            }
        }
    }

    // Helper methods

    isCacheFresh(timestamp, maxAge) {
        if (!timestamp) return false;
        const age = Date.now() - new Date(timestamp).getTime();
        return age < maxAge;
    }

    getDataAge(timestamp) {
        if (!timestamp) return 'Never';
        const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    getLastOracleUpdateTime() {
        // Oracle updates every 5 minutes
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const lastUpdate = Math.floor(now / fiveMinutes) * fiveMinutes;
        return new Date(lastUpdate).toISOString();
    }

    getNextOracleUpdateTime() {
        // Calculate time until next 5-minute mark
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const nextUpdate = Math.ceil(now / fiveMinutes) * fiveMinutes;
        const timeUntil = nextUpdate - now;
        
        const minutes = Math.floor(timeUntil / 60000);
        const seconds = Math.floor((timeUntil % 60000) / 1000);
        
        return {
            timestamp: new Date(nextUpdate).toISOString(),
            countdown: `${minutes}m ${seconds}s`,
            milliseconds: timeUntil
        };
    }
}

// Export singleton instance
export const realtimeUsageService = new RealtimeUsageService();
export default realtimeUsageService;