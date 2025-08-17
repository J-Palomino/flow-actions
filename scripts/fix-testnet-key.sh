#!/bin/bash

echo "🔧 FIXING TESTNET KEY FORMAT"
echo "════════════════════════════════════════════════════════════════"

if [ ! -f "testnet.pkey" ]; then
    echo "❌ testnet.pkey file not found"
    echo ""
    echo "Please create your testnet private key:"
    echo "1. Visit: https://testnet-faucet.onflow.org/"
    echo "2. Create account and get private key"
    echo "3. Save ONLY the hex string (no spaces/newlines) to testnet.pkey"
    echo ""
    echo "Example: echo 'your_private_key_hex_here' > testnet.pkey"
    exit 1
fi

echo "📋 Current testnet.pkey content:"
cat testnet.pkey | hexdump -C | head -3

echo ""
echo "🔧 Cleaning up key format..."

# Remove any whitespace, newlines, and non-hex characters
tr -d '[:space:]\n\r' < testnet.pkey > testnet.pkey.tmp
mv testnet.pkey.tmp testnet.pkey

echo "✅ Key format cleaned"
echo ""
echo "📋 New testnet.pkey content:"
cat testnet.pkey | hexdump -C | head -3

echo ""
echo "🧪 Testing key with Flow CLI..."
./flow-cli.exe accounts get daac4c96b1ea362d --network testnet --host access.devnet.nodes.onflow.org:9000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Testnet key is working correctly!"
    echo "🚀 You can now run: make testnet-demos-only"
else
    echo ""
    echo "❌ Key still has issues. Please check:"
    echo "1. Key is a valid 64-character hex string"
    echo "2. No extra characters or spaces"
    echo "3. Corresponds to your testnet account"
    echo ""
    echo "Get your key from: https://testnet-faucet.onflow.org/"
fi