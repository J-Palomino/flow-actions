# Continuous Usage Data Collection Setup

## Option 1: Webhooks (Recommended) ⚡

**Real-time, event-driven, most efficient**

### Setup Steps:

1. **Start Webhook Receiver:**
   ```bash
   cd scripts/fdc-integration
   node litellm-webhook-receiver.js
   ```

2. **Configure LiteLLM Webhooks:**
   In your LiteLLM configuration:
   ```yaml
   # config.yaml
   general_settings:
     webhook:
       url: "http://your-server:3001/webhook/usage"
       secret: "your_webhook_secret"
       events: ["request_completed", "usage_updated"]
   ```

3. **Set Environment Variables:**
   ```env
   WEBHOOK_PORT=3001
   LITELLM_WEBHOOK_SECRET=your_webhook_secret
   FLOW_CONTRACT_ADDRESS=0x6daee039a7b9c2f0
   ```

### Webhook Payload Example:
```json
{
  "vault_id": "424965",
  "total_tokens": 1500,
  "api_calls": 5,
  "cost_estimate": 0.03,
  "models": {
    "gpt-4": 900,
    "gpt-3.5-turbo": 600
  },
  "timestamp": "2025-08-23T09:00:00Z"
}
```

**✅ Triggers automatic FLOW payment immediately after API usage**

---

## Option 2: Polling Monitor 🔄

**Continuous polling, reliable fallback**

### Setup Steps:

1. **Start Polling Monitor:**
   ```bash
   cd scripts/fdc-integration  
   node litellm-polling-monitor.js
   ```

2. **Configure Environment:**
   ```env
   LITELLM_API_URL=https://your-litellm-instance.com
   LITELLM_API_KEY=sk-your-api-key
   POLL_INTERVAL=300000  # 5 minutes
   BATCH_SIZE=10
   ```

**✅ Checks for new usage every 5 minutes and processes automatically**

---

## LiteLLM Webhook Configuration

### Method 1: Environment Variables
```bash
export LITELLM_WEBHOOK_URL="http://your-server:3001/webhook/usage"
export LITELLM_WEBHOOK_SECRET="your_webhook_secret"
```

### Method 2: Config File
```yaml
# litellm_config.yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: your-openai-key

general_settings:
  webhook:
    url: "http://your-server:3001/webhook/usage"
    secret: "your_webhook_secret" 
    events: ["request_completed"]
    
  # Optional: Database logging
  database_url: "postgresql://user:pass@localhost/litellm"
```

### Method 3: Programmatic Setup
```python
# litellm_server.py
import litellm
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "gpt-4", "litellm_params": {"model": "gpt-4"}}
    ]
)

# Configure webhook
litellm.webhook_url = "http://your-server:3001/webhook/usage"
litellm.webhook_secret = "your_webhook_secret"
```

---

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start webhook receiver  
pm2 start litellm-webhook-receiver.js --name "webhook-receiver"

# Start polling monitor (backup)
pm2 start litellm-polling-monitor.js --name "polling-monitor"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "litellm-webhook-receiver.js"]
```

### Using systemd
```ini
# /etc/systemd/system/litellm-webhook.service
[Unit]
Description=LiteLLM Webhook Receiver
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/path/to/scripts/fdc-integration
ExecStart=/usr/bin/node litellm-webhook-receiver.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Flow Integration Requirements

### 1. Flow Account Setup
You need a Flow account with:
- FLOW tokens for transaction fees
- Deployed contracts access
- Transaction authorization

### 2. FCL Configuration
```javascript
// In your webhook/polling scripts
fcl.config()
  .put('accessNode.api', 'https://rest-mainnet.onflow.org')
  .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn') 
  .put('flow.network', 'mainnet')
  .put('app.detail.title', 'LiteLLM Usage Monitor');
```

---

## Complete Automatic Flow

```mermaid
graph TD
    A[User Makes API Call] --> B[LiteLLM Processes Request]
    B --> C{Webhook or Poll?}
    C -->|Webhook| D[Instant Webhook to Receiver]
    C -->|Poll| E[Monitor Polls Every 5min]
    D --> F[Extract Usage Data]
    E --> F
    F --> G[Submit Flow Transaction]
    G --> H[updateUsageData Contract Call]
    H --> I[calculateDynamicPrice]
    I --> J[processAutomaticPayment]
    J --> K[Transfer FLOW to Provider]
    K --> L[Emit Payment Event]
```

**✅ Complete automation: API usage → Automatic FLOW payment in real-time**

---

## Testing

### Test Webhook
```bash
curl -X POST http://localhost:3001/webhook/usage \
  -H "Content-Type: application/json" \
  -d '{
    "vault_id": "424965",
    "total_tokens": 100,
    "api_calls": 1,
    "cost_estimate": 0.002
  }'
```

### Test Polling  
```bash
# Check monitor status
curl http://localhost:3001/health

# View logs
pm2 logs polling-monitor
```

**🚀 This completes the final 10% - full continuous automation!**