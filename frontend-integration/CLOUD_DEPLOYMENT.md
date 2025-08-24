# Cloud Deployment Guide - Auto-Oracle System

## 🌐 Deploying to Production Cloud

Your auto-oracle system is ready for cloud deployment with these steps:

### 1. Environment Setup

#### Required Environment Variables:
```bash
# Core Oracle Configuration
LITELLM_API_KEY=sk-your-actual-litellm-key
ENCRYPT_PASSWORD=your-secure-encryption-password
LITELLM_API_URL=https://your-litellm-instance.com

# Flow Blockchain Configuration  
FLOW_NETWORK=mainnet
FLOW_CONTRACT_ADDRESS=0x6daee039a7b9c2f0
MONITOR_VAULT_IDS=424965,746865,258663

# Dedicated Oracle Service Account (GENERATED)
ORACLE_FLOW_ADDRESS=0xf9cf56505e6944dc
ORACLE_PRIVATE_KEY=1a6ddbaec7da08483050e1b55f717fe4e4fe67c0e65435029bb6a19ba4db682a
ORACLE_KEY_ID=0
```

### 2. Platform-Specific Deployment

#### **Vercel Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend-integration
vercel --prod

# Set environment variables in Vercel dashboard
# Add all variables listed above
```

#### **Railway Deployment:**
```bash
# Connect to Railway
railway login
railway init
railway add --database postgresql

# Deploy
railway up

# Set environment variables in Railway dashboard
```

#### **AWS/DigitalOcean/VPS Deployment:**
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm
sudo npm install -g pm2

# Clone repository
git clone your-repo
cd frontend-integration

# Install dependencies
npm install

# Set environment variables
export LITELLM_API_KEY=your-key
export ENCRYPT_PASSWORD=your-password
# ... all other variables

# Start application
npm run build
npm start

# PM2 will be available for oracle auto-start
```

### 3. Flow Wallet Authentication Setup

#### **Option A: Service Account (Recommended)**
```javascript
// In your cloud environment, add:
// services/flowAuth.js
import { config, authenticate } from '@onflow/fcl';

export const setupFlowAuth = () => {
  config({
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': process.env.FLOW_WALLET_DISCOVERY,
    'app.detail.title': 'LiteLLM Oracle',
    'service.OpenID.scopes': 'email',
    'fcl.accountProof.resolver': async () => ({...})
  });
};
```

#### **Option B: Private Key Signing**
```javascript
// Add to oracle service:
import { sansPrefix } from '@onflow/fcl';

const authz = async (account) => {
  const privateKey = process.env.FLOW_PRIVATE_KEY;
  const keyId = parseInt(process.env.FLOW_KEY_ID || '0');
  
  return {
    ...account,
    tempId: `${address}-${keyId}`,
    addr: sansPrefix(address),
    keyId: keyId,
    signingFunction: (signable) => {
      return {
        addr: sansPrefix(address),
        keyId: keyId,
        signature: sign(privateKey, signable.message)
      };
    }
  };
};
```

### 4. Cloud Platform Configurations

#### **Vercel (serverless):**
```json
// vercel.json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "LITELLM_API_KEY": "@litellm_api_key",
    "ENCRYPT_PASSWORD": "@encrypt_password"
  }
}
```

#### **Railway/Heroku (containers):**
```dockerfile
# Dockerfile
FROM node:18-alpine
RUN npm install -g pm2
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 5. Auto-Start Verification

Once deployed, test auto-start by:

1. **Visit Dashboard**: `https://your-domain.com/admin/payment-dashboard`
2. **Check Console**: Should see "🚀 Auto-starting oracle..."
3. **Verify Status**: Oracle status should show "🟢 Running"
4. **Monitor Processing**: Usage data should process automatically

### 6. Production Monitoring

#### **Health Checks:**
```bash
# Add to your monitoring
curl https://your-domain.com/api/admin/payment-dashboard
curl -X POST https://your-domain.com/api/admin/oracle-control -d '{"action":"status"}'
```

#### **Logging:**
```javascript
// Enhanced logging for production
console.log('Oracle Status:', oracleStatus);
console.log('Usage Processing:', usageData);
console.log('Payment Results:', paymentResults);
```

### 7. Security Considerations

- ✅ **Environment Variables**: Encrypted in cloud platform
- ✅ **API Key Storage**: Encrypted before blockchain storage  
- ✅ **Admin Password**: Change from default "admin2025"
- ✅ **HTTPS Only**: Ensure SSL certificates configured
- ✅ **Rate Limiting**: Consider API rate limits

## 🎯 Expected Cloud Behavior

Once deployed correctly:

1. **Dashboard loads** → Auto-starts oracle ✅
2. **Oracle processes** → LiteLLM usage automatically ✅  
3. **Payments flow** → FLOW tokens transferred ✅
4. **Monitoring works** → Real-time updates ✅
5. **Zero manual intervention** → Fully automated ✅

## 🚨 Common Cloud Deployment Issues

1. **"Oracle failed to start"** → Check PM2 installation and environment variables
2. **"Authentication failed"** → Verify Flow wallet configuration
3. **"API timeout"** → Increase serverless function timeout limits
4. **"Permission denied"** → Check file system permissions for log files

## 📞 Support

If you encounter issues, check:
- Environment variables are set correctly
- PM2 is installed globally
- Flow authentication is configured
- Log files for error details

Your auto-oracle system is designed to work seamlessly in the cloud! 🚀