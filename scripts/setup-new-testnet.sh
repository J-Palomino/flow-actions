#!/bin/bash

echo "🚀 FLOW TESTNET ACCOUNT SETUP"
echo "=============================="
echo ""

# Check if address is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your new testnet account address"
    echo "Usage: ./setup-new-testnet.sh <account-address>"
    echo ""
    echo "To create a new account:"
    echo "1. Visit: https://testnet-faucet.onflow.org/"
    echo "2. Use this public key:"
    echo "   90f9b035d844357a6896694931e855c9811847165dc8dddd05e5d2f30c6d5c92b4685384c38c93c38d6378a839b5193b247a5dbd160568742a080703d489ba97"
    echo ""
    exit 1
fi

NEW_ADDRESS=$1
echo "📝 Setting up testnet account: $NEW_ADDRESS"

# Backup existing flow.json
cp flow.json flow.json.backup
echo "✅ Backed up flow.json to flow.json.backup"

# Update flow.json with new testnet account
echo "📝 Updating flow.json with new account..."

# Create temporary Python script to update JSON
cat > update_flow_json.py << 'EOF'
import json
import sys

address = sys.argv[1]

with open('flow.json', 'r') as f:
    data = json.load(f)

# Update accounts section
data['accounts']['testnet-new'] = {
    "address": address,
    "key": {
        "type": "file",
        "location": "testnet-new.pkey"
    }
}

# Update contract aliases
contracts_to_update = [
    'SubscriptionVaults',
    'EVMBridgeMonitor',
    'SubscriptionAutomation',
    'LayerZeroConnectors',
    'FlareFDCTriggers'
]

for contract in contracts_to_update:
    if contract in data['contracts']:
        data['contracts'][contract]['aliases']['testnet'] = address

# Update deployments
if 'testnet' not in data['deployments']:
    data['deployments']['testnet'] = {}

data['deployments']['testnet']['testnet-new'] = [
    'SubscriptionVaults',
    'EVMBridgeMonitor',
    'SubscriptionAutomation',
    'LayerZeroConnectors',
    'FlareFDCTriggers'
]

with open('flow.json', 'w') as f:
    json.dump(data, f, indent='\t')

print(f"✅ Updated flow.json with new testnet account: {address}")
EOF

python update_flow_json.py $NEW_ADDRESS
rm update_flow_json.py

echo ""
echo "🔍 Verifying account on testnet..."
./flow-cli.exe accounts get $NEW_ADDRESS --network testnet

echo ""
echo "🚀 Ready to deploy contracts!"
echo "Run: ./flow-cli.exe project deploy --network testnet"
echo ""
echo "📋 Next steps:"
echo "1. Deploy contracts: make deploy NETWORK=testnet"
echo "2. Run demos: make testnet-demo"
echo "3. View on explorer: https://testnet.flowscan.io/account/$NEW_ADDRESS"