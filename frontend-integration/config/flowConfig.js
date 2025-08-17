import * as fcl from '@onflow/fcl';

// Force mainnet only - no emulator, no mock data
const getFlowEnvironment = () => {
    // ALWAYS use mainnet with real data
    return 'mainnet';
};

const FLOW_ENV = getFlowEnvironment();
console.log('🌊 Flow Environment detected:', FLOW_ENV);

// Mainnet-only configuration for Dynamic/Privy wallet integration
const FLOW_CONFIGS = {
    mainnet: {
        'accessNode.api': 'https://rest-mainnet.onflow.org',
        'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
        'discovery.wallet.method': 'IFRAME/RPC',
        'app.detail.title': 'FlareFlow.link - Usage-Based Subscriptions (Mainnet)',
        'app.detail.icon': 'https://placekitten.com/g/200/200', 
        'flow.network': 'mainnet'
    }
};

// Configure FCL for detected environment
const currentConfig = FLOW_CONFIGS[FLOW_ENV];

// Configure FCL for mainnet with Dynamic/Privy wallet support
try {
  fcl.config()
    .put('accessNode.api', currentConfig['accessNode.api'])
    .put('discovery.wallet', currentConfig['discovery.wallet'])
    .put('discovery.wallet.method', currentConfig['discovery.wallet.method'])
    .put('app.detail.title', currentConfig['app.detail.title'])
    .put('app.detail.icon', currentConfig['app.detail.icon'])
    .put('flow.network', currentConfig['flow.network']);
  
  console.log('✅ FCL configured successfully for MAINNET (Dynamic/Privy ready)');
} catch (error) {
  console.error('❌ FCL configuration error:', error);
}

// Debug FCL configuration
console.log('🌊 FCL Configuration:', currentConfig);

// Real mainnet contract addresses only
const CONTRACT_ADDRESSES = {
    mainnet: {
        FlowToken: '0x1654653399040a61',           // Real Flow mainnet
        FungibleToken: '0xf233dcee88fe0abe',        // Real FungibleToken mainnet  
        SimpleUsageSubscriptions: '0x6daee039a7b9c2f0',  // Real deployed contract
        UsageBasedSubscriptions: '0x6daee039a7b9c2f0',   // Real deployed contract
        FTSOPriceFeedConnector: '0x6daee039a7b9c2f0',    // Real deployed contract
        FlareFDCTriggers: '0x6daee039a7b9c2f0',          // Real deployed contract
        LayerZeroConnectors: '0x6daee039a7b9c2f0',       // Real deployed contract
        ExampleConnectors: '0x6daee039a7b9c2f0'          // Real deployed contract
    }
};

// Debug contract addresses
console.log('🔧 Environment contracts:', CONTRACT_ADDRESSES[FLOW_ENV]);

// FCL Health Check
console.log('🏥 FCL Health Check:');
console.log('  - FCL object:', typeof fcl);
console.log('  - FCL.config:', typeof fcl.config);
console.log('  - FCL.authenticate:', typeof fcl.authenticate);
console.log('  - FCL.currentUser:', typeof fcl.currentUser);

// Export contracts for current environment
export const CONTRACTS = CONTRACT_ADDRESSES[FLOW_ENV];
export const FLOW_NETWORK = FLOW_ENV;

// Transaction status tracking
export const TX_STATUS = {
    PENDING: 'PENDING',
    SEALED: 'SEALED',
    EXECUTED: 'EXECUTED',
    ERROR: 'ERROR'
};

// Pricing tiers for display
export const PRICING_TIERS = {
    STARTER: { name: 'Starter', range: '0-100K', price: 0.02, discount: 0 },
    GROWTH: { name: 'Growth', range: '100K-1M', price: 0.015, discount: 10 },
    SCALE: { name: 'Scale', range: '1M-10M', price: 0.01, discount: 20 },
    ENTERPRISE: { name: 'Enterprise', range: '10M+', price: 0.008, discount: 30 }
};

// Export fcl
export { fcl };