# Usage-Based Billing with LiteLLM & Flare Data Connector

## Overview

This system enables **variable pricing based on actual LiteLLM usage**, automatically updating subscription costs and provider entitlements via Flare Data Connector (FDC) oracles.

## 🎯 Key Features

### ✅ **Dynamic Pricing Model**
- **Real-time usage tracking** from LiteLLM API
- **4-tier pricing structure** with volume discounts
- **Model-specific multipliers** (GPT-4 premium, GPT-3.5 standard)
- **Automatic tier upgrades** based on consumption

### ✅ **Automated Entitlement System**
- **Usage-based withdrawal limits** for providers
- **Auto-refreshing permissions** with each usage update
- **Secure, verifiable** payments on Flow blockchain
- **No overpayment/underpayment** - exact usage billing

### ✅ **Flare Data Connector Integration**
- **Real-time oracle updates** every 5 minutes
- **Cryptographically signed** usage data
- **Cross-chain compatibility** for EVM funding
- **Tamper-proof billing** records

## 💰 Pricing Tiers

| Tier | Usage Range | Price per 1K tokens | Volume Discount |
|------|-------------|---------------------|-----------------|
| **Starter** | 0-100K | $0.02 | 0% |
| **Growth** | 100K-1M | $0.015 | 10% |
| **Scale** | 1M-10M | $0.01 | 20% |
| **Enterprise** | 10M+ | $0.008 | 30% |

### Model Multipliers
- **GPT-4, Claude Opus**: 1.5x (premium models)
- **GPT-3.5, Claude Haiku**: 0.8x (efficient models)
- **Other models**: 1.0x (standard rate)

## 🔄 How It Works

### 1. **Customer Setup**
```cadence
// Customer creates subscription vault with initial funding
UsageBasedSubscriptions.createSubscriptionVault(
    owner: customerAddress,
    provider: serviceProviderAddress,
    serviceName: "LiteLLM API Access",
    initialDeposit: 100.0 // FLOW tokens
)
```

### 2. **Usage Tracking**
```javascript
// Oracle fetches LiteLLM usage data
const usageData = await oracle.fetchLiteLLMUsage(userId, "24h");
// {
//   totalTokens: 150000,
//   apiCalls: 500,
//   models: { "gpt-4": 50000, "gpt-3.5-turbo": 100000 },
//   totalCost: 12.50
// }
```

### 3. **FDC Trigger Submission**
```javascript
// Convert to FDC format and submit to Flow
const trigger = oracle.createFDCTrigger(vaultId, usageData);
await oracle.submitToFlow(trigger);
```

### 4. **Dynamic Pricing Calculation**
```cadence
// Smart contract calculates new price based on usage
// - Determines tier based on token count
// - Applies volume discounts
// - Applies model-specific multipliers
// - Updates provider entitlement
```

### 5. **Automated Payment**
```cadence
// Provider withdraws based on entitlement
vault.withdrawWithEntitlement(amount: calculatedPrice)
```

## 🚀 Deployment Steps

### 1. **Deploy Contracts**
```bash
# Add to flow.json deployments
"UsageBasedSubscriptions": {
    "source": "cadence/contracts/UsageBasedSubscriptions.cdc",
    "aliases": {
        "testnet": "0x7ee75d81c7229a61"
    }
}

# Deploy to testnet
flow project deploy --network testnet
```

### 2. **Configure LiteLLM Integration**
```bash
# Set environment variables
export LITELLM_API_URL="https://api.litellm.ai"
export LITELLM_API_KEY="your_litellm_api_key"
export FLOW_CONTRACT_ADDRESS="0x7ee75d81c7229a61"
export FLOW_PRIVATE_KEY="your_flow_private_key"

# Start usage monitor
node scripts/fdc-integration/usage-monitor.js
```

### 3. **Register FDC Handler**
```cadence
// Register LiteLLM usage handler with FDC
let handler <- UsageBasedSubscriptions.createLiteLLMHandler()
let registry = FlareFDCTriggers.getRegistryRef()
registry.registerHandler(
    handlerId: "litellm-usage",
    handler: handler,
    triggerTypes: [FlareFDCTriggers.TriggerType.DefiProtocolEvent]
)
```

## 📊 Customer Experience

### **Before** (Fixed Subscription)
- Pay $50/month regardless of usage
- Overpay during low usage months
- Underpay during high usage months
- No transparency in billing

### **After** (Usage-Based)
- Pay exactly for tokens consumed
- Automatic volume discounts
- Real-time pricing updates
- Transparent blockchain records

### **Example Billing**
```
Usage: 250,000 tokens (Growth tier)
Base cost: 250 × $0.015 = $3.75
Volume discount (10%): -$0.375
GPT-4 usage (50%): +50% premium
Final cost: $5.06

Traditional subscription: $50
Savings: $44.94 (89% less!)
```

## 🔧 Integration Code Examples

### **Customer Vault Creation**
```cadence
transaction(providerAddress: Address, initialDeposit: UFix64) {
    prepare(customer: auth(BorrowValue, Storage) &Account) {
        let vault <- customer.storage.borrow<&FlowToken.Vault>()!
            .withdraw(amount: initialDeposit)
        
        let vaultId = UsageBasedSubscriptions.createSubscriptionVault(
            owner: customer.address,
            provider: providerAddress,
            serviceName: "LiteLLM API",
            initialDeposit: <- vault
        )
    }
}
```

### **Usage Data Submission**
```javascript
// In your Node.js oracle
const oracle = new LiteLLMUsageOracle(config);

// Monitor customer usage
oracle.startMonitoring({
    "1": "customer_user_123",  // vault ID 1 -> LiteLLM user
    "2": "customer_user_456",  // vault ID 2 -> LiteLLM user
    "3": "customer_user_789"   // vault ID 3 -> LiteLLM user
});
```

### **Provider Withdrawal**
```cadence
transaction(customerAddress: Address, vaultId: UInt64, amount: UFix64) {
    prepare(provider: auth(BorrowValue) &Account) {
        let vault = UsageBasedSubscriptions.borrowVault(
            owner: customerAddress,
            vaultId: vaultId
        )!
        
        let payment <- vault.withdrawWithEntitlement(amount: amount)
        // Deposit to provider account
    }
}
```

## 🔒 Security Features

- **Cryptographic signatures** on all usage data
- **Tamper-proof** FDC oracle system
- **Automated entitlement limits** prevent overcharging
- **Transparent blockchain** records for auditing
- **Multi-signature** support for enterprise accounts

## 📈 Analytics & Insights

The system provides:
- **Real-time usage dashboards**
- **Cost prediction models**
- **Tier optimization recommendations**
- **Model usage analytics**
- **Billing history and trends**

## 💡 Business Benefits

### **For Customers**
- **Pay only for actual usage**
- **Automatic volume discounts**
- **Transparent pricing**
- **No surprise bills**

### **For Providers**
- **Guaranteed payment** for actual usage
- **Reduced billing disputes**
- **Automated collection**
- **Real-time revenue tracking**

---

## 🎯 Next.js Integration

The usage-based subscription system can be integrated with Next.js using Flow SDK and React hooks for a complete frontend experience.

Ready to revolutionize subscription billing with usage-based pricing powered by Flare Data Connector!