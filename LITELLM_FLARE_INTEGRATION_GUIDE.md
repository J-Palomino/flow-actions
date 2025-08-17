# 🔗 LiteLLM → Flare Oracle Integration Guide

## 🎯 Overview

This guide shows you how to connect your LiteLLM instance to Flare oracle for **real-time usage-based billing** on Flow blockchain.

## 🏗️ Architecture Flow

```
LiteLLM Instance → Monitor Script → Flare Oracle → Flow Contract → Dynamic Pricing
     ↓                ↓              ↓            ↓              ↓
   Usage Data    →  Aggregation  →  Validation  →  Update     →  Bill Users
```

## 🚀 Quick Setup (5 Minutes)

### 1. Install the Connector
```bash
cd scripts/fdc-integration
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Monitoring
```bash
npm start
```

**That's it!** Your LiteLLM usage will now automatically update Flow blockchain pricing every 5 minutes.

## 📋 What You Need

### ✅ LiteLLM Setup
- **Running LiteLLM instance** (any version)
- **API access** to usage endpoints
- **User tracking** enabled

### ✅ Flare Setup  
- **Flare testnet account** (Coston2)
- **CFLR tokens** for gas fees
- **API access** (free)

### ✅ Flow Setup
- **Contracts deployed** (`0x6daee039a7b9c2f0`) ✅ Already done!
- **User subscriptions** created via frontend

## 🔧 Configuration Options

### Basic Configuration  
```env
# Your Phala Network LiteLLM instance
LITELLM_API_URL=https://c1d44f34775bd04d0ec7a1f603cc2ff895d7d881-4000.dstack-prod7.phala.network
LITELLM_API_KEY=your_api_key

# Flare testnet (free)
FLARE_ENDPOINT=https://coston2-api.flare.network/ext/bc/C/rpc
FLARE_API_KEY=your_flare_key

# Update frequency
POLL_INTERVAL=300000  # 5 minutes
```

### User Mapping Strategy

You need to map LiteLLM users to Flow vault IDs:

#### Option 1: Simple (Recommended)
```javascript
// Use LiteLLM user_id as vault_id directly
user_id: "123" → vault_id: 123
```

#### Option 2: Database Lookup
```javascript
// Query your user database
user_id: "john@company.com" → vault_id: 456
```

#### Option 3: Hash-Based
```javascript
// Generate consistent vault_id from user_id
user_id: "john@company.com" → vault_id: hash("john@company.com") % 1000000
```

## 📊 How It Works

### 1. Usage Collection (Every 5 Minutes)
```javascript
// Connector polls LiteLLM API
GET /usage?start_date=2025-01-01&group_by=user_id,model

// Gets usage data like:
{
  "user_id": "123",
  "model": "gpt-4", 
  "total_tokens": 1500,
  "api_calls": 10
}
```

### 2. Data Aggregation
```javascript
// Groups by vault_id and calculates totals
{
  vaultId: 123,
  totalTokens: 1500,
  gpt4Tokens: 900,
  gpt35Tokens: 600,
  apiCalls: 10
}
```

### 3. Flare Submission
```javascript
// Submits to Flare Data Connector
{
  triggerType: "DefiProtocolEvent",
  payload: { vaultId: 123, usage: ... },
  signature: "cryptographic_proof"
}
```

### 4. Flow Contract Update
```cadence
// Flare oracle calls Flow contract
transaction {
  execute {
    let vault = getSubscriptionVault(123)
    vault.updateUsage(usageData)  // Updates pricing automatically
  }
}
```

### 5. Dynamic Pricing Applied
- **Tier calculation**: Based on total tokens used
- **Model pricing**: GPT-4 = 1.5x, GPT-3.5 = 0.8x
- **Volume discounts**: Up to 30% for high usage
- **Provider billing**: Exact usage amount authorized for withdrawal

## 🎯 LiteLLM Integration Points

### Standard LiteLLM Setup
```python
# In your LiteLLM config
import litellm

# Enable usage tracking
litellm.set_verbose = True
litellm.success_callback = ["langfuse"]  # or your tracker

# Set user IDs that map to vault IDs
response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}],
    user="vault_123"  # This maps to Flow vault ID 123
)
```

### Custom User Mapping
```python
# Map your users to vault IDs
def get_vault_id(user_email):
    # Look up in your database
    user = User.objects.get(email=user_email)
    return user.flow_vault_id

# Use in LiteLLM calls
response = litellm.completion(
    model="gpt-4", 
    messages=messages,
    user=str(get_vault_id("john@company.com"))
)
```

## 🔄 API Endpoints

### LiteLLM Endpoints Used
```bash
# Main usage endpoint
GET /usage?start_date=X&end_date=Y&group_by=user_id,model

# Alternative endpoint (some versions)
GET /analytics/usage?since=X&until=Y

