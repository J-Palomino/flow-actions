import "FungibleToken"
import "FlowToken"
import "UsageBasedSubscriptions"

/// Create a subscription with custom entitlement settings
/// @param providerAddress: Address of the service provider
/// @param initialDeposit: Amount of FLOW to deposit
/// @param entitlementType: "fixed" or "dynamic"
/// @param withdrawLimit: Initial withdrawal limit for provider
/// @param expirationAmount: Number of time units for expiration
/// @param expirationUnit: "hours", "days", or "months"
transaction(
    providerAddress: Address,
    initialDeposit: UFix64,
    entitlementType: String,
    withdrawLimit: UFix64,
    expirationAmount: UInt64,
    expirationUnit: String
) {
    
    let vault: @FlowToken.Vault
    let customerAddress: Address
    
    prepare(signer: auth(BorrowValue) &Account) {
        self.customerAddress = signer.address
        
        // Withdraw FLOW from signer's vault
        let flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault from storage")
        
        self.vault <- flowVault.withdraw(amount: initialDeposit) as! @FlowToken.Vault
    }
    
    execute {
        // Convert entitlement type string to enum
        let entitlementTypeEnum: UsageBasedSubscriptions.EntitlementType
        if entitlementType == "fixed" {
            entitlementTypeEnum = UsageBasedSubscriptions.EntitlementType.fixed
        } else {
            entitlementTypeEnum = UsageBasedSubscriptions.EntitlementType.dynamic
        }
        
        // Convert expiration to seconds
        let validityPeriod = UsageBasedSubscriptions.convertToSeconds(
            amount: expirationAmount,
            unit: expirationUnit
        )
        
        // Create subscription vault with entitlement settings
        let vaultId = UsageBasedSubscriptions.createSubscriptionVault(
            owner: self.customerAddress,
            provider: providerAddress,
            serviceName: "LiteLLM API Access",
            initialDeposit: <- self.vault,
            entitlementType: entitlementTypeEnum,
            initialWithdrawLimit: withdrawLimit,
            validityPeriod: validityPeriod
        )
        
        log("✅ Subscription created successfully!")
        log("  - Vault ID: ".concat(vaultId.toString()))
        log("  - Customer: ".concat(self.customerAddress.toString()))
        log("  - Provider: ".concat(providerAddress.toString()))
        log("  - Initial Deposit: ".concat(initialDeposit.toString()).concat(" FLOW"))
        log("  - Entitlement Type: ".concat(entitlementType))
        log("  - Withdraw Limit: ".concat(withdrawLimit.toString()).concat(" FLOW"))
        log("  - Expires In: ".concat(expirationAmount.toString()).concat(" ").concat(expirationUnit))
    }
}