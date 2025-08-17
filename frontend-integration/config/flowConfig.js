import * as fcl from '@onflow/fcl';

// Force mainnet only - no emulator, no mock data
const getFlowEnvironment = () => {
    // ALWAYS use mainnet with real data
    return 'mainnet';
};

const FLOW_ENV = getFlowEnvironment();
// Only log in development mode to prevent build hangs
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🌊 Flow Environment detected:', FLOW_ENV);
}

// Mainnet-only configuration for native Flow wallet integration
const FLOW_CONFIGS = {
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
    .put('discovery.authn.include', ['0x82ec283f88a62e65']) // Blocto wallet service
    .put('app.detail.title', currentConfig['app.detail.title'])
    .put('app.detail.icon', currentConfig['app.detail.icon'])
    .put('flow.network', currentConfig['flow.network'])
    .put('fcl.limit', 9999)
    .put('fcl.accountProof.resolver', async () => {
      return {
        appIdentifier: 'FlareFlow.link',
        nonce: Math.floor(Math.random() * 1000000).toString()
      };
    });
  
  // Only log in development mode to prevent build hangs
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('✅ FCL configured successfully for MAINNET (Native Flow Wallet)');
    console.log('🌊 FCL Configuration:', currentConfig);
  }
} catch (error) {
  console.error('❌ FCL configuration error:', error);
}

// Real mainnet contract addresses only
const CONTRACT_ADDRESSES = {
    mainnet: {
        FlowToken: '0x1654653399040a61',           // Real Flow mainnet
        FungibleToken: '0xf233dcee88fe0abe',        // Real FungibleToken mainnet  
        DynamicEntitlements: '0x6daee039a7b9c2f0',      // Real deployed contract
        UsageBasedSubscriptions: '0x6daee039a7b9c2f0',   // Real deployed contract
        FTSOPriceFeedConnector: '0x6daee039a7b9c2f0',    // Real deployed contract
        FlareFDCTriggers: '0x6daee039a7b9c2f0',          // Real deployed contract
        ExampleConnectors: '0x6daee039a7b9c2f0'          // Real deployed contract
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