# Health check
GET /health
```

### Flare Oracle Endpoints
```bash
# Submit usage data
POST /fdc/submit
{
  "trigger": { /* usage data */ },
  "submitter": "0x..."
}

# Check status
GET /fdc/status
```

## 🧪 Testing Your Integration

### 1. Test LiteLLM Connection
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://llm.p10p.io/usage?start_date=2025-01-01"
```

### 2. Test Connector
```bash
cd scripts/fdc-integration
npm test
```

### 3. Monitor Logs
```bash
npm start
# Watch for:
# ✅ LiteLLM connection successful
# ✅ Usage data collected  
# ✅ Flare submission successful
# ✅ Flow contract updated
```

### 4. Verify Flow Updates
Check your subscription in the frontend:
- Updated usage tokens
- New pricing tier
- Allowed withdrawal amount

## 📈 Monitoring & Debugging

### Real-time Monitoring
```bash
# Watch connector logs
tail -f logs/connector.log

# Check connector status
curl http://localhost:3000/status
```

### Debug Common Issues

#### No Usage Data
```bash
# Check LiteLLM API
curl -H "Authorization: Bearer $API_KEY" "$LITELLM_URL/usage"

# Verify time range
echo "Last processed: $(date -d @$TIMESTAMP)"
```

#### Flare Submission Failed  
```bash
# Check Flare network status
curl https://coston2-api.flare.network/ext/health

# Verify API key
echo $FLARE_API_KEY | cut -c1-10
```

#### User Mapping Issues
```bash
# Test mapping function
node -e "
const connector = require('./litellm-flare-connector');
const c = new connector({});
console.log(c.mapUserIdToVaultId('test_user'));
"
```

## 🚀 Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  flare-connector:
    build: .
    environment:
      - LITELLM_API_URL=${LITELLM_API_URL}
      - LITELLM_API_KEY=${LITELLM_API_KEY}
      - FLARE_API_KEY=${FLARE_API_KEY}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### Process Manager
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start litellm-flare-connector.js --name "flare-connector"
pm2 save
pm2 startup
```

## 🔒 Security Best Practices

### API Key Management
```bash
# Use environment variables
export LITELLM_API_KEY="sk-..."
export FLARE_API_KEY="flr-..."

# Never commit keys to git
echo "*.env" >> .gitignore
```

### Network Security
```bash
# Whitelist IPs if possible
ALLOWED_IPS="1.2.3.4,5.6.7.8"

# Use HTTPS only
LITELLM_API_URL="https://..."
FLARE_ENDPOINT="https://..."
```

### Data Validation
```javascript
// Connector validates all data before submission
function validateUsageData(usage) {
    assert(usage.totalTokens > 0);
    assert(usage.vaultId > 0);
    assert(usage.timestamp > 0);
}
```

## 💡 Advanced Features

### Custom Aggregation
```javascript
// Customize how usage is aggregated
aggregateUsageByVault(usageData) {
    // Add custom business logic
    // Apply usage caps, filters, etc.
    return aggregated;
}
```

### Multiple LiteLLM Instances
```javascript
const connectors = [
    new LiteLLMFlareConnector({ litellmApiUrl: 'https://llm1.company.com' }),
    new LiteLLMFlareConnector({ litellmApiUrl: 'https://llm2.company.com' })
];

connectors.forEach(c => c.start());
```

### Custom Pricing Logic
```javascript
// Override pricing calculation
calculateCustomPricing(usage) {
    // Implement your business rules
    return customPrice;
}
```

## 📊 Analytics & Insights

The integration provides rich analytics:

### Usage Patterns
- **Peak usage times**
- **Model preferences** (GPT-4 vs GPT-3.5)
- **User behavior** patterns
- **Cost optimization** opportunities

### Billing Insights
- **Real-time costs** per user
- **Tier progression** tracking
- **Volume discounts** applied
- **Payment predictions**

### System Health
- **API response times**
- **Data submission success** rates
- **Oracle uptime** monitoring
- **Contract performance** metrics

## 🤝 Support & Resources

### Documentation
- **Full API Reference**: See `scripts/fdc-integration/README.md`
- **Flow Actions Guide**: `FLOW_ACTIONS_GUIDE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`

### Community
- **Flow Discord**: https://discord.gg/flow
- **Flare Discord**: https://discord.gg/flarenetwork
- **GitHub Issues**: Create issues with logs

### Professional Support
- **Integration consulting** available
- **Custom deployment** assistance
- **24/7 monitoring** setup

---

## 🎉 Next Steps

1. **✅ Set up the connector** (5 minutes)
2. **✅ Test with your LiteLLM** (10 minutes)  
3. **✅ Monitor first submissions** (watch logs)
4. **✅ Verify Flow updates** (check frontend)
5. **✅ Scale to production** (Docker + PM2)

Your LiteLLM instance is now connected to Flare oracle for **real-time, usage-based billing** on Flow blockchain! 🚀