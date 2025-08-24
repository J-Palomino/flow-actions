import * as fcl from '@onflow/fcl';

// Use mainnet for both development and production
const getFlowEnvironment = () => {
    // Deploy and test on mainnet with real wallets
    return 'mainnet';
};

const FLOW_ENV = getFlowEnvironment();
// Only log in development mode to prevent build hangs
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🌊 Flow Environment detected:', FLOW_ENV);
}

// Configuration for both emulator and mainnet
const FLOW_CONFIGS = {
    emulator: {
        'accessNode.api': 'http://localhost:8888',
        'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
        'app.detail.title': 'FlareFlow.link - Usage-Based Subscriptions (Emulator)',
        'app.detail.icon': 'https://placekitten.com/g/200/200', 
        'flow.network': 'emulator',
        // Add dev wallet for emulator
        'challenge.handshake': 'https://fcl-discovery.onflow.org/testnet/authn'
    },
    mainnet: {
        'accessNode.api': 'https://rest-mainnet.onflow.org',
        'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
        'app.detail.title': 'FlareFlow.link - Usage-Based Subscriptions (Mainnet)',
        'app.detail.icon': 'https://placekitten.com/g/200/200', 
        'flow.network': 'mainnet'
    }
};

// Configure FCL for detected environment
const currentConfig = FLOW_CONFIGS[FLOW_ENV];

// Configure FCL for mainnet with native Flow wallet support
try {
  fcl.config()
    .put('accessNode.api', currentConfig['accessNode.api'])
    .put('discovery.wallet', currentConfig['discovery.wallet'])
    .put('discovery.authn.endpoint', currentConfig['discovery.wallet'])
    .put('app.detail.title', currentConfig['app.detail.title'])
    .put('app.detail.icon', currentConfig['app.detail.icon'])
    .put('flow.network', currentConfig['flow.network'])
    .put('fcl.limit', 9999)
    // Remove accountProof resolver to prevent hanging
    .put('challenge.handshake', 'https://fcl-discovery.onflow.org/authn');
  
  // Only log in development mode to prevent build hangs
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('✅ FCL configured successfully for MAINNET (Native Flow Wallet)');
    console.log('🌊 FCL Configuration:', currentConfig);
  }
} catch (error) {
  console.error('❌ FCL configuration error:', error);
}

// Contract addresses for both environments
const CONTRACT_ADDRESSES = {
    emulator: {
        FlowToken: '0x0ae53cb6e3f42a79',           // Emulator FlowToken
        FungibleToken: '0xee82856bf20e2aa6',        // Emulator FungibleToken
        DeFiActions: '0xf8d6e0586b0a20c7',          // Emulator DeFiActions
        DynamicEntitlements: '0xf8d6e0586b0a20c7',      // Deployed to emulator
        UsageBasedSubscriptions: '0xf8d6e0586b0a20c7',   // Deployed to emulator
        EncryptedUsageSubscriptions: '0xf8d6e0586b0a20c7', // Encrypted contract (emulator)
        SimpleUsageSubscriptions: '0xf8d6e0586b0a20c7',  // Deployed to emulator (alias)
        FTSOPriceFeedConnector: '0xf8d6e0586b0a20c7',    // Deployed to emulator
        FlareFDCTriggers: '0xf8d6e0586b0a20c7',          // Deployed to emulator
        ExampleConnectors: '0xf8d6e0586b0a20c7'          // Deployed to emulator
    },
    mainnet: {
        FlowToken: '0x1654653399040a61',           // Real Flow mainnet
        FungibleToken: '0xf233dcee88fe0abe',        // Real FungibleToken mainnet
        DeFiActions: '0x92195d814edf9cb0',          // Official Flow Actions contract
        DynamicEntitlements: '0x6daee039a7b9c2f0',      // Deployed contracts
        UsageBasedSubscriptions: '0x6daee039a7b9c2f0',   // Original contract
        EncryptedUsageSubscriptions: '0x6daee039a7b9c2f0', // New contract with encrypted key storage
        SimpleUsageSubscriptions: '0x6daee039a7b9c2f0',  // Deployed contract (alias)
        FTSOPriceFeedConnector: '0x6daee039a7b9c2f0',    // Updated with price feeds
        ChainlinkPriceFeedConnector: '0x6daee039a7b9c2f0', // Chainlink oracle fallback
        FlareFDCTriggers: '0x6daee039a7b9c2f0',          // Deployed contract
        ExampleConnectors: '0x6daee039a7b9c2f0'          // Deployed contract
    }
};

// Debug contract addresses and FCL health check only in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment contracts:', CONTRACT_ADDRESSES[FLOW_ENV]);
  console.log('🏥 FCL Health Check:');
  console.log('  - FCL object:', typeof fcl);
  console.log('  - FCL.config:', typeof fcl.config);
  console.log('  - FCL.authenticate:', typeof fcl.authenticate);
  console.log('  - FCL.currentUser:', typeof fcl.currentUser);
}

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