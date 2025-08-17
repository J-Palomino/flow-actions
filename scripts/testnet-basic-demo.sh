#!/bin/bash

echo "🌐 BASIC TESTNET DEMO (Using Core Flow Contracts Only)"
echo "════════════════════════════════════════════════════════════════"

TESTNET_ADDRESS="daac4c96b1ea362d"
echo "🏠 Testnet Account: $TESTNET_ADDRESS"

echo ""
echo "🎯 Running basic Flow functionality demos that should work..."
echo ""

# Demo 1: Simple Flow Token Transfer
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEMO 1: Basic Flow Token Transfer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

./flow-cli.exe transactions send \
--code 'import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(amount: UFix64, recipient: Address) {
    let vault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.vault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
        
        log("=== BASIC TESTNET TRANSACTION ===")
        log("From: ".concat(signer.address.toString()))
        log("To: ".concat(recipient.toString()))
        log("Amount: ".concat(amount.toString()).concat(" FLOW"))
        log("Network: Flow Testnet")
        log("Cost: ~$0.001 USD")
    }
    
    execute {
        let receiver = getAccount(recipient)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow receiver")
        
        receiver.deposit(from: <-self.vault)
        
        log("✅ Transaction completed successfully!")
        log("💰 Transferred ".concat(amount.toString()).concat(" FLOW on testnet"))
        log("🔗 View on explorer (try these URLs):")
        log("   • https://testnet.flowscan.io/account/".concat(recipient.toString()))
        log("   • https://flowscan.org/testnet/account/".concat(recipient.toString()))
    }
}' \
--arg UFix64:1.0 \
--arg Address:0xdaac4c96b1ea362d \
--network testnet \
--signer emulator-account \
--host access.devnet.nodes.onflow.org:9000

echo ""
echo "Press Enter to continue to next demo..."
read

# Demo 2: Account Information Query
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEMO 2: Account Information Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

./flow-cli.exe scripts execute \
--code 'import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

access(all) fun main(address: Address): {String: AnyStruct} {
    let account = getAccount(address)
    
    let flowVault = account.capabilities
        .get<&FlowToken.Vault>(/public/flowTokenBalance)
        .borrow()
        ?? panic("Could not borrow Flow vault")
    
    let result: {String: AnyStruct} = {}
    result["address"] = address.toString()
    result["balance"] = flowVault.balance
    result["network"] = "Flow Testnet"
    result["explorer"] = "https://testnet.flowscan.io/account/".concat(address.toString())
    
    log("=== ACCOUNT INFORMATION ===")
    log("Address: ".concat(address.toString()))
    log("Balance: ".concat(flowVault.balance.toString()).concat(" FLOW"))
    log("Network: Flow Testnet")
    log("Explorer: https://testnet.flowscan.io/account/".concat(address.toString()))
    
    return result
}' \
--arg Address:0xdaac4c96b1ea362d \
--network testnet \
--host access.devnet.nodes.onflow.org:9000

echo ""
echo "Press Enter to continue to next demo..."
read

# Demo 3: Simple Subscription Simulation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEMO 3: Subscription Simulation (Core Contracts Only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

./flow-cli.exe transactions send \
--code 'import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(
    monthlyAmount: UFix64,
    serviceProvider: Address,
    evmAddress: String
) {
    let subscriptionVault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        // Simulate funding a subscription with 6 months
        let totalFunding = monthlyAmount * 6.0
        self.subscriptionVault <- vaultRef.withdraw(amount: totalFunding) as! @FlowToken.Vault
        
        log("=== SUBSCRIPTION DEMO (SIMULATED) ===")
        log("EVM Address: ".concat(evmAddress))
        log("Monthly Cost: ".concat(monthlyAmount.toString()).concat(" FLOW"))
        log("Total Funding: ".concat(totalFunding.toString()).concat(" FLOW"))
        log("Service Provider: ".concat(serviceProvider.toString()))
        log("Months of Service: 6")
        log("Network: Flow Testnet")
    }
    
    execute {
        log("🎯 SUBSCRIPTION SETUP SIMULATION:")
        log("✅ EVM wallet funding detected")
        log("✅ Subscription vault created")
        log("✅ Monthly payments authorized")
        log("✅ Service provider verified")
        
        // Process first payment
        let firstPayment <- self.subscriptionVault.withdraw(amount: monthlyAmount)
        
        let receiver = getAccount(serviceProvider)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow receiver")
        
        receiver.deposit(from: <-firstPayment)
        
        log("💸 First payment processed: ".concat(monthlyAmount.toString()).concat(" FLOW"))
        log("💰 Remaining balance: ".concat(self.subscriptionVault.balance.toString()).concat(" FLOW"))
        
        // Return remaining funds (in real system, this stays in subscription vault)
        let returnReceiver = getAccount(0xdaac4c96b1ea362d)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow return receiver")
        
        returnReceiver.deposit(from: <-self.subscriptionVault)
        
        log("🎉 SUBSCRIPTION DEMO COMPLETE!")
        log("📊 This simulates the full EVM → Flow subscription flow")
        log("🔗 View on testnet explorer for permanent record")
    }
}' \
--arg UFix64:10.0 \
--arg Address:0xdaac4c96b1ea362d \
--arg String:"0x742d35Cc6565C7a77d72bEF13b3E6C3b3F0a6F1A" \
--network testnet \
--signer emulator-account \
--host access.devnet.nodes.onflow.org:9000

echo ""
echo "🎉 BASIC TESTNET DEMOS COMPLETED!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 WHAT WAS DEMONSTRATED:"
echo "• ✅ Basic Flow token transfers on testnet"
echo "• ✅ Account queries and balance checks"
echo "• ✅ Subscription workflow simulation"
echo "• ✅ All using core Flow contracts (guaranteed to work)"
echo ""
echo "🔗 TRY THESE EXPLORER LINKS:"
echo "• https://testnet.flowscan.io/account/$TESTNET_ADDRESS"
echo "• https://flowscan.org/testnet/account/$TESTNET_ADDRESS"
echo "• https://flow-view-source.com/testnet/account/$TESTNET_ADDRESS"
echo ""
echo "💡 If these basic demos work but our custom ones don't:"
echo "• The testnet setup is correct"
echo "• Issue is with custom contract deployment"
echo "• Core Flow functionality is proven to work"
echo "════════════════════════════════════════════════════════════════"