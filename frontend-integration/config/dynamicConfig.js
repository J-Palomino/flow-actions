// Dynamic Labs configuration for Flow mainnet
export const DYNAMIC_CONFIG = {
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || 'live_26e2b9f0-6b8a-4e8a-a7c3-3f4d5c6e7f8a', // Replace with your Dynamic environment ID
    walletConnectors: ['flow'],
    networks: [{
        blockExplorerUrls: ['https://www.flowdiver.io'],
        chainId: 747, // Flow mainnet chain ID
        chainName: 'Flow Mainnet',
        iconUrls: ['https://assets-global.website-files.com/618c953e65cc2ba3f44d1a02/618c953e65cc2b4d844d1a72_flow-logo.svg'],
        name: 'flow',
        nativeCurrency: {
            decimals: 8,
            name: 'Flow',
            symbol: 'FLOW',
        },
        networkId: 747,
        rpcUrls: ['https://rest-mainnet.onflow.org'],
        vanityName: 'Flow',
    }],
    handlers: {
        handleConnectedWallet: async (args) => {
            console.log('✅ Dynamic wallet connected:', args);
        },
        handleDisconnectedWallet: async (args) => {
            console.log('🔌 Dynamic wallet disconnected:', args);
        },
    },
    walletConnectorExtensions: [
        {
            key: 'flow',
            name: 'Flow',
        },
    ],
};

export const DYNAMIC_THEME = {
    theme: 'auto', // 'light', 'dark', or 'auto'
    variant: 'modal', // 'modal' or 'embedded'
};