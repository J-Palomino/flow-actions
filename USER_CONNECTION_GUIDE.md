# User Connection Guide - Flow Mainnet

## Overview
This guide explains how users connect their wallets to the usage-based subscription system deployed on Flow Mainnet.

## Deployed Contracts (Mainnet)
- **SimpleUsageSubscriptions**: `0x6daee039a7b9c2f0`
- **FlareFDCTriggers**: `0x6daee039a7b9c2f0`
- **LayerZeroConnectors**: `0x6daee039a7b9c2f0`

## Connection Flow

### 1. Connect Your Wallet

Users can connect using any Flow-compatible wallet:
- **Blocto Wallet**: https://blocto.io
- **Flow Reference Wallet**: Chrome extension
- **Lilico Wallet**: https://lilico.app
- **Flow Port**: https://port.onflow.org

### 2. Create a Subscription Vault

Users create a subscription vault that:
- Holds FLOW tokens for payments
- Grants payment entitlements to providers
- Tracks usage from external services (like LiteLLM)

```javascript
// Example using FCL (Flow Client Library)
import * as fcl from "@onflow/fcl";

// Configure FCL for mainnet
fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/authn",
  "app.detail.title": "Usage-Based Subscriptions",
  "app.detail.icon": "https://your-app.com/icon.png"
});

// Create subscription
async function createSubscription(providerAddress, initialDeposit) {
  const transactionId = await fcl.mutate({
    cadence: `
      import FlowToken from 0x1654653399040a61
      import FungibleToken from 0xf233dcee88fe0abe
      import SimpleUsageSubscriptions from 0x6daee039a7b9c2f0

      transaction(providerAddress: Address, initialDeposit: UFix64) {
        prepare(customer: auth(BorrowValue, Storage) &Account) {
          // Withdraw FLOW tokens
          let flowVault = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow Flow vault")
          
          let deposit <- flowVault.withdraw(amount: initialDeposit) as! @FlowToken.Vault
          
          // Create subscription vault
          let vault <- SimpleUsageSubscriptions.createSubscriptionVault(
            customer: customer.address,
            provider: providerAddress,
            initialDeposit: <- deposit
          )
          
          // Store vault
          customer.storage.save(<- vault, to: SimpleUsageSubscriptions.VaultStoragePath)
          
          // Create public capability
          let vaultCap = customer.capabilities.storage.issue<&SimpleUsageSubscriptions.SubscriptionVault>(
            SimpleUsageSubscriptions.VaultStoragePath
          )
          customer.capabilities.publish(vaultCap, at: SimpleUsageSubscriptions.VaultPublicPath)
        }
      }
    `,
    args: (arg, t) => [
      arg(providerAddress, t.Address),
      arg(initialDeposit, t.UFix64)
    ],
    limit: 1000
  });
  
  return transactionId;
}
```

### 3. Storage Paths

The subscription vault is stored at these paths in the user's account:
- **Storage Path**: `/storage/SimpleUsageSubscriptionVault`
- **Public Path**: `/public/SimpleUsageSubscriptionVault`

### 4. Usage Flow

1. **User Creates Vault**: Deposits FLOW tokens and grants provider entitlement
2. **External Service Tracks Usage**: LiteLLM or other service tracks API usage
3. **Flare Oracle Updates**: Flare FDC sends usage data to Flow contract
4. **Dynamic Pricing Applied**: Contract calculates price based on:
   - Token consumption tier
   - Model types (GPT-4 vs GPT-3.5)
   - Volume discounts
5. **Provider Withdraws**: Provider can only withdraw the exact usage amount

### 5. Pricing Tiers

The system automatically applies these tiers based on usage:

| Tier | Token Range | Price per 1K | Discount |
|------|------------|--------------|----------|
| Starter | 0 - 100K | $0.02 | 0% |
| Growth | 100K - 1M | $0.015 | 10% |
| Scale | 1M - 10M | $0.01 | 20% |
| Enterprise | 10M+ | $0.008 | 30% |

Model multipliers:
- GPT-4: 1.5x base price
- GPT-3.5: 0.8x base price

### 6. Check Your Subscription

Users can check their subscription status:

```javascript
async function checkSubscription(userAddress) {
  const result = await fcl.query({
    cadence: `
      import SimpleUsageSubscriptions from 0x6daee039a7b9c2f0
      
      access(all) fun main(address: Address): {String: AnyStruct}? {
        let account = getAccount(address)
        let vaultRef = account.capabilities.borrow<&SimpleUsageSubscriptions.SubscriptionVault>(
          SimpleUsageSubscriptions.VaultPublicPath
        )
        
        if let vault = vaultRef {
          return {
            "vaultId": vault.id,
            "customer": vault.customer,
            "provider": vault.provider,
            "balance": vault.getBalance(),
            "currentPrice": vault.currentPrice,
            "currentTier": vault.currentTier.name,
            "allowedWithdrawal": vault.allowedWithdrawal
          }
        }
        return nil
      }
    `,
    args: (arg, t) => [arg(userAddress, t.Address)]
  });
  
  return result;
}
```

### 7. Top Up Your Subscription

Add more FLOW tokens to your subscription:

```javascript
async function topUpSubscription(amount) {
  const transactionId = await fcl.mutate({
    cadence: `
      import FlowToken from 0x1654653399040a61
      import FungibleToken from 0xf233dcee88fe0abe
      import SimpleUsageSubscriptions from 0x6daee039a7b9c2f0
      
      transaction(amount: UFix64) {
        prepare(customer: auth(BorrowValue) &Account) {
          let vaultRef = customer.storage.borrow<&SimpleUsageSubscriptions.SubscriptionVault>(
            from: SimpleUsageSubscriptions.VaultStoragePath
          ) ?? panic("No subscription vault found")
          
          let flowVault = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow Flow vault")
          
          let deposit <- flowVault.withdraw(amount: amount)
          vaultRef.deposit(from: <- deposit)
        }
      }
    `,
    args: (arg, t) => [arg(amount, t.UFix64)],
    limit: 1000
  });
  
  return transactionId;
}
```

## Frontend Integration

For a complete React integration example, see: `frontend-integration/`

Key files:
- `hooks/useUsageSubscription.js` - React hook for subscription management
- `components/CreateSubscriptionForm.jsx` - UI component for creating subscriptions
- `config/flowConfig.js` - FCL configuration for mainnet

## Testing Your Connection

1. **Connect Wallet**: Use the discovery UI or direct wallet connection
2. **Create Small Test Subscription**: Start with 1.0 FLOW
3. **Check Status**: Query your vault details
4. **Monitor Usage**: Watch as Flare oracle updates your usage
5. **Verify Billing**: Check that pricing matches your tier

## Support

- **Flow Discord**: https://discord.gg/flow
- **Documentation**: https://docs.onflow.org
- **Block Explorer**: https://www.flowdiver.io/account/0x6daee039a7b9c2f0

## Security Notes

- Never share your private keys
- Verify contract addresses before interacting
- Start with small amounts when testing
- Check transaction details before signing
- Monitor your subscription balance regularly