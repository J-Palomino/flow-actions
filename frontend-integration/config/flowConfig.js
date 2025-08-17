import { config } from '@onflow/fcl';

// Flow configuration for testnet
config({
    'accessNode.api': 'https://rest-testnet.onflow.org', // Testnet Access Node
    'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn', // Testnet Wallet Discovery
    'app.detail.title': 'Usage-Based Subscriptions', // Your app name
    'app.detail.icon': 'https://placekitten.com/g/200/200', // Your app icon
    'flow.network': 'testnet'
});

// Contract addresses on testnet
export const CONTRACTS = {
    FlowToken: '0x7e60df042a9c0868',
    FungibleToken: '0x9a0766d93b6608b7',
    SimpleUsageSubscriptions: '0x7ee75d81c7229a61',
    FlareFDCTriggers: '0x7ee75d81c7229a61',
    LayerZeroConnectors: '0x7ee75d81c7229a61'
};

// Export configured fcl
export { fcl } from '@onflow/fcl';