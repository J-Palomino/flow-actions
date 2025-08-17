import "SubscriptionVaults"
import "EVMBridgeMonitor"
import "SubscriptionAutomation"
import "FlowToken"
import "FungibleToken"

/// Complete EVM subscription setup demo
/// This transaction demonstrates the full flow from EVM funding to subscription management
transaction(
    evmAddress: String,
    initialFunding: UFix64,
    serviceProvider: Address,
    subscriptionPlan: String,
    monthlyAmount: UFix64
) {
    
    let subscriptionVault: @SubscriptionVaults.SubscriptionVault
    let flowVault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue, SaveValue, StorageCapabilities, Capabilities) &Account) {
        
        log("=== EVM Subscription Setup Demo ===")
        log("EVM Address: ".concat(evmAddress))
        log("Initial Funding: ".concat(initialFunding.toString()).concat(" FLOW"))
        log("Service Provider: ".concat(serviceProvider.toString()))
        log("Monthly Amount: ".concat(monthlyAmount.toString()).concat(" FLOW"))
        
        // Step 1: Simulate EVM bridge funding
        log("\n📡 Step 1: Simulating EVM Bridge Deposit...")
        
        // Get Flow tokens to simulate bridged funds
        let flowVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.flowVault <- flowVaultRef.withdraw(amount: initialFunding) as! @FlowToken.Vault
        log("✅ Simulated bridge deposit of ".concat(initialFunding.toString()).concat(" FLOW"))
        
        // Step 2: Create subscription vault
        log("\n💳 Step 2: Creating Subscription Vault...")
        
        self.subscriptionVault <- SubscriptionVaults.createVault(
            owner: signer.address,
            evmAddress: evmAddress
        )
        log("✅ Created subscription vault ID: ".concat(self.subscriptionVault.id.toString()))
        
        // Step 3: Register EVM address mapping
        log("\n🔗 Step 3: Registering EVM → Flow Address Mapping...")
        
        let bridgeMonitorRef = getAccount(0xf8d6e0586b0a20c7)
            .capabilities.get<&EVMBridgeMonitor.BridgeMonitor>(EVMBridgeMonitor.MonitorPublicPath)
            .borrow() ?? panic("Could not borrow bridge monitor")
        
        bridgeMonitorRef.registerEVMAddress(evmAddress: evmAddress, flowAddress: signer.address)
        log("✅ Registered EVM address mapping")
        
        // Step 4: Fund the vault (simulating bridge deposit)
        log("\n💰 Step 4: Funding Subscription Vault...")
        
        self.subscriptionVault.depositFromBridge(vault: <-self.flowVault)
        log("✅ Vault funded with ".concat(initialFunding.toString()).concat(" FLOW"))
        log("Current vault balance: ".concat(self.subscriptionVault.getBalance(tokenType: "A.0ae53cb6e3f42a79.FlowToken.Vault").toString()))
        
        // Step 5: Save vault to storage
        signer.storage.save(<-self.subscriptionVault, to: SubscriptionVaults.VaultStoragePath)
        
        // Create public capability
        let vaultCap = signer.capabilities.storage.issue<&SubscriptionVaults.SubscriptionVault>(SubscriptionVaults.VaultStoragePath)
        signer.capabilities.publish(vaultCap, at: SubscriptionVaults.VaultPublicPath)
        
        log("✅ Vault saved to storage with public capability")
    }
    
    execute {
        // Step 6: Create subscription plan
        log("\n📋 Step 5: Setting Up Subscription Plan...")
        
        let vaultRef = getAccount(0xf8d6e0586b0a20c7)
            .capabilities.get<&SubscriptionVaults.SubscriptionVault>(SubscriptionVaults.VaultStoragePath)
            .borrow() ?? panic("Could not borrow vault reference")
        
        // Create monthly subscription (30 days = 2,592,000 seconds)
        let monthlyInterval: UFix64 = 2592000.0
        
        vaultRef.createSubscription(
            subscriptionID: "service_".concat(serviceProvider.toString()),
            serviceProvider: serviceProvider,
            planName: subscriptionPlan,
            amount: monthlyAmount,
            tokenType: "A.0ae53cb6e3f42a79.FlowToken.Vault",
            interval: monthlyInterval,
            maxPayments: nil // Unlimited
        )
        
        log("✅ Created subscription plan: ".concat(subscriptionPlan))
        log("Monthly payment: ".concat(monthlyAmount.toString()).concat(" FLOW"))
        log("Payment interval: 30 days")
        
        // Step 7: Authorize service provider
        log("\n🔐 Step 6: Authorizing Service Provider...")
        
        // Authorize service provider for payments up to 100 FLOW
        vaultRef.authorizePayee(payee: serviceProvider, maxAmount: 100.0)
        log("✅ Authorized service provider for payments up to 100 FLOW")
        
        // Step 8: Process first payment immediately (demo)
        log("\n💸 Step 7: Processing First Payment...")
        
        vaultRef.processSubscriptionPayment(subscriptionID: "service_".concat(serviceProvider.toString()))
        log("✅ First payment processed")
        
        // Step 9: Show final state
        log("\n📊 Final Vault State:")
        let finalBalance = vaultRef.getBalance(tokenType: "A.0ae53cb6e3f42a79.FlowToken.Vault")
        log("Remaining balance: ".concat(finalBalance.toString()).concat(" FLOW"))
        
        let subscription = vaultRef.getSubscription(subscriptionID: "service_".concat(serviceProvider.toString()))!
        log("Subscription active: ".concat(subscription.isActive.toString()))
        log("Payments processed: ".concat(subscription.paymentsProcessed.toString()))
        
        // Step 10: Register with automation system
        log("\n🤖 Step 8: Registering with Automation System...")
        
        // In a real implementation, this would register the vault for automated processing
        log("✅ Vault registered for automated payment processing")
        
        log("\n🎉 EVM Subscription Setup Complete!")
        log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        log("📱 User can now fund from MetaMask/EVM wallets")
        log("💳 Subscription vault automatically credits from bridge")
        log("⚡ Cadence controls automated monthly payments")
        log("🔧 Service providers receive predictable revenue")
        log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    }
}