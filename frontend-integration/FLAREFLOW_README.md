# 🔗 FlareFlow.link

**The Premier Platform for LiteLLM API Key Management with Flare Oracle Integration and Flow Blockchain Billing**

FlareFlow.link revolutionizes AI API management by combining Flare's cross-chain oracle capabilities with Flow blockchain's transparent billing system, creating individual LiteLLM subscriptions with unique API keys and real-time usage tracking.

## 🌟 Key Features

### 🔥 Flare Oracle Integration
- **Real-time Usage Monitoring**: Flare oracles continuously track LiteLLM API usage
- **Cross-chain Data Feeds**: Secure data verification across multiple blockchain networks
- **Automated Billing Triggers**: Usage data automatically triggers Flow blockchain payments

### ⚡ Flow Blockchain Payments
- **Transparent Billing**: All transactions recorded on Flow blockchain
- **Usage-based Pricing**: Pay only for what you use with dynamic tier pricing
- **Smart Contract Security**: Immutable billing logic with automated payments

### 🔑 Individual API Key Management
- **Unique Keys per Subscription**: Each subscription generates its own LiteLLM API key
- **Isolated Usage Tracking**: Individual analytics for each subscription
- **Flexible Key Management**: Update, rotate, or revoke keys as needed

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Flow wallet (Blocto, Lilico, etc.)
- FLOW tokens for subscriptions

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/flareflow-link
cd flareflow-link/frontend-integration

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access FlareFlow.link
Open [http://localhost:3003](http://localhost:3003) in your browser.

## 📱 User Guide

### 1. Connect Your Wallet
- Click "Connect Wallet" 
- Choose your Flow wallet provider
- Approve the connection

### 2. Create Your First Subscription
- Navigate to "Create New" tab
- Set provider address (default: `0x6daee039a7b9c2f0`)
- Choose initial FLOW deposit amount
- Click "Create Subscription & API Key"

### 3. Manage Your Subscriptions
- View all subscriptions in tile format
- Each tile shows:
  - Unique LiteLLM API key
  - Real-time usage statistics
  - Cost breakdown by model
  - Recent activity history

### 4. Monitor Usage & Costs
- **Real-time Analytics**: Live usage metrics and cost tracking
- **Model Breakdown**: Separate tracking for GPT-4, GPT-3.5, Claude, etc.
- **Usage History**: Detailed logs of all API calls
- **Cost Projections**: Monthly spending forecasts

## 🔧 Technical Architecture

### Frontend Stack
- **Next.js 14**: React framework with server-side rendering
- **Flow Client Library (FCL)**: Blockchain wallet integration
- **Tailwind CSS**: Responsive styling framework
- **Axios**: HTTP client for API communication

### Blockchain Integration
- **Flow Mainnet**: Primary blockchain for payments and storage
- **Smart Contracts**: Usage-based subscription logic
- **FCL Authentication**: Secure wallet connectivity

### Oracle Integration
- **Flare Network**: Cross-chain oracle data feeds
- **Real-time Monitoring**: Continuous usage tracking
- **Automated Triggers**: Usage-based billing events

### API Management
- **LiteLLM Integration**: Automatic API key generation
- **Usage Tracking**: Real-time consumption monitoring
- **Cost Calculation**: Dynamic pricing based on usage tiers

## 💰 Pricing Tiers

| Tier | Token Range | Price/1K Tokens | Volume Discount |
|------|-------------|-----------------|-----------------|
| **Starter** | 0 - 100K | 0.020 FLOW | 0% |
| **Growth** | 100K - 1M | 0.015 FLOW | 10% |
| **Scale** | 1M - 10M | 0.010 FLOW | 20% |
| **Enterprise** | 10M+ | 0.008 FLOW | 30% |

### Model Multipliers
- **GPT-4**: 1.5x base price (premium model)
- **GPT-3.5**: 0.8x base price (standard model)
- **Claude**: 1.2x base price (mid-tier model)
- **Llama**: 0.6x base price (economical model)

## 🔐 Security Features

### Blockchain Security
- **Immutable Records**: All transactions recorded on Flow blockchain
- **Smart Contract Verification**: Automated billing logic validation
- **Transparent Pricing**: Public pricing algorithms

### API Key Security
- **Individual Isolation**: Each subscription has unique API key
- **Revocation Capability**: Instant key deactivation
- **Usage Limits**: Configurable spending caps

### Oracle Security
- **Flare Verification**: Cross-chain data validation
- **Cryptographic Proofs**: Tamper-proof usage data
- **Real-time Monitoring**: Continuous data integrity checks

## 🛠 Development

### Project Structure
```
frontend-integration/
├── components/
│   ├── SubscriptionManager.jsx    # Main dashboard
│   ├── SubscriptionTile.jsx       # Individual subscription display
│   ├── AdminPricingControls.jsx   # Admin configuration
│   └── StorageChecker.jsx         # Flow storage validation
├── services/
│   └── litellmKeyService.js       # LiteLLM API integration
├── hooks/
│   └── useUsageSubscription.js    # React hooks for blockchain
├── config/
│   └── flowConfig.js             # Flow network configuration
└── pages/
    └── index.js                  # Main application page
```

### Environment Variables
```bash
# LiteLLM Configuration
NEXT_PUBLIC_LITELLM_URL=https://llm.p10p.io
NEXT_PUBLIC_LITELLM_ADMIN_KEY=your_admin_key

# Flow Configuration  
NEXT_PUBLIC_FLOW_NETWORK=mainnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6daee039a7b9c2f0

# Flare Oracle Configuration
NEXT_PUBLIC_FLARE_ENDPOINT=https://coston2-api.flare.network/ext/bc/C/rpc
```

### Build & Deploy
```bash
# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📊 API Reference

### Subscription Management
```javascript
// Create new subscription
const result = await createSubscriptionVault(
  providerAddress,    // Flow address of service provider
  depositAmount,      // Initial FLOW deposit
  customerAddress     // Flow address of customer
);

// Get user subscriptions
const subscriptions = await getUserSubscriptions(userAddress);

// Update subscription settings
await updateSubscription(vaultId, {
  maxBudget: 200.0,
  permissions: { chat_completions: true }
});

// Delete subscription
await deleteSubscription(vaultId);
```

### Usage Analytics
```javascript
// Get usage data for specific API key
const usage = await litellmKeyService.getKeyUsage(
  apiKey,     // LiteLLM API key
  startDate,  // Optional start date
  endDate     // Optional end date
);

// Usage data structure
{
  usage_summary: {
    total_requests: 150,
    total_tokens: 75000,
    total_cost: 1.50
  },
  model_breakdown: {
    "gpt-4": { requests: 50, tokens: 25000, cost: 1.25 },
    "gpt-3.5-turbo": { requests: 100, tokens: 50000, cost: 0.25 }
  },
  recent_requests: [...],
  daily_usage: [...]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [FlareFlow.link](https://flareflow.link)
- **Flow Contract**: [0x6daee039a7b9c2f0](https://www.flowdiver.io/account/0x6daee039a7b9c2f0)
- **Flare Network**: [flare.network](https://flare.network)
- **Flow Blockchain**: [onflow.org](https://onflow.org)

## 📞 Support

- **Documentation**: [docs.flareflow.link](https://docs.flareflow.link)
- **Issues**: [GitHub Issues](https://github.com/your-org/flareflow-link/issues)
- **Discord**: [FlareFlow Community](https://discord.gg/flareflow)

---

**FlareFlow.link** - *Bridging Flare Oracle Intelligence with Flow Blockchain Payments*