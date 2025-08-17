# Usage-Based Subscriptions Frontend

A Next.js application that allows users to create and manage usage-based subscriptions for LiteLLM billing on Flow blockchain.

## 🚀 Quick Start

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
Visit `http://localhost:3000`

## 🎯 How Users Call the Contract

### 1. **Connect Flow Wallet**
Users click "Connect Flow Wallet" which triggers:
```javascript
import * as fcl from '@onflow/fcl';
fcl.authenticate();
```

### 2. **Create Subscription Vault**
When the form is submitted, it calls:
```javascript
const txId = await fcl.mutate({
    cadence: CREATE_SUBSCRIPTION_TRANSACTION,
    args: (arg, t) => [
        arg(providerAddress, t.Address),
        arg(initialDepositAmount.toFixed(8), t.UFix64)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 9999
});
```

### 3. **Transaction Executed**
The Cadence transaction runs:
```cadence
// Create subscription vault
self.vault <- SimpleUsageSubscriptions.createSubscriptionVault(
    customer: customer.address,
    provider: providerAddress,
    initialDeposit: <- depositVault
)

// Store in user's account
customer.storage.save(<- self.vault, to: SimpleUsageSubscriptions.VaultStoragePath)
```

## 📱 Components

### `CreateSubscriptionForm.jsx`
- Main UI component for creating subscriptions
- Handles wallet connection
- Shows Flow balance and vault status
- Form validation and transaction submission

### `useUsageSubscription.js`
- React hook for contract interactions
- Functions: `createSubscriptionVault()`, `getVaultInfo()`, `checkFlowBalance()`
- Transaction status management
- Error handling

### `flowConfig.js`
- Flow testnet configuration
- Contract addresses
- FCL setup

## 🔧 Key Features

### ✅ **Wallet Integration**
- Flow wallet connection via FCL
- Automatic balance checking
- Transaction signing

### ✅ **Smart Contract Calls**
- Direct calls to `SimpleUsageSubscriptions.createSubscriptionVault()`
- Real-time transaction status
- Event listening for vault creation

### ✅ **User Experience**
- Form validation (sufficient balance, valid addresses)
- Loading states and progress indicators
- Success/error feedback
- Vault information display

### ✅ **Real-time Updates**
- Check existing vaults
- Display current pricing tier
- Show allowed withdrawal amounts
- Refresh data functionality

## 🎯 User Flow

1. **Visit Website** → User sees subscription form
2. **Connect Wallet** → FCL opens wallet selection
3. **Choose Provider** → Enter service provider address
4. **Set Deposit** → Specify initial FLOW amount
5. **Submit Form** → Triggers `createSubscriptionVault()` transaction
6. **Sign Transaction** → User approves in wallet
7. **Vault Created** → Success message with vault ID
8. **Usage Tracking** → Automatic LiteLLM integration begins

## 🔒 Security Features

- **Client-side validation** before sending transactions
- **Balance checking** to prevent insufficient funds
- **Transaction status monitoring** for transparency
- **Error handling** for failed transactions

## 🌐 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
```bash
# Optional: Custom RPC endpoints
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_NETWORK=testnet
```

## 📊 Contract Addresses (Testnet)

- **SimpleUsageSubscriptions**: `0x7ee75d81c7229a61`
- **FlowToken**: `0x7e60df042a9c0868`
- **FungibleToken**: `0x9a0766d93b6608b7`

## 🔗 Integration Points

### **LiteLLM API**: `https://llm.p10p.io`
- Real-time usage tracking
- Model-specific consumption data
- Cost calculations

### **Flare Data Connector**
- Oracle for usage data
- 5-minute update intervals
- Automated pricing updates

### **Flow Blockchain**
- Secure transaction processing
- Transparent billing records
- Automated entitlements

---

**Ready to use!** Users can now create usage-based subscriptions directly from the web interface with their Flow wallet connected.