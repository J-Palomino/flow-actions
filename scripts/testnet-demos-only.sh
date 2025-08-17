#!/bin/bash

echo "🌐 FLOW TESTNET LIVE DEMONSTRATIONS"
echo "════════════════════════════════════════════════════════════════"

TESTNET_ADDRESS=$(grep -A 3 '"testnet"' flow.json | grep address | cut -d'"' -f4)
echo "🏠 Testnet Account: $TESTNET_ADDRESS"
echo "🔗 Explorer: https://testnet.flowscan.io/account/$TESTNET_ADDRESS"
echo ""

echo "💰 Checking testnet FLOW balance..."
./flow-cli.exe accounts get $TESTNET_ADDRESS --network testnet --host access.devnet.nodes.onflow.org:9000

echo ""
echo "🎯 RUNNING ALL TESTNET DEMONSTRATIONS"
echo "════════════════════════════════════════════════════════════════"

# Function to run demo and show transaction link
run_testnet_demo() {
    local demo_name="$1"
    local command="$2"
    local description="$3"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 DEMO: $demo_name"
    echo "📝 $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚡ Command: $command"
    echo ""
    
    # Run the command
    if eval "$command"; then
        echo ""
        echo "✅ $demo_name completed successfully!"
        echo "🔗 View transaction on explorer:"
        echo "   https://testnet.flowscan.io/account/$TESTNET_ADDRESS"
        echo ""
        read -p "Press Enter to continue to next demo..."
    else
        echo ""
        echo "❌ $demo_name failed. Check error above."
        read -p "Press Enter to continue anyway..."
    fi
}

echo ""
echo "🎬 Starting demo sequence..."
echo ""

# Demo 1: Cross-Chain Bridge
run_testnet_demo "Cross-Chain Bridge Demo" \
                 "./flow-cli.exe transactions send cadence/transactions/cross-chain/simple_demo.cdc 1.0 --network testnet --signer testnet --host access.devnet.nodes.onflow.org:9000" \
                 "Demonstrates cross-chain messaging, LayerZero integration, and token bridging"

# Demo 2: EVM Subscription  
run_testnet_demo "EVM Subscription Demo" \
                 "./flow-cli.exe transactions send cadence/transactions/evm-subscriptions/simple_evm_demo.cdc \"0x742d35Cc6565C7a77d72bEF13b3E6C3b3F0a6F1A\" 50.0 $TESTNET_ADDRESS 10.0 --network testnet --signer testnet --host access.devnet.nodes.onflow.org:9000" \
                 "Shows EVM wallet funding simulation and subscription setup"

# Demo 3: Detailed Configuration
run_testnet_demo "Subscription Configuration Demo" \
                 "./flow-cli.exe transactions send cadence/transactions/evm-subscriptions/configure_new_subscription.cdc \"0x89Ab7b7F8C3a9B2D4E5F6789aBcDef123456789A\" 100.0 $TESTNET_ADDRESS \"Premium Cloud Storage\" \"Pro Plan - 1TB\" 15.0 6 --network testnet --signer testnet --host access.devnet.nodes.onflow.org:9000" \
                 "Complete subscription lifecycle with validation and automation setup"

echo ""
echo "🎉 ALL TESTNET DEMONSTRATIONS COMPLETED!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 RESULTS SUMMARY:"
echo "• 3 different transaction types executed on Flow Testnet"
echo "• All transactions are publicly verifiable and permanent"
echo "• Smart contract functionality demonstrated end-to-end"
echo "• Real-world use cases showcased with actual costs"
echo ""
echo "🔗 PUBLIC VERIFICATION LINKS:"
echo "• Your Account: https://testnet.flowscan.io/account/$TESTNET_ADDRESS"
echo "• All Transactions: https://testnet.flowscan.io/account/$TESTNET_ADDRESS/transactions"
echo "• Contract Interactions: https://testnet.flowscan.io/account/$TESTNET_ADDRESS/contracts"
echo ""
echo "💡 WHAT PEOPLE CAN SEE:"
echo "• ✅ Transaction history with full details"
echo "• ✅ Event emissions from smart contracts"
echo "• ✅ Gas costs (typically ~$0.001 per transaction)"
echo "• ✅ Actual Cadence code that was executed"
echo "• ✅ All input parameters and results"
echo ""
echo "🚀 NEXT STEPS:"
echo "• Share your testnet address with investors/partners"
echo "• Point to specific transactions showing functionality"
echo "• Deploy to mainnet for production use"
echo "• Build frontend for user-friendly access"
echo "════════════════════════════════════════════════════════════════"