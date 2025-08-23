#!/bin/bash

# Deploy Secure LiteLLM Oracle - Production Ready
# This script sets up and starts the secure oracle with encrypted API key storage

set -e

# Load environment variables from root .env file
if [ -f "../../.env" ]; then
    echo "📋 Loading environment from ../../.env"
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

echo "🚀 Deploying Secure LiteLLM Oracle"
echo "=================================="

# Check environment variables
if [ -z "$LITELLM_API_KEY" ]; then
    echo "❌ Error: LITELLM_API_KEY environment variable required"
    echo "   Example: export LITELLM_API_KEY=sk-your-litellm-key"
    exit 1
fi

if [ -z "$ENCRYPT_PASSWORD" ]; then
    echo "❌ Error: ENCRYPT_PASSWORD environment variable required"  
    echo "   Example: export ENCRYPT_PASSWORD=your-secure-password"
    exit 1
fi

if [ -z "$LITELLM_API_URL" ]; then
    echo "❌ Error: LITELLM_API_URL environment variable required"
    echo "   Example: export LITELLM_API_URL=https://your-litellm-instance.com"
    exit 1
fi

# Set defaults
export FLOW_NETWORK=${FLOW_NETWORK:-mainnet}
export FLOW_CONTRACT_ADDRESS=${FLOW_CONTRACT_ADDRESS:-0x6daee039a7b9c2f0}
export MONITOR_VAULT_IDS=${MONITOR_VAULT_IDS:-424965,746865,258663}
export MONITOR_INTERVAL=${MONITOR_INTERVAL:-300000}

echo "📋 Configuration:"
echo "   Flow Network: $FLOW_NETWORK"
echo "   Contract: $FLOW_CONTRACT_ADDRESS"
echo "   LiteLLM API: $LITELLM_API_URL"
echo "   Monitor Vaults: $MONITOR_VAULT_IDS"
echo "   Interval: $((MONITOR_INTERVAL/1000))s"
echo ""

# Step 1: Setup encrypted API key in Flow blockchain
echo "🔐 Step 1: Setting up encrypted API key storage..."
node setup-encrypted-oracle-key.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup encrypted API key"
    exit 1
fi

echo ""
echo "✅ Encrypted API key stored in Flow blockchain"
echo ""

# Step 2: Start the production oracle
echo "🚀 Step 2: Starting secure oracle..."

# Create PM2 ecosystem config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'secure-litellm-oracle',
    script: 'secure-litellm-oracle-production.js',
    env: {
      NODE_ENV: 'production',
      ORACLE_DECRYPT_KEY: '$ENCRYPT_PASSWORD',
      LITELLM_API_URL: '$LITELLM_API_URL',
      FLOW_NETWORK: '$FLOW_NETWORK',
      FLOW_CONTRACT_ADDRESS: '$FLOW_CONTRACT_ADDRESS',
      MONITOR_VAULT_IDS: '$MONITOR_VAULT_IDS',
      MONITOR_INTERVAL: '$MONITOR_INTERVAL'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/oracle-error.log',
    out_file: './logs/oracle-out.log',
    log_file: './logs/oracle-combined.log',
    time: true
  }]
};
EOF

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Start with PM2
echo "🔄 Starting oracle with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
echo ""
echo "✅ Oracle deployed successfully!"
echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "🎯 What's Running:"
echo "   ✅ Encrypted API key stored in Flow blockchain"
echo "   ✅ Oracle service running with PM2"
echo "   ✅ Monitoring vaults: $MONITOR_VAULT_IDS"
echo "   ✅ Automatic FLOW payments every $((MONITOR_INTERVAL/1000))s"
echo ""
echo "📋 Management Commands:"
echo "   View logs:    pm2 logs secure-litellm-oracle"
echo "   Monitor:      pm2 monit"
echo "   Restart:      pm2 restart secure-litellm-oracle"
echo "   Stop:         pm2 stop secure-litellm-oracle"
echo "   Delete:       pm2 delete secure-litellm-oracle"
echo ""
echo "🔒 Security Features Active:"
echo "   ✅ API key encrypted with AES-256-CBC"
echo "   ✅ No plaintext keys on blockchain"
echo "   ✅ Decryption only off-chain"
echo "   ✅ Only usage results submitted to Flow"
echo ""
echo "🎉 Secure Oracle is now running and processing automatic payments!"

# Optional: Setup startup script
if command -v systemctl &> /dev/null; then
    echo ""
    read -p "🤖 Setup automatic startup on boot? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 startup
        echo "✅ Automatic startup configured"
    fi
fi