# 🔗 FlareFlow.link

**The premier platform for LiteLLM API key management with Flare oracle integration, Flow blockchain billing, and real-time usage analytics.**

[![Flow Blockchain](https://img.shields.io/badge/Flow-Blockchain-00D4FF)](https://onflow.org)
[![Flare Oracle](https://img.shields.io/badge/Flare-Oracle-FF6B35)](https://flare.network)
[![LiteLLM](https://img.shields.io/badge/LiteLLM-Compatible-9C27B0)](https://litellm.ai)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000)](https://nextjs.org)

## 🌟 Overview

FlareFlow.link bridges the gap between AI API usage and blockchain billing through:

- **🔥 Flare Oracle Integration**: Real-time usage data verification via StateConnector
- **⚡ Flow Blockchain Payments**: Transparent, immutable billing with smart contracts  
- **🔑 LiteLLM API Management**: OpenAI-compatible endpoint with usage tracking
- **📊 Real-time Analytics**: Hybrid display of pending and oracle-verified usage

## 🚀 Features

### For Users
- **One-Click Subscriptions**: Connect Flow wallet and create subscriptions instantly
- **Unique API Keys**: Each subscription gets its own LiteLLM API key
- **Real-time Usage**: See usage updates immediately as you make API calls
- **Oracle Verification**: All billing verified by Flare oracle every 5 minutes
- **Dynamic Pricing**: Usage-based tiers with volume discounts

### For Developers
- **OpenAI Compatible**: Drop-in replacement for OpenAI API
- **Smart Contracts**: Open-source Cadence contracts for transparency
- **Oracle Integration**: Cryptographic proof of usage data authenticity
- **Flow Actions**: Composable DeFi operations for advanced use cases

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LiteLLM API   │────│  Flare Oracle   │────│ Flow Blockchain │
│ llm.p10p.io     │    │ StateConnector  │    │ Smart Contracts │
│                 │    │ Every 5 min     │    │ Dynamic Billing │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ FlareFlow.link  │
                    │ Frontend App    │
                    └─────────────────┘
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Flow CLI ([Installation Guide](https://developers.flow.com/tools/flow-cli/install))
- Flow Port wallet ([Download](https://port.onflow.org))

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/flow-actions-scaffold.git
cd flow-actions-scaffold
```

### 2. Install Dependencies
```bash
# Install Flow dependencies
flow deps install

# Install frontend dependencies
cd frontend-integration
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
# See privatekeys/README.md for sensitive keys
```

### 4. Start Development Environment
```bash
# Start Flow emulator with contracts
make start

# In another terminal, start frontend
cd frontend-integration
npm run dev
```

### 5. Open Application
Visit `http://localhost:3000` and connect your Flow wallet to start creating subscriptions!

## 📁 Project Structure

```
flow-actions-scaffold/
├── cadence/                    # Flow blockchain contracts
│   ├── contracts/             
│   │   ├── UsageBasedSubscriptions.cdc    # Main billing contract
│   │   ├── FlareOracleVerifier.cdc        # Oracle verification
│   │   └── FlareFDCTriggers.cdc          # Flare integration
│   ├── transactions/          # Blockchain transactions
│   └── scripts/              # Query scripts
├── frontend-integration/      # Next.js web application
│   ├── components/           # React components
│   ├── services/             # API services
│   ├── hooks/               # React hooks
│   └── pages/               # Next.js pages
├── scripts/                  # Deployment scripts
├── privatekeys/             # Sensitive keys (gitignored)
└── docs/                    # Documentation
```

## 🔧 Development Commands

### Flow Blockchain
```bash
# Start emulator with full setup
make start

# Deploy contracts
make deploy

# Run tests
make test

# Send transaction
flow transactions send cadence/transactions/create_subscription.cdc --network emulator
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Security & Configuration

### Environment Variables
Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_LITELLM_URL`: LiteLLM API endpoint
- `NEXT_PUBLIC_LITELLM_ADMIN_KEY`: Admin key for LiteLLM
- `NEXT_PUBLIC_FLOW_NETWORK`: Flow network (testnet/mainnet)

### Private Keys
Sensitive keys are stored in `privatekeys/` directory:
- Never commit this directory to public repos
- Use environment variables in production
- Rotate keys regularly

## 📊 Smart Contracts

### Core Contracts
- **UsageBasedSubscriptions**: Dynamic pricing and billing logic
- **FlareOracleVerifier**: Validates Flare oracle data authenticity  
- **SimpleUsageSubscriptions**: Basic subscription management
- **FlareFDCTriggers**: Flare Data Connector integration

### Contract Addresses
- **Testnet**: `0x6daee039a7b9c2f0` ([FlowDiver](https://www.flowdiver.io/account/0x6daee039a7b9c2f0))
- **Mainnet**: Coming soon

## 🌐 Public Resources

### Blockchain Explorers
- [FlowDiver - Main Account](https://www.flowdiver.io/account/0x6daee039a7b9c2f0)
- [Flow Documentation](https://docs.onflow.org)

### Oracle Infrastructure  
- [Flare Network](https://flare.network)
- [StateConnector Docs](https://docs.flare.network/tech/state-connector/)
- [Coston2 Testnet Explorer](https://coston2-explorer.flare.network)

### API Endpoints
- [LiteLLM API](https://llm.p10p.io) - OpenAI-compatible endpoint
- [LiteLLM Documentation](https://docs.litellm.ai)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 [Documentation](https://docs.flareflow.link) (Coming soon)
- 🐛 [Report Issues](https://github.com/your-username/flow-actions-scaffold/issues)
- 💬 [Discord Community](https://discord.gg/flow) (Flow Discord)
- 📧 [Contact Us](mailto:support@flareflow.link)

## 🙏 Acknowledgments

- [Flow Blockchain](https://onflow.org) - Next-generation blockchain platform
- [Flare Network](https://flare.network) - Decentralized oracle infrastructure
- [LiteLLM](https://litellm.ai) - Universal LLM API gateway
- [OnFlow Foundation](https://github.com/onflow) - Flow CLI and tooling

---

**FlareFlow.link** - *Bridging AI APIs with blockchain billing through oracle-verified transparency*

[![Built with Flow](https://img.shields.io/badge/Built%20with-Flow-00D4FF)](https://onflow.org)
[![Powered by Flare](https://img.shields.io/badge/Powered%20by-Flare-FF6B35)](https://flare.network)