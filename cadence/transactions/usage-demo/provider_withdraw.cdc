import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7
import UsageBasedSubscriptions from 0x7ee75d81c7229a61

/// Demo: Provider withdraws payment based on usage entitlement
transaction(
    customerAddress: Address,
    vaultId: UInt64,
    withdrawAmount: UFix64
) {
    let providerVault: &FlowToken.Vault
    
    prepare(provider: auth(BorrowValue) &Account) {
        // Get provider's vault for receiving payment
        self.providerVault = provider.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow provider's Flow vault")
        
        log("=== PROVIDER WITHDRAWAL BASED ON USAGE ===")
        log("Provider: ".concat(provider.address.toString()))
        log("Customer: ".concat(customerAddress.toString()))
        log("Vault ID: ".concat(vaultId.toString()))
        log("Withdrawal Amount: $".concat(withdrawAmount.toString()))
    }
    
    execute {
        // Get customer's subscription vault
        if let vault = UsageBasedSubscriptions.borrowVault(owner: customerAddress, vaultId: vaultId) {
            
            log("📊 CURRENT VAULT STATUS:")
            log("Balance: $".concat(vault.getBalance().toString()))
            
            let pricingInfo = vault.getPricingInfo()
            log("Current Tier: ".concat(pricingInfo["currentTier"]! as! String))
            log("Current Price: $".concat((pricingInfo["currentPrice"]! as! UFix64).toString()))
            log("Remaining Entitlement: $".concat((pricingInfo["remainingEntitlement"]! as! UFix64).toString()))
            
            // Attempt withdrawal based on entitlement
            log("")
            log("🔐 CHECKING ENTITLEMENT...")
            
            let remainingEntitlement = pricingInfo["remainingEntitlement"]! as! UFix64
            
            if withdrawAmount <= remainingEntitlement {
                log("✅ Withdrawal authorized - within entitlement limit")
                
                // Withdraw based on usage entitlement
                let payment <- vault.withdrawWithEntitlement(amount: withdrawAmount)
                
                // Deposit to provider
                self.providerVault.deposit(from: <- payment)
                
                log("")
                log("💰 PAYMENT PROCESSED")
                log("Amount: $".concat(withdrawAmount.toString()))
                log("Remaining entitlement: $".concat((remainingEntitlement - withdrawAmount).toString()))
                log("New vault balance: $".concat(vault.getBalance().toString()))
                
                log("")
                log("📈 USAGE-BASED BILLING BENEFITS:")
                log("• Customer only pays for actual LiteLLM consumption")
                log("• Provider gets automatic payments based on real usage")
                log("• Dynamic pricing tiers reward high-volume customers")
                log("• Transparent, verifiable billing via blockchain")
                log("• No overpayment or underpayment issues")
                
            } else {
                log("❌ Withdrawal denied - exceeds entitlement")
                log("Requested: $".concat(withdrawAmount.toString()))
                log("Available: $".concat(remainingEntitlement.toString()))
                log("")
                log("💡 Provider needs to wait for next usage update from LiteLLM")
                log("   or customer needs to fund their vault")
            }
            
        } else {
            panic("Could not find subscription vault")
        }
        
        log("")
        log("🎯 NEXT STEPS:")
        log("1. LiteLLM continues tracking usage")
        log("2. FDC sends updates every 5 minutes")
        log("3. Entitlements automatically refresh based on new usage")
        log("4. Provider can withdraw again when usage increases")
    }
}