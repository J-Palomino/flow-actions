# 🔥 Flare Network Setup Guide

## Getting Your Flare Environment Variables

### 🎯 What You Need
- `FLARE_API_KEY`: API access to Flare network
- `FLARE_SUBMITTER_ADDRESS`: Your Flare wallet address  
- `FLARE_SUBMITTER_PRIVATE_KEY`: Your wallet private key

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: Use Flare Testnet (Coston2) - **Recommended for Testing**

#### Step 1: Create Flare Wallet
```bash
# Generate a new Flare wallet
node -e "
const crypto = require('crypto');
const secp256k1 = require('secp256k1');

// Generate private key
const privateKey = crypto.randomBytes(32);
const publicKey = secp256k1.publicKeyCreate(privateKey);

// Create address (simplified)
const address = '0x' + crypto.createHash('keccak256')
  .update(publicKey.slice(1))
  .digest('hex')
  .slice(-40);

console.log('Private Key:', '0x' + privateKey.toString('hex'));
console.log('Address:', address);
"
```

**OR use MetaMask:**
1. Install MetaMask browser extension
2. Create new wallet or import existing
3. Add Flare Testnet network
4. Copy address and private key

#### Step 2: Add Flare Testnet Network to MetaMask
```
Network Name: Flare Testnet Coston2
RPC URL: https://coston2-api.flare.network/ext/bc/C/rpc  
Chain ID: 114
Currency Symbol: C2FLR
Block Explorer: https://coston2-explorer.flare.network
```

#### Step 3: Get Test Tokens (Free)
```bash
# Visit Flare faucet
https://faucet.flare.network/coston2

# Or use curl
curl -X POST https://faucet.flare.network/api/coston2/request \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_ADDRESS_HERE"}'
```

#### Step 4: Get API Key (Free)
For Flare testnet, you can use the public RPC without authentication:
```env
FLARE_API_KEY=public  # No key needed for testnet
FLARE_ENDPOINT=https://coston2-api.flare.network/ext/bc/C/rpc
```

---

### Option 2: Use Flare Mainnet - **For Production**

#### Step 1: Create Flare Mainnet Wallet
Same as testnet, but add Flare mainnet to MetaMask:
```
Network Name: Flare Mainnet
RPC URL: https://flare-api.flare.network/ext/bc/C/rpc
Chain ID: 14
Currency Symbol: FLR  
Block Explorer: https://flare-explorer.flare.network
```

#### Step 2: Get FLR Tokens
Buy FLR tokens on exchanges:
- **Bitrue**: https://www.bitrue.com
- **Huobi**: https://www.huobi.com
- **MEXC**: https://www.mexc.com
- **Pancakeswap**: Via BSC bridge

#### Step 3: Get API Key
For production, consider premium RPC providers:
- **Ankr**: https://ankr.com (has Flare support)
- **Infura**: Check if Flare support available
- **Alchemy**: Check if Flare support available

---

## 🔧 Environment Configuration

### For Testing (Coston2 Testnet)
```env
# Flare Testnet Configuration
FLARE_ENDPOINT=https://coston2-api.flare.network/ext/bc/C/rpc
FLARE_API_KEY=public
FLARE_SUBMITTER_ADDRESS=0x1234567890123456789012345678901234567890
FLARE_SUBMITTER_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

### For Production (Mainnet)
```env
# Flare Mainnet Configuration  
FLARE_ENDPOINT=https://flare-api.flare.network/ext/bc/C/rpc
FLARE_API_KEY=your_premium_api_key_here
FLARE_SUBMITTER_ADDRESS=0x1234567890123456789012345678901234567890
FLARE_SUBMITTER_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

## 🧪 Quick Test

### Test Your Flare Setup
```bash
cd scripts/fdc-integration
node -e "
const axios = require('axios');

async function testFlare() {
  const endpoint = 'https://coston2-api.flare.network/ext/bc/C/rpc';
  
  try {
    const response = await axios.post(endpoint, {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    });
    
    console.log('✅ Flare connection successful!');
    console.log('📊 Latest block:', parseInt(response.data.result, 16));
  } catch (error) {
    console.log('❌ Flare connection failed:', error.message);
  }
}

testFlare();
"
```

