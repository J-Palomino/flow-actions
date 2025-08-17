# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend-integration
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to: http://localhost:3000

## Features Implemented

### ✅ Flow Mainnet Integration
- **Contract Address**: `0x6daee039a7b9c2f0`
- **Network**: Flow Mainnet
- **FCL Configuration**: Automatic wallet discovery

### ✅ Subscription Dashboard
- Create usage-based subscription vaults
- Real-time FLOW balance checking
- Subscription status monitoring
- Top-up functionality

### ✅ Transaction Insights
- Live transaction status tracking
- Block explorer integration (FlowDiver)
- Event monitoring and parsing
- Error handling and display

### ✅ Flare Oracle Status
- FDC integration monitoring
- Supported trigger types display
- Data feed status indicators

### ✅ Dynamic Pricing Display
- Tier-based pricing visualization
- Model multiplier explanations
- Volume discount calculations

## Key Components

### `config/flowConfig.js`
- FCL configuration for mainnet
- Contract address constants
- Transaction status enums
- Pricing tier definitions

### `hooks/useUsageSubscription.js`
- Subscription creation logic
- Vault information queries
- FLOW balance checking
- Transaction monitoring
- FDC status checking

### `components/SubscriptionDashboard.jsx`
- Complete user interface
- Wallet connection management
- Tab-based navigation
- Transaction status display
- Error handling

### `pages/index.js`
- Main application page
- Header and footer
- Dashboard integration

## User Flow

### 1. Connect Wallet
- Click "Connect Wallet"
- Choose wallet (Blocto, Lilico, etc.)
- Authorize connection

### 2. Create Subscription
- Enter provider address (default: `0x6daee039a7b9c2f0`)
- Set initial deposit amount
- Click "Create Subscription"
- Monitor transaction status

### 3. Manage Subscription
- View vault details
- Check usage data
- Top up subscription
- Monitor pricing tier

## Transaction Monitoring

The application provides real-time transaction insights:

1. **Status Tracking**: PENDING → EXECUTED → SEALED
2. **Block Explorer**: Direct links to FlowDiver
3. **Event Parsing**: Extract vault IDs and metadata
4. **Error Handling**: User-friendly error messages

## Flare Oracle Integration

- **Status Monitoring**: Check FDC integration health
- **Data Types**: Price, volume, liquidity triggers
- **Update Frequency**: Every 5 minutes
- **Verification**: Cryptographic signature validation

## Deployment

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_FLOW_NETWORK=mainnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6daee039a7b9c2f0
```

### Build for Production
```bash
npm run build
npm start
```

## Dependencies

### Core
- `@onflow/fcl` - Flow Client Library
- `@onflow/types` - Flow type definitions
- `next` - React framework
- `react` - UI library

### Styling
- `tailwindcss` - Utility-first CSS

## Troubleshooting

### Wallet Connection Issues
1. Ensure wallet extension is installed
2. Check network selection (mainnet)
3. Clear browser cache if needed

### Transaction Failures
1. Check FLOW balance
2. Verify contract address
3. Monitor gas limits

### Oracle Data Issues
1. Check FDC status indicator
2. Verify trigger type support
3. Monitor data feed frequency

## Security Notes

- Never store private keys in frontend
- Always verify transaction details
- Use official wallet extensions
- Validate contract addresses
- Monitor transaction status

## Support

- **Flow Documentation**: https://docs.onflow.org
- **FCL Docs**: https://developers.flow.com/tools/fcl-js
- **Contract Explorer**: https://www.flowdiver.io/account/0x6daee039a7b9c2f0