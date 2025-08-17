# LiteLLM → Flare Oracle Integration

Connect your LiteLLM instance to Flare oracle for real-time usage-based billing on Flow blockchain.

## 🎯 Overview

This integration monitors LiteLLM API usage and automatically submits usage data to Flare Data Connector (FDC), which then triggers dynamic pricing updates on your Flow blockchain contracts.

## 🏗️ Architecture

```
LiteLLM API → Connector → Flare Oracle → Flow Contract → Dynamic Pricing
```

1. **LiteLLM API**: Tracks token usage, API calls, and model usage
2. **Connector**: Polls LiteLLM, aggregates data, submits to Flare
3. **Flare Oracle**: Validates data and triggers Flow contract updates
4. **Flow Contract**: Updates pricing based on usage patterns
5. **Dynamic Pricing**: Users pay exactly what they use

## 🚀 Quick Start

### 1. Setup
```bash
cd scripts/fdc-integration
chmod +x setup-flare-integration.sh
./setup-flare-integration.sh
```

### 2. Configure
Edit `.env` file:
```env
LITELLM_API_URL=https://your-litellm-instance.com
LITELLM_API_KEY=your_api_key_here
FLARE_API_KEY=your_flare_api_key
FLARE_SUBMITTER_ADDRESS=0x...
```

### 3. Run
```bash
npm start
```

## 📋 Prerequisites

### LiteLLM Requirements
- ✅ LiteLLM instance running with API access
- ✅ API key with usage analytics permissions
- ✅ Usage tracking enabled
- ✅ User mapping to vault IDs

### Flare Requirements
- ✅ Flare testnet (Coston2) account
- ✅ CFLR tokens for gas fees
- ✅ Data submitter role (if using managed FDC)
- ✅ API access to Flare network

### Flow Requirements
- ✅ Flow mainnet contracts deployed (`0x6daee039a7b9c2f0`)
- ✅ FlareFDCTriggers contract active
- ✅ Subscription vaults created by users

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LITELLM_API_URL` | Your LiteLLM instance URL | `https://llm.p10p.io` |
| `LITELLM_API_KEY` | API key for LiteLLM | `sk-...` |
| `FLARE_ENDPOINT` | Flare network RPC endpoint | `https://coston2-api.flare.network/ext/bc/C/rpc` |
| `FLARE_API_KEY` | Flare API key | `flr_...` |
| `FLARE_SUBMITTER_ADDRESS` | Your Flare submitter address | `0x123...` |
| `FLARE_SUBMITTER_PRIVATE_KEY` | Private key for signing | `0xabc...` |
| `FLOW_CONTRACT_ADDRESS` | Flow contract address | `0x6daee039a7b9c2f0` |
| `POLL_INTERVAL` | Update frequency (ms) | `300000` (5 min) |

### User Mapping

You need to map LiteLLM user IDs to Flow vault IDs. Options:

#### Option 1: Direct Mapping
```javascript
// user_id = vault_id (simplest)
mapUserIdToVaultId(userId) {
    return parseInt(userId);
}
```

#### Option 2: Database Lookup
```javascript
// Query your database
mapUserIdToVaultId(userId) {
    return await db.query('SELECT vault_id FROM users WHERE litellm_id = ?', [userId]);
}
```

#### Option 3: Hash-Based
```javascript
// Generate consistent vault ID from user ID
mapUserIdToVaultId(userId) {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    return parseInt(hash.substring(0, 8), 16) % 1000000;
}
```

## 📊 Data Flow

### 1. LiteLLM Usage Collection
The connector polls LiteLLM's usage API:
```javascript
GET /usage?start_date=2025-01-01&end_date=2025-01-02&group_by=user_id,model
```

Response example:
```json
[
  {
    "user_id": "123",
    "model": "gpt-4",
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225,
    "timestamp": "2025-01-01T12:00:00Z"
  }
]
```

### 2. Data Aggregation
Usage is aggregated by vault ID:
```javascript
{
  vaultId: 123,
  totalTokens: 1500,
  apiCalls: 10,
  gpt4Tokens: 900,
  gpt35Tokens: 600,
  timestamp: 1640995200000
}
```

### 3. Flare Submission
Data is formatted as FDC trigger:
```javascript
{
  id: "usage-123-1640995200000",
  triggerType: 5, // DefiProtocolEvent
  sourceChain: "litellm",
  targetChain: 0,
  payload: {
    vaultId: 123,
    totalTokens: 1500,
    // ... usage data
  },
  signature: "0x..."
}
```