### Test with Your Wallet
```bash
node -e "
const axios = require('axios');

async function testWallet() {
  const endpoint = 'https://coston2-api.flare.network/ext/bc/C/rpc';
  const address = process.env.FLARE_SUBMITTER_ADDRESS;
  
  if (!address) {
    console.log('⚠️  Set FLARE_SUBMITTER_ADDRESS first');
    return;
  }
  
  try {
    const response = await axios.post(endpoint, {
      jsonrpc: '2.0', 
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    });
    
    const balance = parseInt(response.data.result, 16) / 1e18;
    console.log(\`✅ Wallet balance: \${balance} C2FLR\`);
    
    if (balance < 0.1) {
      console.log('⚠️  Low balance. Get test tokens from faucet.');
    }
  } catch (error) {
    console.log('❌ Wallet check failed:', error.message);
  }
}

testWallet();
"
```

---

## 🔐 Security Best Practices

### Private Key Security
```bash
# ✅ DO: Use environment variables
export FLARE_SUBMITTER_PRIVATE_KEY="0x..."

# ✅ DO: Use .env file (not committed to git)
echo "FLARE_SUBMITTER_PRIVATE_KEY=0x..." >> .env

# ❌ DON'T: Hard-code in scripts
const privateKey = "0x123..."; // NEVER DO THIS
```

### Test Account Separation
```bash
# Use different accounts for test vs production
FLARE_TESTNET_ADDRESS=0x1111...  # For Coston2 testing
FLARE_MAINNET_ADDRESS=0x2222...  # For mainnet production
```

### Minimal Balance Strategy
```bash
# Keep minimal balance in hot wallet
# Only what's needed for oracle submissions (~0.1 FLR)
# Store majority in cold wallet
```

---

## 🚨 Troubleshooting

### Common Issues

#### "Connection Failed"
```bash
# Check if endpoint is reachable
curl -X POST https://coston2-api.flare.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### "Invalid Address Format"
```bash
# Flare addresses should start with 0x and be 42 characters
echo $FLARE_SUBMITTER_ADDRESS | grep -E "^0x[a-fA-F0-9]{40}$"
```

#### "Insufficient Balance"
```bash
# Check balance
curl -X POST https://coston2-api.flare.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$FLARE_SUBMITTER_ADDRESS\",\"latest\"],\"id\":1}"
```

#### "Invalid Private Key"
```bash
# Private key should be 64 hex characters (32 bytes)
echo $FLARE_SUBMITTER_PRIVATE_KEY | grep -E "^0x[a-fA-F0-9]{64}$"
```

---

## 📋 Complete .env Template

```env
# LiteLLM Configuration
LITELLM_API_URL=https://c1d44f34775bd04d0ec7a1f603cc2ff895d7d881-4000.dstack-prod7.phala.network
LITELLM_API_KEY=sk-your_litellm_api_key_here

# Flare Network Configuration (Testnet)
FLARE_ENDPOINT=https://coston2-api.flare.network/ext/bc/C/rpc
FLARE_API_KEY=public
FLARE_SUBMITTER_ADDRESS=0x1234567890123456789012345678901234567890
FLARE_SUBMITTER_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Flow Configuration
FLOW_CONTRACT_ADDRESS=0x6daee039a7b9c2f0
FLOW_NETWORK=mainnet

# Monitoring
POLL_INTERVAL=300000
BATCH_SIZE=10
LOG_LEVEL=info
```

---

## 🎯 Next Steps

1. **✅ Create Flare wallet** (MetaMask or CLI)
2. **✅ Get test tokens** from faucet  
3. **✅ Configure .env** with your details
4. **✅ Test connection** with provided scripts
5. **✅ Start the connector**: `npm start`

Your Flare oracle integration will be ready to receive LiteLLM usage data! 🚀

---

## 🔗 Useful Links

- **Flare Faucet**: https://faucet.flare.network/coston2
- **Flare Explorer**: https://coston2-explorer.flare.network  
- **Flare Docs**: https://docs.flare.network
- **MetaMask**: https://metamask.io
- **Flare Discord**: https://discord.gg/flarenetwork