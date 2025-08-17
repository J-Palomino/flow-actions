import { config } from '@onflow/fcl';

// Flow configuration for mainnet
config({
    'accessNode.api': 'https://rest-mainnet.onflow.org', // Mainnet Access Node
    'discovery.wallet': 'https://fcl-discovery.onflow.org/authn', // Mainnet Wallet Discovery
    'app.detail.title': 'Usage-Based Subscriptions with Flare Oracle', // Your app name
    'app.detail.icon': 'https://placekitten.com/g/200/200', // Your app icon
    'flow.network': 'mainnet'
});

// Contract addresses on mainnet
export const CONTRACTS = {
    FlowToken: '0x1654653399040a61',
    FungibleToken: '0xf233dcee88fe0abe',
    SimpleUsageSubscriptions: '0x6daee039a7b9c2f0',
    FlareFDCTriggers: '0x6daee039a7b9c2f0',
    LayerZeroConnectors: '0x6daee039a7b9c2f0',
    ExampleConnectors: '0x6daee039a7b9c2f0'
};

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

// Import and re-export fcl
import * as fcl from '@onflow/fcl';
export { fcl };