### 4. Flow Contract Update
Flare oracle calls Flow contract:
```cadence
transaction {
    execute {
        FlareFDCTriggers.submitFDCTrigger(trigger)
        // Updates subscription vault pricing
    }
}
```

## 🔄 API Endpoints

### LiteLLM Endpoints Used
- `GET /usage` - Main usage data endpoint
- `GET /analytics/usage` - Alternative endpoint
- `GET /health` - Health check

### Flare Endpoints Used
- `POST /fdc/submit` - Submit data to FDC
- `GET /fdc/status` - Check FDC status

## 🧪 Testing

### Test Connection
```bash
npm test
```

### Manual Test
```bash
node -e "
const connector = require('./litellm-flare-connector');
const c = new connector({ litellmApiUrl: 'https://llm.p10p.io' });
console.log(c.getStatus());
"
```

### Mock Data Test
```bash
# Create test-data.json with mock usage
node test-with-mock-data.js
```

## 📈 Monitoring

### Logs
The connector logs all activities:
```
📊 Collecting LiteLLM usage data...
📈 Processing 5 usage records
📤 Submitting usage for vault 123: 1500 tokens
✅ Usage submitted for vault 123
```

### Status Endpoint
Check connector status:
```javascript
const status = connector.getStatus();
console.log(status);
// {
//   isRunning: true,
//   lastProcessedTimestamp: 1640995200000,
//   cacheSize: 10
// }
```

### Health Checks
Monitor key metrics:
- ✅ LiteLLM API connectivity
- ✅ Flare network status
- ✅ Flow contract availability
- ✅ Data submission success rate

## 🔒 Security

### API Keys
- Store all keys in environment variables
- Use `.env` file for local development
- Never commit keys to version control

### Signing
- All submissions are cryptographically signed
- Flare oracle verifies signatures
- Prevents data tampering

### Rate Limiting
- Respects LiteLLM API rate limits
- Implements exponential backoff
- Batches submissions efficiently

## 🚨 Troubleshooting

### Common Issues

#### LiteLLM Connection Failed
```
❌ LiteLLM API error: 401 Unauthorized
```
**Solution**: Check `LITELLM_API_KEY` in `.env`

#### Flare Submission Failed
```
❌ FDC endpoint not available
```
**Solution**: Verify `FLARE_ENDPOINT` and `FLARE_API_KEY`

#### No Usage Data
```
ℹ️  No new usage data to process
```
**Solution**: Check LiteLLM has recent activity, verify time range

#### Vault Mapping Failed
```
⚠️  Could not map user_id abc123 to vault ID
```
**Solution**: Implement proper user → vault mapping

### Debug Mode
```bash
DEBUG=1 npm start
```

### Log Analysis
```bash
tail -f logs/connector.log | grep ERROR
```

## 🔄 Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

### Process Manager
```bash
npm install -g pm2
pm2 start litellm-flare-connector.js --name "flare-connector"
pm2 save
pm2 startup
```

### Health Monitoring
```bash
# Monitor with pm2
pm2 monit

# Custom health check
curl http://localhost:3000/health
```

## 📝 Configuration Examples

### Development
```env
LITELLM_API_URL=http://localhost:4000
POLL_INTERVAL=30000
LOG_LEVEL=debug
```

### Production
```env
LITELLM_API_URL=https://llm.yourcompany.com
POLL_INTERVAL=300000
LOG_LEVEL=info
LOG_FILE=/var/log/flare-connector.log
```

### High Volume
```env
POLL_INTERVAL=60000
BATCH_SIZE=100
PARALLEL_SUBMISSIONS=5
```

## 🤝 Support

- **Flow Discord**: https://discord.gg/flow
- **Flare Discord**: https://discord.gg/flarenetwork
- **Documentation**: See `INTEGRATION_GUIDE.md`
- **Issues**: Create GitHub issue with logs

## 📚 Additional Resources

- [Flare Data Connector Documentation](https://docs.flare.network/dev/getting-started/setup/how-to-access-flare-network-with-a-wallet/)
- [Flow Blockchain Documentation](https://docs.onflow.org)
- [LiteLLM API Documentation](https://docs.litellm.ai)
- [Flow Actions Framework](https://github.com/flow-actions)