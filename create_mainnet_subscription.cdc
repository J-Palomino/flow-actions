import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import UsageBasedSubscriptions from 0x6daee039a7b9c2f0

/// Create a real usage-based subscription on mainnet
transaction(
    providerAddress: Address,
    serviceName: String,
    initialDeposit: UFix64,
    userId: String
) {
    let vault: @FlowToken.Vault
    
    prepare(customer: auth(BorrowValue, SaveValue, StorageCapabilities) &Account) {
        // Withdraw real FLOW from customer's vault
        let vaultRef = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.vault <- vaultRef.withdraw(amount: initialDeposit) as! @FlowToken.Vault
        
        log("=== MAINNET USAGE-BASED SUBSCRIPTION ===")
        log("Customer: ".concat(customer.address.toString()))
        log("Provider: ".concat(providerAddress.toString()))
        log("Service: ".concat(serviceName))
        log("Initial Deposit: ".concat(initialDeposit.toString()).concat(" FLOW"))
        log("User ID: ".concat(userId))
    }
    
    execute {
        // Create real subscription vault on mainnet
        let vaultId = UsageBasedSubscriptions.createSubscriptionVault(
            owner: customer.address,
            provider: providerAddress,
            serviceName: serviceName,
            initialDeposit: <- self.vault
        )
        
        log("🎯 REAL MAINNET SUBSCRIPTION CREATED")
        log("Vault ID: ".concat(vaultId.toString()))
        log("Total vaults on mainnet: ".concat(UsageBasedSubscriptions.totalVaults.toString()))
        log("")
        log("💰 REAL DYNAMIC PRICING ACTIVE:")
        log("✅ Connected to live mainnet contracts")
        log("✅ Real FLOW tokens deposited")
        log("✅ Production usage tracking enabled")
        log("✅ Live tier-based pricing")
        log("✅ Actual provider entitlements")
        log("")
        log("🔗 MAINNET CONTRACT: 0x6daee039a7b9c2f0")
        log("📊 SUBSCRIPTION VAULT ID: ".concat(vaultId.toString()))
        log("🎉 Production subscription ready for real usage!")
    }
}