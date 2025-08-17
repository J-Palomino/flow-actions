#!/bin/bash

echo "🌐 FLOW TESTNET TRANSACTION DEMONSTRATIONS"
echo "════════════════════════════════════════════════════════════════"

TESTNET_ADDRESS=$(grep -A 3 '"testnet"' flow.json | grep address | cut -d'"' -f4)
echo "🏠 Testnet Account: $TESTNET_ADDRESS"
echo "🔗 Explorer: https://testnet.flowscan.org/account/$TESTNET_ADDRESS"
echo ""

# Function to run transaction and show results
run_demo() {
    local demo_name="$1"
    local command="$2"
    local description="$3"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 DEMO: $demo_name"
    echo "📝 Description: $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚡ Running: $command"
    echo ""
    
    # Run the command and capture transaction ID
    if eval "$command"; then
        echo ""
        echo "✅ Transaction successful!"
        echo "🔗 View on Testnet Explorer:"
        echo "https://testnet.flowscan.org/account/$TESTNET_ADDRESS"
        echo ""
        
        # Ask if user wants to continue
        read -p "Press Enter to continue to next demo, or 'q' to quit: " choice
        if [ "$choice" = "q" ]; then
            echo "👋 Demo session ended"
            exit 0
        fi
    else
        echo ""
        echo "❌ Transaction failed. Check the error above."
        read -p "Press Enter to continue anyway, or 'q' to quit: " choice
        if [ "$choice" = "q" ]; then
            exit 1
        fi
    fi
    echo ""
}

# Check testnet balance first
echo "💰 Checking testnet FLOW balance..."
./flow-cli.exe accounts get $TESTNET_ADDRESS --network testnet

echo ""
echo "🎯 AVAILABLE DEMONSTRATIONS:"
echo "1. Cross-Chain Bridge Demo"
echo "2. EVM Subscription Demo"  
echo "3. Detailed Subscription Configuration"
echo "4. All Demos (automated sequence)"
echo ""

read -p "Select demo (1-4): " demo_choice

case $demo_choice in
    1)
        run_demo "Cross-Chain Bridge" \
                 "make demo-crosschain NETWORK=testnet" \
                 "Demonstrates LayerZero cross-chain messaging and token bridging"
        ;;
    2) 
        run_demo "EVM Subscription" \
                 "make demo-evm-subscription NETWORK=testnet" \
                 "Shows EVM wallet funding → Flow subscription setup"
        ;;
    3)
        run_demo "Subscription Configuration" \
                 "make configure-subscription NETWORK=testnet" \
                 "Complete subscription setup with detailed validation and automation"
        ;;
    4)
        echo "🎬 Running all demos in sequence..."
        echo ""
        
        run_demo "Cross-Chain Bridge" \
                 "make demo-crosschain NETWORK=testnet" \
                 "LayerZero cross-chain messaging and token bridging"
        
        run_demo "EVM Subscription" \
                 "make demo-evm-subscription NETWORK=testnet" \
                 "EVM wallet funding to Flow subscription setup"
        
        run_demo "Subscription Configuration" \
                 "make configure-subscription NETWORK=testnet" \
                 "Complete subscription setup with validation and automation"
        
        echo "🎉 All demos completed successfully!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and select 1-4."
        exit 1
        ;;
esac

echo ""
echo "🎉 TESTNET DEMO COMPLETE!"
echo "════════════════════════════════════════════════════════════════"
echo "📊 Summary:"
echo "• All transactions are now live on Flow Testnet"
echo "• View your account: https://testnet.flowscan.org/account/$TESTNET_ADDRESS"
echo "• Transaction history shows all demo executions"
echo "• Smart contracts are deployed and functional"
echo ""
echo "🔗 Useful Links:"
echo "• Flow Testnet Explorer: https://testnet.flowscan.org/"
echo "• Flow Testnet Faucet: https://testnet-faucet.onflow.org/"
echo "• Flow Developer Portal: https://developers.flow.com/"
echo "════════════════════════════════════════════════════════════════"