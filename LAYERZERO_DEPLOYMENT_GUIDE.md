# LayerZero Bridge Deployment Guide

This guide walks through deploying the complete LayerZero cross-chain bridge infrastructure for FlareFlow.link.

## 🚀 Phase 1: Environment Setup

### 1. Install Dependencies
```bash
cd frontend-integration
npm install @layerzerolabs/lz-sdk @layerzerolabs/solidity-examples ethers@^5.7.2
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:

```bash
# LayerZero Configuration
LAYERZERO_API_KEY=your_layerzero_api_key
LAYERZERO_SCAN_API_KEY=your_scan_api_key

# RPC Endpoints
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# Bridge Wallet (Keep SECURE!)
BRIDGE_PRIVATE_KEY=your_bridge_wallet_private_key
BRIDGE_WALLET_ADDRESS=your_bridge_wallet_public_address

# Flow Configuration
FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org
FLOW_PRIVATE_KEY=your_flow_admin_private_key
FLOW_ADDRESS=0x6daee039a7b9c2f0

# Security Settings
BRIDGE_MAX_AMOUNT=1000
BRIDGE_DAILY_LIMIT=10000
BRIDGE_ENABLED=true
BRIDGE_ALERT_THRESHOLD=500
```

## 🏗️ Phase 2: Smart Contract Deployment

### 1. Deploy EVM Bridge Contracts

#### Setup Hardhat Project
```bash
mkdir layerzero-bridge-contracts
cd layerzero-bridge-contracts
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install @layerzerolabs/solidity-examples @openzeppelin/contracts
npx hardhat init
```

#### Deploy to Each Chain
```bash
# Ethereum
npx hardhat run scripts/deploy.js --network ethereum

# Polygon  
npx hardhat run scripts/deploy.js --network polygon

# Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum

# Base
npx hardhat run scripts/deploy.js --network base
```

#### Update Environment Variables
```bash
ETHEREUM_BRIDGE_CONTRACT=0x...
POLYGON_BRIDGE_CONTRACT=0x...
ARBITRUM_BRIDGE_CONTRACT=0x...  
BASE_BRIDGE_CONTRACT=0x...
```

### 2. Deploy Flow LayerZero Receiver

#### Deploy Cadence Contract
```bash
flow project deploy --network mainnet
```

#### Update Flow Configuration
```bash
FLOW_BRIDGE_CONTRACT=0x6daee039a7b9c2f0
NEXT_PUBLIC_FLOW_LZ_ENDPOINT=0x6daee039a7b9c2f0
```

## ⚙️ Phase 3: Contract Configuration

### 1. Configure Bridge Contracts
```javascript
// Run configuration script
node scripts/configure-bridges.js
```

This will:
- Whitelist supported tokens (ETH, USDC, USDT, MATIC)
- Set bridge limits (min: 1, max: 1000, daily: 10k tokens)
- Configure trusted remote paths between chains
- Set LayerZero gas settings

### 2. Configure Flow Receiver
```cadence
// Set LayerZero endpoint
transaction {
    prepare(admin: AuthAccount) {
        LayerZeroReceiver.setLayerZeroEndpoint(0x6daee039a7b9c2f0)
        LayerZeroReceiver.setActive(true)
    }
}
```

## 🧪 Phase 4: Testing

### 1. Testnet Testing
Before mainnet deployment, test on testnets:

```bash
# Test on Goerli → Flow Testnet
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/YOUR_KEY
ETHEREUM_BRIDGE_CONTRACT=0x_testnet_address
```

### 2. Integration Tests
```bash
# Test bridge functionality
npm run test:bridge

# Test quote API
curl -X POST localhost:3000/api/layerzero/quote \
  -H "Content-Type: application/json" \
  -d '{"fromChain":"ethereum","toChain":"flow","amount":"1.0"}'
```

### 3. Security Audits
- [ ] Smart contract audit by reputable firm
- [ ] Penetration testing of API endpoints  
- [ ] Bridge limit testing
- [ ] Emergency procedures testing

## 🚀 Phase 5: Production Deployment

### 1. Mainnet Deployment Checklist
- [ ] All contracts deployed and verified
- [ ] Bridge limits configured conservatively
- [ ] Emergency pause mechanisms tested
- [ ] Monitoring and alerts configured
- [ ] Team trained on emergency procedures

### 2. Go-Live Procedure
```bash
# 1. Enable bridge with low limits
BRIDGE_MAX_AMOUNT=10
BRIDGE_DAILY_LIMIT=100

# 2. Monitor first 24 hours
# 3. Gradually increase limits
# 4. Full production limits after 1 week
```

### 3. Monitoring Setup
- Discord/Slack alerts for large transactions
- LayerZero scan monitoring
- Balance monitoring on all chains
- Error rate monitoring

## 📊 Phase 6: Operations

### 1. Daily Operations
- Check bridge balances across all chains
- Monitor transaction volume and success rates
- Review security alerts
- Update token conversion rates

### 2. Emergency Procedures
```javascript
// Pause all bridges
await bridgeContract.pause();

// Emergency withdraw
await bridgeContract.emergencyWithdraw(tokenAddress, amount, safeAddress);
```

### 3. Maintenance
- Regular contract upgrades (if proxy pattern used)
- Token list updates
- Rate adjustments based on market conditions

## 🔐 Security Considerations

### 1. Private Key Management
- Use hardware wallets or HSMs for production keys
- Implement multi-sig for admin functions
- Regular key rotation

### 2. Smart Contract Security
- Time delays on admin functions
- Rate limiting and daily caps
- Emergency pause mechanisms
- Formal verification where possible

### 3. Infrastructure Security
- API rate limiting
- DDoS protection
- Secure hosting (AWS/GCP with proper IAM)
- Regular security updates

## 📈 Scaling Considerations

### 1. Supported Chains
- Add Optimism, Avalanche, BSC as needed
- Implement token whitelisting per chain
- Dynamic fee adjustment

### 2. Performance
- Redis caching for quotes
- Database for transaction history
- Load balancing for API endpoints

### 3. Features
- Batch bridging
- Cross-chain swaps
- Automated arbitrage

## 📋 Production Checklist

### Pre-Launch
- [ ] All contracts deployed and verified
- [ ] Security audit completed
- [ ] Testnet testing passed
- [ ] Monitoring configured
- [ ] Team training completed

### Launch Day
- [ ] Enable bridge with conservative limits
- [ ] Monitor all systems
- [ ] Have emergency contacts ready
- [ ] Document any issues

### Post-Launch
- [ ] Daily monitoring for first week
- [ ] Gradually increase limits
- [ ] Collect user feedback
- [ ] Plan feature enhancements

## 🆘 Emergency Contacts

- **Security Issues**: security@flareflow.link
- **LayerZero Support**: support@layerzero.network
- **Infrastructure**: ops@flareflow.link

---

## 📚 Additional Resources

- [LayerZero Documentation](https://layerzero.gitbook.io/)
- [Bridge Contract Source](./contracts/LayerZeroBridge.sol)
- [Flow Receiver Source](../cadence/contracts/LayerZeroReceiver.cdc)
- [API Documentation](./docs/API.md)