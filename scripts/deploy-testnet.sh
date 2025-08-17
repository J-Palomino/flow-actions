#!/bin/bash

echo "🚀 DEPLOYING TO FLOW TESTNET"
echo "════════════════════════════════════════════════════════════════"

# Check if testnet account is configured
if [ ! -f "testnet.pkey" ]; then
    echo "❌ Error: testnet.pkey not found"
    echo "Please configure your testnet account first:"
    echo "1. Create account at https://testnet-faucet.onflow.org/"
    echo "2. Save private key to testnet.pkey"
    echo "3. Update flow.json with your testnet address"
    exit 1
fi

echo "📋 Current testnet configuration:"
grep -A 10 '"testnet"' flow.json

echo ""
echo "🔧 Installing dependencies..."
./flow-cli.exe deps install --network testnet

echo ""
echo "📦 Deploying contracts to testnet..."

# Try to deploy all contracts
echo "Attempting to deploy all contracts..."
./flow-cli.exe project deploy --network testnet

# If deployment fails due to existing contracts, try updating them
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Some contracts already exist. Attempting to update them..."
    
    # Update individual contracts that might have changed
    echo "Updating SubscriptionVaults..."
    ./flow-cli.exe contracts update SubscriptionVaults cadence/contracts/SubscriptionVaults.cdc --network testnet --signer testnet || true
    
    echo "Updating EVMBridgeMonitor..."
    ./flow-cli.exe contracts update EVMBridgeMonitor cadence/contracts/EVMBridgeMonitor.cdc --network testnet --signer testnet || true
    
    echo "Updating SubscriptionAutomation..."
    ./flow-cli.exe contracts update SubscriptionAutomation cadence/contracts/SubscriptionAutomation.cdc --network testnet --signer testnet || true
    
    echo "✅ Contract updates completed"
fi

# Check if contracts are now deployed
echo ""
echo "🔍 Verifying contract deployment..."
./flow-cli.exe accounts get $(grep -A 3 '"testnet"' flow.json | grep address | cut -d'"' -f4) --network testnet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "════════════════════════════════════════════════════════════════"
    echo "🔗 View your contracts on Flow Testnet:"
    echo "https://testnet.flowscan.io/account/$(grep -A 3 '\"testnet\"' flow.json | grep address | cut -d'\"' -f4)"
    echo ""
    echo "🎯 Now you can run demos on testnet:"
    echo "make demo-crosschain NETWORK=testnet"
    echo "make demo-evm-subscription NETWORK=testnet" 
    echo "make configure-subscription NETWORK=testnet"
else
    echo "❌ DEPLOYMENT FAILED"
    echo "Check the error messages above and fix any issues"
    exit 1
fi