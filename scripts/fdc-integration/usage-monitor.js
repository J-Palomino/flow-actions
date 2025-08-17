/**
 * Usage Monitor - Production deployment script
 * Monitors LiteLLM usage and updates Flow subscription pricing in real-time
 */

const { LiteLLMUsageOracle } = require('./litellm-usage-oracle');

// Configuration
const config = {
    litellmApiUrl: process.env.LITELLM_API_URL || 'https://llm.p10p.io',
    litellmApiKey: process.env.LITELLM_API_KEY,
    flowRpcUrl: process.env.FLOW_RPC_URL || 'https://rest-testnet.onflow.org',
    contractAddress: process.env.FLOW_CONTRACT_ADDRESS || '0x7ee75d81c7229a61',
    privateKey: process.env.FLOW_PRIVATE_KEY,
    fdcEndpoint: process.env.FDC_ENDPOINT
};

// Customer mapping: vault ID -> LiteLLM user ID
const customerVaultMapping = {
    // Example mappings - these would come from your customer database
    "1": "user_123",
    "2": "user_456", 
    "3": "user_789"
};

async function main() {
    console.log('🚀 Starting LiteLLM Usage Monitor for Flow Subscriptions');
    console.log('Configuration:', {
        litellmUrl: config.litellmApiUrl,
        flowContract: config.contractAddress,
        monitoringCustomers: Object.keys(customerVaultMapping).length
    });

    try {
        // Initialize oracle
        const oracle = new LiteLLMUsageOracle(config);
        
        // Start monitoring
        await oracle.startMonitoring(customerVaultMapping);
        
        console.log('✅ Usage monitoring started successfully');
        console.log('📊 Real-time pricing updates will be sent to Flow blockchain');
        
        // Keep process running
        process.on('SIGINT', () => {
            console.log('\\n🛑 Shutting down usage monitor...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error starting usage monitor:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { config, customerVaultMapping };