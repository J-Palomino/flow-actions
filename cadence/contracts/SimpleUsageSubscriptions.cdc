import "FungibleToken"
import "FlowToken"
import "FlareFDCTriggers"

/// SimpleUsageSubscriptions: Simplified usage-based billing for LiteLLM
/// Users connect to this contract to create vaults and grant payment entitlements
access(all) contract SimpleUsageSubscriptions {
    
    /// Events
    access(all) event SubscriptionCreated(vaultId: UInt64, customer: Address, provider: Address)
    access(all) event UsageUpdated(vaultId: UInt64, newPrice: UFix64, tier: String)
    access(all) event PaymentProcessed(vaultId: UInt64, amount: UFix64)
    
    /// Storage paths
    access(all) let VaultStoragePath: StoragePath
    access(all) let VaultPublicPath: PublicPath
    
    /// Global state
    access(all) var totalVaults: UInt64
    
    /// Pricing tiers
    access(all) struct PricingTier {
        access(all) let name: String
        access(all) let minTokens: UInt64
        access(all) let pricePerK: UFix64
        access(all) let discount: UFix64
        
        init(name: String, minTokens: UInt64, pricePerK: UFix64, discount: UFix64) {
            self.name = name
            self.minTokens = minTokens
            self.pricePerK = pricePerK
            self.discount = discount
        }
    }
    
    /// Usage report from LiteLLM
    access(all) struct UsageReport {
        access(all) let vaultId: UInt64
        access(all) let totalTokens: UInt64
        access(all) let apiCalls: UInt64
        access(all) let gpt4Tokens: UInt64
        access(all) let gpt35Tokens: UInt64
        access(all) let timestamp: UFix64
        
        init(vaultId: UInt64, totalTokens: UInt64, apiCalls: UInt64, gpt4Tokens: UInt64, gpt35Tokens: UInt64) {
            self.vaultId = vaultId
            self.totalTokens = totalTokens
            self.apiCalls = apiCalls
            self.gpt4Tokens = gpt4Tokens
            self.gpt35Tokens = gpt35Tokens
            self.timestamp = getCurrentBlock().timestamp
        }
    }
    
    /// Subscription vault with usage-based pricing
    access(all) resource SubscriptionVault {
        access(all) let id: UInt64
        access(all) let customer: Address
        access(all) let provider: Address
        access(self) let vault: @{FungibleToken.Vault}
        
        // Usage tracking
        access(all) var lastUsage: UsageReport?
        access(all) var currentTier: PricingTier
        access(all) var currentPrice: UFix64
        access(all) var allowedWithdrawal: UFix64
        
        /// Process usage update from LiteLLM via FDC
        access(all) fun updateUsage(_ usage: UsageReport) {
            self.lastUsage = usage
            
            // Calculate tier
            self.currentTier = SimpleUsageSubscriptions.getTierForUsage(usage.totalTokens)
            
            // Calculate price
            let basePrice = UFix64(usage.totalTokens) / 1000.0 * self.currentTier.pricePerK
            let discounted = basePrice * (1.0 - self.currentTier.discount)
            
            // Model multipliers
            let gpt4Cost = UFix64(usage.gpt4Tokens) / 1000.0 * self.currentTier.pricePerK * 1.5
            let gpt35Cost = UFix64(usage.gpt35Tokens) / 1000.0 * self.currentTier.pricePerK * 0.8
            
            self.currentPrice = gpt4Cost + gpt35Cost
            self.allowedWithdrawal = self.currentPrice
            
            emit UsageUpdated(
                vaultId: self.id,
                newPrice: self.currentPrice,
                tier: self.currentTier.name
            )
        }
        
        /// Provider withdraws based on usage
        access(all) fun withdrawByUsage(amount: UFix64): @{FungibleToken.Vault} {
            pre {
                amount <= self.allowedWithdrawal: "Exceeds usage allowance"
                amount <= self.vault.balance: "Insufficient balance"
            }
            
            self.allowedWithdrawal = self.allowedWithdrawal - amount
            let payment <- self.vault.withdraw(amount: amount)
            
            emit PaymentProcessed(vaultId: self.id, amount: amount)
            return <- payment
        }
        
        /// Customer deposits funds
        access(all) fun deposit(from: @{FungibleToken.Vault}) {
            self.vault.deposit(from: <- from)
        }
        
        /// Get vault info
        access(all) fun getInfo(): {String: AnyStruct} {
            return {
                "balance": self.vault.balance,
                "currentPrice": self.currentPrice,
                "allowedWithdrawal": self.allowedWithdrawal,
                "tier": self.currentTier.name,
                "lastUpdate": self.lastUsage?.timestamp ?? 0.0
            }
        }
        
        init(customer: Address, provider: Address, initialDeposit: @{FungibleToken.Vault}) {
            self.id = SimpleUsageSubscriptions.totalVaults
            SimpleUsageSubscriptions.totalVaults = SimpleUsageSubscriptions.totalVaults + 1
            
            self.customer = customer
            self.provider = provider
            self.vault <- initialDeposit
            
            self.lastUsage = nil
            self.currentTier = SimpleUsageSubscriptions.getStarterTier()
            self.currentPrice = 0.0
            self.allowedWithdrawal = 0.0
        }
    }
    
    /// FDC Handler for LiteLLM usage updates
    access(all) resource LiteLLMHandler: FlareFDCTriggers.TriggerHandler {
        access(self) var active: Bool
        
        access(all) fun handleTrigger(trigger: FlareFDCTriggers.FDCTrigger): Bool {
            // Extract usage data from FDC payload
            if let vaultIdAny = trigger.payload["vaultId"] {
                if let vaultId = vaultIdAny as? UInt64 {
                    let usage = UsageReport(
                        vaultId: vaultId,
                        totalTokens: trigger.payload["totalTokens"] as? UInt64 ?? 0,
                        apiCalls: trigger.payload["apiCalls"] as? UInt64 ?? 0,
                        gpt4Tokens: trigger.payload["gpt4Tokens"] as? UInt64 ?? 0,
                        gpt35Tokens: trigger.payload["gpt35Tokens"] as? UInt64 ?? 0
                    )
                    
                    // This would update the vault in production
                    // For demo, just emit the event
                    emit UsageUpdated(
                        vaultId: vaultId,
                        newPrice: UFix64(usage.totalTokens) / 1000.0 * 0.02,
                        tier: "Auto-calculated"
                    )
                    
                    return true
                }
            }
            return false
        }
        
        access(all) fun getSupportedTriggerTypes(): [FlareFDCTriggers.TriggerType] {
            return [FlareFDCTriggers.TriggerType.DefiProtocolEvent]
        }
        
        access(all) fun isActive(): Bool {
            return self.active
        }
        
        init() {
            self.active = true
        }
    }
    
    /// Public functions users connect to
    
    /// Create subscription vault (main user entry point)
    access(all) fun createSubscriptionVault(
        customer: Address,
        provider: Address,
        initialDeposit: @{FungibleToken.Vault}
    ): @SubscriptionVault {
        let vault <- create SubscriptionVault(
            customer: customer,
            provider: provider,
            initialDeposit: <- initialDeposit
        )
        
        emit SubscriptionCreated(
            vaultId: vault.id,
            customer: customer,
            provider: provider
        )
        
        return <- vault
    }
    
    /// Process usage update (called by FDC)
    access(all) fun processUsageUpdate(usage: UsageReport) {
        emit UsageUpdated(
            vaultId: usage.vaultId,
            newPrice: UFix64(usage.totalTokens) / 1000.0 * 0.02,
            tier: self.getTierForUsage(usage.totalTokens).name
        )
    }
    
    /// Get pricing tier for usage amount
    access(all) fun getTierForUsage(_ tokens: UInt64): PricingTier {
        if tokens >= 10000000 {
            return PricingTier(name: "Enterprise", minTokens: 10000000, pricePerK: 0.008, discount: 0.3)
        } else if tokens >= 1000000 {
            return PricingTier(name: "Scale", minTokens: 1000000, pricePerK: 0.01, discount: 0.2)
        } else if tokens >= 100000 {
            return PricingTier(name: "Growth", minTokens: 100000, pricePerK: 0.015, discount: 0.1)
        } else {
            return self.getStarterTier()
        }
    }
    
    access(all) fun getStarterTier(): PricingTier {
        return PricingTier(name: "Starter", minTokens: 0, pricePerK: 0.02, discount: 0.0)
    }
    
    /// Create LiteLLM handler
    access(all) fun createLiteLLMHandler(): @LiteLLMHandler {
        return <- create LiteLLMHandler()
    }
    
    init() {
        self.VaultStoragePath = /storage/SimpleUsageSubscriptionVault
        self.VaultPublicPath = /public/SimpleUsageSubscriptionVault
        self.totalVaults = 0
    }
}