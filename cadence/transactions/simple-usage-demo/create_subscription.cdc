import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7
import SimpleUsageSubscriptions from 0x7ee75d81c7229a61

/// Demo: Customer creates usage-based subscription vault
/// This is the main function users connect to for setting up variable pricing
transaction(
    providerAddress: Address,
    initialDeposit: UFix64
) {
    let vault: @SimpleUsageSubscriptions.SubscriptionVault
    
    prepare(customer: auth(BorrowValue, Storage) &Account) {
        // Withdraw initial deposit from customer's FLOW vault
        let flowVaultRef = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        let depositVault <- flowVaultRef.withdraw(amount: initialDeposit) as! @FlowToken.Vault
        
        // Create subscription vault (this grants entitlement to provider)
        self.vault <- SimpleUsageSubscriptions.createSubscriptionVault(
            customer: customer.address,
            provider: providerAddress,
            initialDeposit: <- depositVault
        )
        
        log("=== USAGE-BASED SUBSCRIPTION CREATED ===")
        log("Customer: ".concat(customer.address.toString()))
        log("Provider: ".concat(providerAddress.toString()))
        log("Vault ID: ".concat(self.vault.id.toString()))
        log("Initial Deposit: ".concat(initialDeposit.toString()).concat(" FLOW"))
        log("LiteLLM Endpoint: https://llm.p10p.io")
    }
    
    execute {
        // Store vault in customer's account
        customer.storage.save(<- self.vault, to: SimpleUsageSubscriptions.VaultStoragePath)
        
        // Create public capability for provider access
        let vaultCap = customer.capabilities.storage.issue<&SimpleUsageSubscriptions.SubscriptionVault>(
            SimpleUsageSubscriptions.VaultStoragePath
        )
        customer.capabilities.publish(vaultCap, at: SimpleUsageSubscriptions.VaultPublicPath)
        
        log("")
        log("🎯 VARIABLE PRICING FEATURES ACTIVATED:")
        log("✅ Real-time usage tracking from https://llm.p10p.io")
        log("✅ Dynamic pricing based on actual token consumption")
        log("✅ Automatic tier adjustments with volume discounts")
        log("✅ Model-specific pricing (GPT-4 premium, GPT-3.5 standard)")
        log("✅ Provider entitlement updates with each usage report")
        log("✅ Secure, blockchain-verified billing")
        log("")
        log("📊 PRICING TIERS:")
        log("• Starter: 0-100K tokens @ $0.02/1K (0% discount)")
        log("• Growth: 100K-1M tokens @ $0.015/1K (10% discount)")
        log("• Scale: 1M-10M tokens @ $0.01/1K (20% discount)")
        log("• Enterprise: 10M+ tokens @ $0.008/1K (30% discount)")
        log("")
        log("🔄 AUTOMATED WORKFLOW:")
        log("1. Your LiteLLM usage is tracked at https://llm.p10p.io")
        log("2. Flare Data Connector sends usage to Flow every 5 minutes")
        log("3. Smart contract calculates dynamic price based on:")
        log("   - Token consumption tier")
        log("   - Model types used (GPT-4, GPT-3.5, etc.)")
        log("   - Volume discounts")
        log("4. Provider can withdraw EXACTLY the usage-based amount")
        log("5. No overpayment, no underpayment - just fair pricing!")
        log("")
        log("🎉 Your usage-based subscription is now active!")
        log("Vault stored at: ".concat(SimpleUsageSubscriptions.VaultStoragePath.toString()))
        log("Public access at: ".concat(SimpleUsageSubscriptions.VaultPublicPath.toString()))
    }
}