# Frontend Access Guide

## 🚀 How Users Can See Their Data

### Quick Start
1. **Start the frontend**: `npm run dev` (starts on http://localhost:3001)
2. **Connect wallet**: Click "Connect Wallet" and use any Flow-compatible wallet
3. **View data**: Navigate to the "Usage Dashboard" tab

### ✅ What Users Can See

#### 📊 Usage Dashboard
- **Real-time metrics**: Total API calls, tokens processed, current pricing tier
- **Usage history**: Historical usage patterns with timestamps
- **Cost analysis**: Cost per API call, projected monthly spending
- **Oracle status**: Live connection to Flare oracle data feeds

#### 💰 Pricing Configuration  
- **Dynamic markup**: Adjust markup percentage (0-500%)
- **Base pricing**: Modify base price per 1K tokens
- **Model multipliers**: See different pricing for GPT-4, GPT-3.5, Claude, etc.
- **Live preview**: Real-time calculation of final pricing

### 🔍 Real Data Example

**Vault #424965** shows actual oracle-submitted data:
- ✅ **1 API call** processed from llm.p10p.io
- ✅ **1 token** (GPT-3.5-turbo) 
- ✅ **$0.00002000 FLOW** cost calculated
- ✅ **"Starter" tier** with real-time pricing
- ✅ **Oracle status**: "Active - Real LiteLLM Data"

### 📱 Frontend Structure

```
frontend-integration/
├── components/
│   ├── SubscriptionDashboard.jsx    # Main dashboard with tabs
│   ├── UsageDashboard.jsx          # User usage metrics & controls
│   ├── AdminPricingControls.jsx    # Admin-only pricing config
│   └── StorageChecker.jsx          # Flow storage validation
├── pages/
│   └── index.js                    # Main app page
├── config/
│   └── flowConfig.js              # Flow mainnet configuration
└── hooks/
    └── useUsageSubscription.js     # React hooks for blockchain
```

### 🔗 Data Flow

1. **LiteLLM API** → Real usage from llm.p10p.io
2. **Flare Oracle** → Processes and validates data
3. **Flow Mainnet** → Stores usage in SimpleUsageSubscriptions contract
4. **Frontend** → Queries blockchain and displays to users
5. **Real-time updates** → Users see live pricing adjustments

### 💡 User Experience

#### For Regular Users:
- Connect any Flow wallet (Blocto, Lilico, etc.)
- View real-time usage metrics and costs
- Adjust pricing preferences for their subscriptions
- Monitor oracle status and data freshness

#### For Admins (Contract Deployer):
- Access admin panel with red "🔧 Admin Controls" button
- Configure global markup percentages
- Set model-specific pricing multipliers
- Manage volume discounts and tier pricing

### 🌐 Live Demo URLs

- **Frontend**: http://localhost:3001
- **Contract Explorer**: https://www.flowdiver.io/account/0x6daee039a7b9c2f0
- **Recent Transaction**: https://www.flowdiver.io/tx/ac7b5d06bc3ab7b1418576b8e2273cb9f0cceae09f8b0a565b3992fc723a0afe

### 🛠 Technical Features

- **FCL Integration**: Full Flow Client Library support
- **Real Cadence Queries**: Direct blockchain data access
- **Responsive Design**: Works on mobile and desktop
- **Error Handling**: Graceful fallbacks for network issues
- **Storage Validation**: Checks user account storage capacity
- **Transaction Monitoring**: Real-time tx status with FlowDiver links

### 📊 Data Accessibility

Users can see their data through multiple interfaces:

1. **Web UI**: Complete dashboard at http://localhost:3001
2. **Cadence Scripts**: Direct blockchain queries
3. **Flow CLI**: Command-line access to usage data
4. **Block Explorer**: Public transaction history on FlowDiver

The frontend provides the most user-friendly way to view and manage usage-based subscription data with real-time oracle integration.