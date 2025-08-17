import "FlowToken"
import "FungibleToken"

/// Simple EVM subscription demo that works with existing infrastructure
/// Shows the concept without complex contract dependencies
transaction(
    evmAddress: String,
    fundingAmount: UFix64,
    serviceProvider: Address,
    monthlyAmount: UFix64
) {
    
    let vault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Simulate EVM funding by withdrawing from Flow vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.vault <- vaultRef.withdraw(amount: fundingAmount) as! @FlowToken.Vault
        
        log("=== EVM Subscription Funding Demo ===")
        log("EVM Address: ".concat(evmAddress))
        log("Funding Amount: ".concat(fundingAmount.toString()).concat(" FLOW"))
        log("Service Provider: ".concat(serviceProvider.toString()))
        log("Monthly Payment: ".concat(monthlyAmount.toString()).concat(" FLOW"))
    }
    
    execute {
        log("\n🌉 Step 1: Simulating EVM Bridge Deposit...")
        log("✅ User deposits ".concat(self.vault.balance.toString()).concat(" FLOW from MetaMask"))
        log("✅ LayerZero/Flow bridge detects deposit")
        log("✅ Tokens arrive on Flow blockchain")
        
        log("\n💳 Step 2: Creating Subscription Vault...")
        log("✅ Subscription vault created for EVM address: ".concat(evmAddress))
        log("✅ Vault automatically credited with bridged funds")
        log("✅ Initial balance: ".concat(self.vault.balance.toString()).concat(" FLOW"))
        
        log("\n📋 Step 3: Setting Up Subscription Plan...")
        log("✅ Monthly subscription configured")
        log("✅ Amount: ".concat(monthlyAmount.toString()).concat(" FLOW/month"))
        log("✅ Payee: ".concat(serviceProvider.toString()))
        log("✅ Service: Premium Storage Plan")
        
        log("\n💸 Step 4: Processing First Payment...")
        // Simulate first payment
        let payment <- self.vault.withdraw(amount: monthlyAmount)
        
        // Send payment to service provider
        let receiverRef = getAccount(serviceProvider)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow receiver")
        
        receiverRef.deposit(from: <-payment)
        log("✅ First payment of ".concat(monthlyAmount.toString()).concat(" FLOW sent"))
        log("✅ Remaining balance: ".concat(self.vault.balance.toString()).concat(" FLOW"))
        
        log("\n🤖 Step 5: Automation Setup...")
        log("✅ Subscription registered for automated processing")
        log("✅ Future payments will be processed automatically")
        log("✅ FDC triggers can adjust pricing based on usage")
        log("✅ Service provider gets predictable revenue stream")
        
        // Return remaining funds to sender
        let senderReceiver = getAccount(0xf8d6e0586b0a20c7)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow sender receiver")
        
        senderReceiver.deposit(from: <-self.vault)
        
        log("\n🎉 EVM Subscription Setup Complete!")
        log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        log("📱 User Experience:")
        log("   • Fund with familiar MetaMask wallet")
        log("   • Automatic bridging to Flow")
        log("   • Set-and-forget subscription payments")
        log("   • Lower costs than Ethereum gas fees")
        log("")
        log("🏢 Service Provider Benefits:")
        log("   • Predictable recurring revenue")
        log("   • Automated payment processing")
        log("   • Lower transaction costs")
        log("   • Integration with existing Flow ecosystem")
        log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    }
}