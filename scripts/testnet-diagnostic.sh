#!/bin/bash

echo "🔍 FLOW TESTNET DIAGNOSTIC"
echo "════════════════════════════════════════════════════════════════"

TESTNET_ADDRESS="daac4c96b1ea362d"
echo "🏠 Testnet Account: $TESTNET_ADDRESS"

# Test different explorer URLs
echo ""
echo "🌐 Testing Explorer URLs:"
echo "1. https://testnet.flowscan.io/account/$TESTNET_ADDRESS"
echo "2. https://flowscan.org/testnet/account/$TESTNET_ADDRESS"  
echo "3. https://flow-view-source.com/testnet/account/$TESTNET_ADDRESS"

echo ""
echo "💰 Checking account status..."
./flow-cli.exe accounts get $TESTNET_ADDRESS --network testnet --host access.devnet.nodes.onflow.org:9000

echo ""
echo "📋 Checking what contracts are actually deployed..."
./flow-cli.exe accounts get $TESTNET_ADDRESS --network testnet --host access.devnet.nodes.onflow.org:9000 --include contracts

echo ""
echo "🧪 Testing basic transaction (FlowToken transfer)..."
./flow-cli.exe transactions send \
--code 'import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(amount: UFix64) {
    let vault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.vault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
        log("Basic testnet transaction successful!")
        log("Amount: ".concat(amount.toString()).concat(" FLOW"))
    }
    
    execute {
        let receiver = getAccount(0xdaac4c96b1ea362d)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow receiver")
        
        receiver.deposit(from: <-self.vault)
        log("Transaction completed successfully on testnet!")
    }
}' \
--arg UFix64:0.1 \
--network testnet \
--signer emulator-account \
--host access.devnet.nodes.onflow.org:9000

echo ""
echo "📊 DIAGNOSTIC RESULTS:"
echo "If the basic transaction worked, the issue is with our custom contracts."
echo "If it failed, there's a fundamental testnet configuration issue."
echo ""
echo "🔗 Try these explorer links manually:"
echo "• https://testnet.flowscan.io/account/$TESTNET_ADDRESS"
echo "• https://flowscan.org/testnet/account/$TESTNET_ADDRESS"
echo "• https://flow-view-source.com/testnet/account/$TESTNET_ADDRESS"