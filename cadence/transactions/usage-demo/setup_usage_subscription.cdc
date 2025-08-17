import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7
import UsageBasedSubscriptions from 0x7ee75d81c7229a61

/// Demo: Set up a usage-based subscription with LiteLLM integration
transaction(
    providerAddress: Address,
    serviceName: String,
    initialDeposit: UFix64,
    litellmUserId: String
) {
    let vault: @FlowToken.Vault
    
    prepare(customer: auth(BorrowValue, Storage) &Account) {
        // Withdraw initial deposit
        let vaultRef = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.vault <- vaultRef.withdraw(amount: initialDeposit) as! @FlowToken.Vault
        
        log("=== USAGE-BASED SUBSCRIPTION SETUP ===")
        log("Customer: ".concat(customer.address.toString()))
        log("Provider: ".concat(providerAddress.toString()))
        log("Service: ".concat(serviceName))
        log("Initial Deposit: ".concat(initialDeposit.toString()).concat(" FLOW"))
        log("LiteLLM User ID: ".concat(litellmUserId))
    }
    
    execute {
        // Create usage-based subscription vault
        let vaultId = UsageBasedSubscriptions.createSubscriptionVault(
            owner: customer.address,
            provider: providerAddress,
            serviceName: serviceName,
            initialDeposit: <- self.vault
        )
        
        log("🎯 SUBSCRIPTION VAULT CREATED")
        log("Vault ID: ".concat(vaultId.toString()))
        log("")
        log("💡 DYNAMIC PRICING FEATURES:")
        log("✅ Real-time usage tracking via Flare Data Connector")
        log("✅ Variable pricing based on LiteLLM consumption")
        log("✅ Automatic tier adjustments (Starter → Growth → Scale → Enterprise)")
        log("✅ Model-specific pricing (GPT-4 premium, GPT-3.5 standard)")
        log("✅ Volume discounts for high usage")
        log("✅ Entitlement-based automated withdrawals")
        log("")
        log("📊 PRICING TIERS:")
        log("• Starter: 0-100K tokens @ $0.02/1K (0% discount)")
        log("• Growth: 100K-1M tokens @ $0.015/1K (10% discount)")
        log("• Scale: 1M-10M tokens @ $0.01/1K (20% discount)")
        log("• Enterprise: 10M+ tokens @ $0.008/1K (30% discount)")
        log("")
        log("🔄 AUTOMATED WORKFLOW:")
        log("1. LiteLLM tracks your API usage")
        log("2. Flare Data Connector sends usage to Flow")
        log("3. Smart contract calculates dynamic price")
        log("4. Provider automatically withdraws based on entitlement")
        log("5. Customer gets charged exactly for what they use")
        log("")
        log("🎉 Setup complete! Your usage-based subscription is now active.")
        log("Vault ID ".concat(vaultId.toString()).concat(" is ready for dynamic billing."))
    }
}