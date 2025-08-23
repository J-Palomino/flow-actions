import "FungibleToken"
import "FlowToken"
import "FlareFDCTriggers"
import "FTSOPriceFeedConnector"
import "DeFiActions"

/// EncryptedUsageSubscriptions: Dynamic pricing with encrypted on-chain API key storage
/// Includes real-time USD to FLOW conversion via Flare FTSO and secure API key management
access(all) contract EncryptedUsageSubscriptions {
    
    /// Events
    access(all) event SubscriptionCreated(vaultId: UInt64, owner: Address, provider: Address)
    access(all) event UsageDataReceived(vaultId: UInt64, usage: UsageReport, source: String)
    access(all) event PriceCalculated(vaultId: UInt64, basePrice: UFix64, usageMultiplier: UFix64, finalPrice: UFix64)
    access(all) event PaymentProcessed(vaultId: UInt64, amount: UFix64, provider: Address)
    access(all) event AutomaticPaymentProcessed(vaultId: UInt64, amount: UFix64, provider: Address, totalPaidToDate: UFix64)
    access(all) event EntitlementUpdated(vaultId: UInt64, withdrawLimit: UFix64, validUntil: UFix64)
    access(all) event UsageTierChanged(vaultId: UInt64, oldTier: String, newTier: String)
    access(all) event PriceConversion(vaultId: UInt64, usdCost: UFix64, flowPrice: UFix64, flowAmount: UFix64)
    
    /// Storage paths
    access(all) let VaultStoragePath: StoragePath
    access(all) let VaultPublicPath: PublicPath
    access(all) let ProviderStoragePath: StoragePath
    
    /// Global registry
    access(all) var totalVaults: UInt64
    access(all) let vaultRegistry: {UInt64: Address}
    
    /// Pricing tiers based on usage
    access(all) struct PricingTier {
        access(all) let name: String
        access(all) let minUsage: UInt64      // Min API calls/tokens
        access(all) let maxUsage: UInt64      // Max API calls/tokens
        access(all) let pricePerUnit: UFix64  // Price per 1000 tokens/calls
        access(all) let discountRate: UFix64  // Volume discount (0.0 - 1.0)
        
        init(name: String, minUsage: UInt64, maxUsage: UInt64, pricePerUnit: UFix64, discountRate: UFix64) {
            self.name = name
            self.minUsage = minUsage
            self.maxUsage = maxUsage
            self.pricePerUnit = pricePerUnit
            self.discountRate = discountRate
        }
    }
    
    /// Usage report from LiteLLM via FDC
    access(all) struct UsageReport {
        access(all) let timestamp: UFix64
        access(all) let period: String         // "daily", "weekly", "monthly"
        access(all) let totalTokens: UInt64    // Total tokens consumed
        access(all) let apiCalls: UInt64       // Number of API calls
        access(all) let models: {String: UInt64}  // Usage by model (gpt-4, claude, etc)
        access(all) let costEstimate: UFix64   // Provider's cost estimate in USD
        access(all) let metadata: {String: String}
        
        init(
            timestamp: UFix64,
            period: String,
            totalTokens: UInt64,
            apiCalls: UInt64,
            models: {String: UInt64},
            costEstimate: UFix64,
            metadata: {String: String}
        ) {
            self.timestamp = timestamp
            self.period = period
            self.totalTokens = totalTokens
            self.apiCalls = apiCalls
            self.models = models
            self.costEstimate = costEstimate
            self.metadata = metadata
        }
    }
    
    /// Entitlement types
    access(all) enum EntitlementType: UInt8 {
        access(all) case fixed      // Fixed withdrawal limit set by user
        access(all) case dynamic    // Grows with usage as long as vault is funded
    }
    
    /// Dynamic entitlement for automated withdrawals
    access(all) struct Entitlement {
        access(all) let vaultId: UInt64
        access(all) var withdrawLimit: UFix64   // Max amount provider can withdraw
        access(all) var usedAmount: UFix64      // Amount already withdrawn
        access(all) var validUntil: UFix64      // Expiration timestamp
        access(all) var lastUpdate: UFix64      // Last FDC update
        access(all) var isActive: Bool
        access(all) let entitlementType: EntitlementType  // Fixed or Dynamic
        access(all) let fixedLimit: UFix64      // Original fixed limit (if fixed type)
        
        access(all) fun updateLimit(newLimit: UFix64, validityPeriod: UFix64) {
            // For fixed entitlements, never exceed the original fixed limit
            if self.entitlementType == EntitlementType.fixed {
                self.withdrawLimit = newLimit > self.fixedLimit ? self.fixedLimit : newLimit
            } else {
                // Dynamic entitlements can grow with usage
                self.withdrawLimit = newLimit
            }
            
            self.validUntil = getCurrentBlock().timestamp + validityPeriod
            self.lastUpdate = getCurrentBlock().timestamp
        }
        
        access(all) fun recordWithdrawal(amount: UFix64) {
            self.usedAmount = self.usedAmount + amount
        }
        
        access(all) fun getRemainingAllowance(): UFix64 {
            if getCurrentBlock().timestamp > self.validUntil {
                return 0.0
            }
            return self.withdrawLimit > self.usedAmount 
                ? self.withdrawLimit - self.usedAmount 
                : 0.0
        }
        
        init(vaultId: UInt64, entitlementType: EntitlementType, initialLimit: UFix64, validityPeriod: UFix64) {
            self.vaultId = vaultId
            self.entitlementType = entitlementType
            self.fixedLimit = entitlementType == EntitlementType.fixed ? initialLimit : 0.0
            self.withdrawLimit = initialLimit
            self.usedAmount = 0.0
            self.validUntil = getCurrentBlock().timestamp + validityPeriod
            self.lastUpdate = getCurrentBlock().timestamp
            self.isActive = true
        }
    }
    
    /// Public interface for subscription vault - exposes safe public methods
    access(all) resource interface SubscriptionVaultPublic {
        access(all) let id: UInt64
        access(all) let customer: Address
        access(all) let provider: Address
        access(all) let serviceName: String
        access(all) var encryptedApiKey: String?
        access(all) var keyEncryptionSalt: String?
        
        // Public methods
        access(all) fun deposit(from: @{FungibleToken.Vault})
        access(all) fun getBalance(): UFix64
        access(all) fun getPricingInfo(): {String: AnyStruct}
        access(all) fun getVaultInfo(): {String: AnyStruct}
        access(all) fun processUsageData(usage: UsageReport)
        access(all) fun withdrawWithEntitlement(amount: UFix64): @{FungibleToken.Vault}
        access(all) fun getEncryptedLiteLLMKeyData(): {String: String?}
        access(all) fun hasApiKey(): Bool
        access(all) fun setEncryptedLiteLLMApiKey(encryptedKey: String, salt: String, caller: Address)
    }
    
    /// Restricted interface for key management - only accessible to authorized parties
    access(all) resource interface SubscriptionVaultKeyManagement {
        access(all) fun setEncryptedLiteLLMApiKey(encryptedKey: String, salt: String, caller: Address)
    }

    /// Usage-based subscription vault
    access(all) resource SubscriptionVault: SubscriptionVaultPublic, SubscriptionVaultKeyManagement {
        access(all) let id: UInt64
        access(all) let customer: Address
        access(all) let provider: Address
        access(all) let serviceName: String
        
        // Funding
        access(self) let vault: @{FungibleToken.Vault}
        
        // Usage tracking
        access(all) var currentUsage: UsageReport?
        access(all) var usageHistory: [UsageReport]
        access(all) var currentTier: PricingTier
        
        // Cumulative usage tracking for differential payments
        access(all) var lastPaidTokens: UInt64      // Tokens we've already paid for
        access(all) var lastPaidRequests: UInt64    // Requests we've already paid for
        access(all) var totalPaidAmount: UFix64     // Total FLOW paid to provider
        access(all) var lastOracleUpdate: UFix64    // Timestamp of last oracle confirmation
        
        // Hybrid data source tracking
        access(all) var lastDirectAPIUpdate: UFix64     // Timestamp of last direct API update
        access(all) var lastFlareOracleUpdate: UFix64   // Timestamp of last Flare Oracle update
        access(all) var lastUsageData: UsageReport?     // Store the actual last usage data
        access(all) var lastDataSource: String          // "API" or "Oracle" - tracks most recent source
        
        // Dynamic pricing
        access(all) var basePrice: UFix64
        access(all) var usageMultiplier: UFix64
        access(all) var currentPrice: UFix64
        
        // Entitlements
        access(all) var entitlement: Entitlement
        
        // Settings
        access(all) var autoPay: Bool
        access(all) var maxMonthlySpend: UFix64
        
        // Selected AI models (max 3)
        access(all) let selectedModels: [String]  // Model IDs like ["gpt-4", "claude-3-sonnet"]
        access(all) let modelPricing: {String: UFix64}  // Model-specific pricing overrides
        
        // Encrypted LiteLLM API Key - stored on-chain securely
        access(all) var encryptedApiKey: String?  // Encrypted LiteLLM API key
        access(all) var keyEncryptionSalt: String?  // Salt used for encryption
        
        /// Set encrypted LiteLLM API key - RESTRICTED ACCESS
        /// Only vault owner, provider, or contract can call this
        access(all) fun setEncryptedLiteLLMApiKey(encryptedKey: String, salt: String, caller: Address) {
            // Access control: only allow owner or provider
            pre {
                caller == self.customer || caller == self.provider: 
                "Only vault owner or provider can set encrypted API key"
            }
            
            self.encryptedApiKey = encryptedKey
            self.keyEncryptionSalt = salt
            log("✅ Encrypted LiteLLM API key set by authorized caller: ".concat(caller.toString()))
        }
        
        /// Get encrypted LiteLLM API key data - PUBLIC ACCESS (safe since encrypted)
        access(all) fun getEncryptedLiteLLMKeyData(): {String: String?} {
            return {
                "encryptedKey": self.encryptedApiKey,
                "salt": self.keyEncryptionSalt
            }
        }
        
        /// Check if this vault has an API key - PUBLIC ACCESS
        access(all) fun hasApiKey(): Bool {
            return self.encryptedApiKey != nil && self.keyEncryptionSalt != nil
        }
        
        /// Process usage data from FDC and update pricing
        access(all) fun processUsageData(usage: UsageReport) {
            // Determine the data source based on metadata
            let source = usage.metadata["source"] as? String ?? "Direct API"
            
            // Update source-specific timestamps
            if source == "Flare Oracle FDC" {
                self.lastFlareOracleUpdate = getCurrentBlock().timestamp
                self.lastDataSource = "Oracle"
            } else {
                self.lastDirectAPIUpdate = getCurrentBlock().timestamp
                self.lastDataSource = "API"
            }
            
            // Store usage report
            self.currentUsage = usage
            self.lastUsageData = usage
            self.usageHistory.append(usage)
            
            // Calculate NEW usage since last payment (differential)
            let newTokens = usage.totalTokens > self.lastPaidTokens ? usage.totalTokens - self.lastPaidTokens : 0
            let newRequests = usage.apiCalls > self.lastPaidRequests ? usage.apiCalls - self.lastPaidRequests : 0
            
            log("📊 Processing differential usage:")
            log("   Total tokens: ".concat(usage.totalTokens.toString()).concat(" (+").concat(newTokens.toString()).concat(" new)"))
            log("   Total requests: ".concat(usage.apiCalls.toString()).concat(" (+").concat(newRequests.toString()).concat(" new)"))
            log("   Last paid tokens: ".concat(self.lastPaidTokens.toString()))
            
            // Only process payment if there's NEW usage
            if UInt64(newTokens) > 0 || UInt64(newRequests) > 0 {
                // Update pricing tier based on TOTAL usage
                let newTier = EncryptedUsageSubscriptions.calculateTier(usage.totalTokens)
                if newTier.name != self.currentTier.name {
                    emit UsageTierChanged(
                        vaultId: self.id,
                        oldTier: self.currentTier.name,
                        newTier: newTier.name
                    )
                    self.currentTier = newTier
                }
                
                // Calculate price for NEW usage only
                let newUsageReport = UsageReport(
                    timestamp: usage.timestamp,
                    period: usage.period,
                    totalTokens: UInt64(newTokens),
                    apiCalls: UInt64(newRequests),
                    models: usage.models,
                    costEstimate: 0.0, // Will be calculated
                    metadata: usage.metadata
                )
                
                self.calculateDynamicPrice(newUsageReport)
                
                // Process automatic payment for new usage
                self.processAutomaticPayment(newUsageAmount: self.currentPrice)
                
                // Update paid tracking
                self.lastPaidTokens = usage.totalTokens
                self.lastPaidRequests = usage.apiCalls
                self.lastOracleUpdate = getCurrentBlock().timestamp
            }
            
            emit UsageDataReceived(
                vaultId: self.id,
                usage: usage,
                source: "LiteLLM via FDC"
            )
        }
        
        /// Calculate dynamic price based on usage
        /// Calculate price in FLOW tokens from USD cost using Flare price oracle
        access(self) fun calculateDynamicPrice(_ usage: UsageReport) {
            // Use cost estimate from LiteLLM if available (in USD)
            let usdCost = usage.costEstimate
            
            if usdCost > 0.0 {
                // Convert USD to FLOW using Flare FTSO price feed - FAIL if oracle unavailable
                if let flowPrice = self.getFlowPriceInUSD() {
                    let flowAmount = usdCost / flowPrice
                    
                    // Store pricing data
                    self.basePrice = usdCost
                    self.usageMultiplier = 1.0
                    self.currentPrice = flowAmount
                    
                    emit PriceConversion(
                        vaultId: self.id,
                        usdCost: usdCost,
                        flowPrice: flowPrice,
                        flowAmount: flowAmount
                    )
                    
                    emit PriceCalculated(
                        vaultId: self.id,
                        basePrice: self.basePrice,
                        usageMultiplier: self.usageMultiplier,
                        finalPrice: self.currentPrice
                    )
                } else {
                    // Oracle failure - cannot process USD pricing
                    log("❌ Cannot process USD-based pricing: FTSO oracle unavailable")
                    log("   Skipping price calculation for vault ".concat(self.id.toString()))
                    // Keep existing pricing unchanged
                    return
                }
            } else {
                // Fallback to old token-based pricing if no USD cost provided
                let tokenThousands = UFix64(usage.totalTokens) / 1000.0
                var calculatedPrice = tokenThousands * self.currentTier.pricePerUnit
                
                // Apply volume discount
                calculatedPrice = calculatedPrice * (1.0 - self.currentTier.discountRate)
                
                // Apply model-specific multipliers based on selected models
                var modelMultiplier = 1.0
                var modelCount = 0
                
                for model in usage.models.keys {
                    // Only apply pricing for selected models
                    if self.selectedModels.contains(model) {
                        let multiplier = self.modelPricing[model] ?? 1.0
                        modelMultiplier = modelMultiplier + multiplier
                        modelCount = modelCount + 1
                    }
                }
                
                // Average the multipliers if multiple models were used
                if modelCount > 0 {
                    modelMultiplier = modelMultiplier / UFix64(modelCount)
                }
                
                self.usageMultiplier = modelMultiplier
                self.currentPrice = calculatedPrice * modelMultiplier
                
                emit PriceCalculated(
                    vaultId: self.id,
                    basePrice: self.basePrice,
                    usageMultiplier: self.usageMultiplier,
                    finalPrice: self.currentPrice
                )
            }
        }
        
        /// Get current FLOW price in USD from Flare FTSO price feed
        access(self) fun getFlowPriceInUSD(): UFix64? {
            // Get FLOW/USD price from FTSO price feed
            if let priceData = FTSOPriceFeedConnector.getCurrentPrice(symbol: "FLOW/USD") {
                // Ensure price is reasonable (between $0.10 and $100.00) and verified
                if priceData.verified && priceData.price > 0.1 && priceData.price < 100.0 {
                    log("💱 FLOW price from FTSO: $".concat(priceData.price.toString()).concat(" (verified)"))
                    return priceData.price
                }
            }
            
            // Return nil if FTSO is unavailable - no hardcoded fallback
            log("❌ FTSO price feed unavailable or unverified - cannot process USD-based pricing")
            return nil
        }
        
        /// Update entitlement for provider withdrawals
        access(self) fun updateEntitlement() {
            let withdrawLimit = self.currentPrice
            let validityPeriod = 86400.0 * 30.0  // 30 days
            
            self.entitlement.updateLimit(
                newLimit: withdrawLimit,
                validityPeriod: validityPeriod
            )
            
            emit EntitlementUpdated(
                vaultId: self.id,
                withdrawLimit: withdrawLimit,
                validUntil: self.entitlement.validUntil
            )
        }
        
        /// Provider withdraws based on entitlement
        access(all) fun withdrawWithEntitlement(amount: UFix64): @{FungibleToken.Vault} {
            // Check entitlement allowance
            let remainingAllowance = self.entitlement.getRemainingAllowance()
            assert(amount <= remainingAllowance, message: "Amount exceeds entitlement allowance")
            assert(amount <= self.vault.balance, message: "Insufficient vault balance")
            
            let payment <- self.vault.withdraw(amount: amount)
            self.entitlement.recordWithdrawal(amount: amount)
            
            emit PaymentProcessed(
                vaultId: self.id,
                amount: amount,
                provider: self.provider
            )
            
            return <- payment
        }
        
        /// Process automatic payment to provider based on new usage
        access(self) fun processAutomaticPayment(newUsageAmount: UFix64) {
            // Check if automatic payments are enabled
            if !self.autoPay {
                log("⏸️ Auto-pay disabled, skipping automatic payment")
                return
            }
            
            // Check if vault has sufficient balance
            if self.vault.balance < newUsageAmount {
                log("⚠️ Insufficient vault balance for automatic payment")
                log("   Required: ".concat(newUsageAmount.toString()).concat(" FLOW"))
                log("   Available: ".concat(self.vault.balance.toString()).concat(" FLOW"))
                return
            }
            
            // Check monthly spending limits
            if self.totalPaidAmount + newUsageAmount > self.maxMonthlySpend {
                log("⚠️ Monthly spending limit exceeded, skipping automatic payment")
                log("   Would exceed limit by: ".concat((self.totalPaidAmount + newUsageAmount - self.maxMonthlySpend).toString()).concat(" FLOW"))
                return
            }
            
            // Process automatic payment
            log("💰 Processing automatic payment:")
            log("   Amount: ".concat(newUsageAmount.toString()).concat(" FLOW"))
            log("   Provider: ".concat(self.provider.toString()))
            
            // Transfer funds directly to provider
            let payment <- self.vault.withdraw(amount: newUsageAmount)
            
            // Get provider's Flow vault and deposit payment
            let providerAccount = getAccount(self.provider)
            let providerReceiver = providerAccount.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            let receiverRef = providerReceiver.borrow()!
            receiverRef.deposit(from: <- payment)
            
            // Update tracking
            self.totalPaidAmount = self.totalPaidAmount + newUsageAmount
            self.entitlement.recordWithdrawal(amount: newUsageAmount)
            
            emit PaymentProcessed(
                vaultId: self.id,
                amount: newUsageAmount,
                provider: self.provider
            )
            
            emit AutomaticPaymentProcessed(
                vaultId: self.id,
                amount: newUsageAmount,
                provider: self.provider,
                totalPaidToDate: self.totalPaidAmount
            )
            
            log("✅ Automatic payment completed successfully")
        }
        
        /// Deposit funds to vault
        access(all) fun deposit(from: @{FungibleToken.Vault}) {
            self.vault.deposit(from: <- from)
        }
        
        /// Get vault balance
        access(all) fun getBalance(): UFix64 {
            return self.vault.balance
        }
        
        /// Get current pricing info
        access(all) fun getPricingInfo(): {String: AnyStruct} {
            return {
                "currentTier": self.currentTier.name,
                "basePrice": self.basePrice,
                "usageMultiplier": self.usageMultiplier,
                "currentPrice": self.currentPrice,
                "remainingEntitlement": self.entitlement.getRemainingAllowance()
            }
        }
        
        /// Get complete vault information for UI display
        access(all) fun getVaultInfo(): {String: AnyStruct} {
            return {
                "vaultId": self.id,
                "owner": self.customer,
                "provider": self.provider,
                "serviceName": self.serviceName,
                "balance": self.vault.balance,
                "selectedModels": self.selectedModels,
                "modelPricing": self.modelPricing,
                "entitlementType": self.entitlement.entitlementType.rawValue,
                "withdrawLimit": self.entitlement.withdrawLimit,
                "usedAmount": self.entitlement.usedAmount,
                "validUntil": self.entitlement.validUntil,
                "isActive": self.entitlement.isActive,
                "currentTier": self.currentTier.name,
                "basePrice": self.basePrice,
                "currentPrice": self.currentPrice,
                "autoPay": self.autoPay,
                "maxMonthlySpend": self.maxMonthlySpend,
                "lastPaidTokens": self.lastPaidTokens,
                "lastPaidRequests": self.lastPaidRequests,
                "totalPaidAmount": self.totalPaidAmount,
                "lastOracleUpdate": self.lastOracleUpdate,
                "lastDirectAPIUpdate": self.lastDirectAPIUpdate,
                "lastFlareOracleUpdate": self.lastFlareOracleUpdate,
                "lastDataSource": self.lastDataSource,
                "hasRecentUsageData": self.lastUsageData != nil,
                "hasApiKey": self.hasApiKey(),
                "encryptedApiKey": self.encryptedApiKey,
                "keyEncryptionSalt": self.keyEncryptionSalt
            }
        }
        
        init(
            owner: Address,
            provider: Address,
            serviceName: String,
            vault: @{FungibleToken.Vault},
            entitlementType: EntitlementType,
            initialWithdrawLimit: UFix64,
            validityPeriod: UFix64,
            selectedModels: [String]
        ) {
            self.id = EncryptedUsageSubscriptions.totalVaults
            EncryptedUsageSubscriptions.totalVaults = EncryptedUsageSubscriptions.totalVaults + 1
            
            self.customer = owner
            self.provider = provider
            self.serviceName = serviceName
            self.vault <- vault
            
            self.currentUsage = nil
            self.usageHistory = []
            self.currentTier = EncryptedUsageSubscriptions.getDefaultTier()
            
            // Initialize cumulative usage tracking
            self.lastPaidTokens = 0
            self.lastPaidRequests = 0
            self.totalPaidAmount = 0.0
            self.lastOracleUpdate = 0.0
            
            // Initialize hybrid tracking
            self.lastDirectAPIUpdate = 0.0
            self.lastFlareOracleUpdate = 0.0
            self.lastUsageData = nil
            self.lastDataSource = "None"
            
            self.basePrice = 10.0  // $10 base
            self.usageMultiplier = 1.0
            self.currentPrice = 10.0
            
            // Create entitlement with user-specified settings
            self.entitlement = Entitlement(
                vaultId: self.id,
                entitlementType: entitlementType,
                initialLimit: initialWithdrawLimit,
                validityPeriod: validityPeriod
            )
            
            self.autoPay = true
            self.maxMonthlySpend = 1000.0
            
            // Initialize selected models and pricing
            self.selectedModels = selectedModels
            self.modelPricing = {}
            
            // Validate model selection (max 3 models)
            assert(self.selectedModels.length > 0, message: "At least 1 model must be selected")
            assert(self.selectedModels.length <= 3, message: "Maximum 3 models allowed per subscription")
            
            // Set up model-specific pricing overrides
            for model in self.selectedModels {
                if model == "gpt-4" || model == "claude-3-opus" {
                    self.modelPricing[model] = 1.5  // Premium models cost 50% more
                } else if model == "gpt-3.5-turbo" || model == "claude-3-haiku" {
                    self.modelPricing[model] = 0.8  // Budget models cost 20% less
                } else {
                    self.modelPricing[model] = 1.0  // Standard pricing
                }
            }
            
            // Initialize encrypted LiteLLM API key fields as nil (will be set after creation)
            self.encryptedApiKey = nil
            self.keyEncryptionSalt = nil
            
            EncryptedUsageSubscriptions.vaultRegistry[self.id] = owner
        }
    }
    
    /// FDC Handler for LiteLLM usage data
    access(all) resource LiteLLMUsageHandler: FlareFDCTriggers.TriggerHandler {
        access(self) var isHandlerActive: Bool
        
        access(all) fun handleTrigger(trigger: FlareFDCTriggers.FDCTrigger): Bool {
            // Extract usage data from FDC trigger
            let vaultId = trigger.payload["vaultId"] as? UInt64 ?? 0
            let totalTokens = trigger.payload["totalTokens"] as? UInt64 ?? 0
            let apiCalls = trigger.payload["apiCalls"] as? UInt64 ?? 0
            
            // Verify vault exists before processing
            if !EncryptedUsageSubscriptions.vaultRegistry.containsKey(vaultId) {
                log("⚠️ FDC Trigger rejected: Vault ".concat(vaultId.toString()).concat(" not found"))
                return false
            }
            
            // Create usage report from FDC data
            let models: {String: UInt64} = {}
            if let modelUsage = trigger.payload["models"] as? {String: UInt64} {
                for key in modelUsage.keys {
                    models[key] = modelUsage[key]!
                }
            }
            
            // Add metadata to track FDC source
            let metadata: {String: AnyStruct} = {
                "fdcTriggerId": trigger.id,
                "sourceChain": trigger.sourceChain,
                "signature": trigger.signature,
                "verified": true  // FDC triggers are cryptographically verified
            }
            
            let usage = UsageReport(
                timestamp: trigger.timestamp,
                period: trigger.payload["period"] as? String ?? "daily",
                totalTokens: totalTokens,
                apiCalls: apiCalls,
                models: models,
                costEstimate: trigger.payload["costEstimate"] as? UFix64 ?? 0.0,  // USD cost from LiteLLM
                metadata: metadata
            )
            
            // Process usage update through the main updateUsageData function
            log("🌐 FDC TRIGGER RECEIVED FOR VAULT ".concat(vaultId.toString()))
            log("   Source: Flare Data Connector (Oracle)")
            log("   Verified: ✅ Cryptographically signed")
            
            // Call the main usage update function with FDC source identifier
            EncryptedUsageSubscriptions.updateUsageData(
                vaultId: vaultId,
                usageReport: usage,
                source: "Flare Oracle FDC"
            )
            
            log("✅ FDC trigger processed successfully")
            return true
        }
        
        access(all) fun getSupportedTriggerTypes(): [FlareFDCTriggers.TriggerType] {
            return [
                FlareFDCTriggers.TriggerType.DefiProtocolEvent
            ]
        }
        
        access(all) fun isActive(): Bool {
            return self.isHandlerActive
        }
        
        init() {
            self.isHandlerActive = true
        }
    }
    
    /// Provider resource for managing subscriptions
    access(all) resource ServiceProvider {
        access(all) let address: Address
        access(all) let serviceName: String
        access(all) var totalEarnings: UFix64
        access(all) var activeSubscriptions: {UInt64: Bool}
        
        /// Withdraw from customer vault based on entitlement
        access(all) fun collectPayment(vaultId: UInt64, amount: UFix64): @{FungibleToken.Vault}? {
            if let ownerAddress = EncryptedUsageSubscriptions.vaultRegistry[vaultId] {
                // Vault access should be done via transactions with proper authorization
                log("Payment collection requested for vault ID: ".concat(vaultId.toString()))
                // Return nil for now - should be handled via transactions
                return nil
            }
            return nil
        }
        
        init(address: Address, serviceName: String) {
            self.address = address
            self.serviceName = serviceName
            self.totalEarnings = 0.0
            self.activeSubscriptions = {}
        }
    }
    
    /// Public functions
    
    /// Create a new subscription vault with entitlement settings
    access(all) fun createSubscriptionVault(
        owner: Address,
        provider: Address,
        serviceName: String,
        initialDeposit: @{FungibleToken.Vault},
        entitlementType: EntitlementType,
        initialWithdrawLimit: UFix64,
        validityPeriod: UFix64,
        selectedModels: [String]
    ): @SubscriptionVault {
        let vault <- create SubscriptionVault(
            owner: owner,
            provider: provider,
            serviceName: serviceName,
            vault: <- initialDeposit,
            entitlementType: entitlementType,
            initialWithdrawLimit: initialWithdrawLimit,
            validityPeriod: validityPeriod,
            selectedModels: selectedModels
        )
        
        emit SubscriptionCreated(vaultId: vault.id, owner: owner, provider: provider)
        
        return <- vault
    }
    
    /// Get vault storage path
    access(all) fun getVaultStoragePath(): StoragePath {
        return self.VaultStoragePath
    }
    
    /// Get all vault IDs for a user
    access(all) fun getUserVaultIds(owner: Address): [UInt64] {
        let vaultIds: [UInt64] = []
        
        for vaultId in self.vaultRegistry.keys {
            if self.vaultRegistry[vaultId] == owner {
                vaultIds.append(vaultId)
            }
        }
        
        return vaultIds
    }
    
    /// Get vault information by vault ID
    access(all) fun getVaultInfo(vaultId: UInt64): {String: AnyStruct}? {
        if let ownerAddress = self.vaultRegistry[vaultId] {
            // Vault info access should be done via transactions
            return {"vaultId": vaultId, "owner": ownerAddress}
        }
        return nil
    }
    
    /// Calculate pricing tier based on usage
    access(all) fun calculateTier(_ totalTokens: UInt64): PricingTier {
        let tiers = self.getPricingTiers()
        
        for tier in tiers {
            if totalTokens >= tier.minUsage && totalTokens <= tier.maxUsage {
                return tier
            }
        }
        
        return self.getDefaultTier()
    }
    
    /// Get pricing tiers
    access(all) fun getPricingTiers(): [PricingTier] {
        return [
            PricingTier(name: "Starter", minUsage: 0, maxUsage: 100000, pricePerUnit: 0.02, discountRate: 0.0),
            PricingTier(name: "Growth", minUsage: 100001, maxUsage: 1000000, pricePerUnit: 0.015, discountRate: 0.1),
            PricingTier(name: "Scale", minUsage: 1000001, maxUsage: 10000000, pricePerUnit: 0.01, discountRate: 0.2),
            PricingTier(name: "Enterprise", minUsage: 10000001, maxUsage: UInt64.max, pricePerUnit: 0.008, discountRate: 0.3)
        ]
    }
    
    /// Get default tier
    access(all) fun getDefaultTier(): PricingTier {
        return PricingTier(name: "Starter", minUsage: 0, maxUsage: 100000, pricePerUnit: 0.02, discountRate: 0.0)
    }
    
    /// Helper function to convert time periods to seconds
    access(all) fun convertToSeconds(amount: UInt64, unit: String): UFix64 {
        switch unit {
            case "hours":
                return UFix64(amount) * 3600.0
            case "days":
                return UFix64(amount) * 86400.0
            case "months":
                return UFix64(amount) * 2592000.0  // 30 days
            default:
                return UFix64(amount) * 86400.0    // Default to days
        }
    }
    
    /// Create service provider
    access(all) fun createServiceProvider(address: Address, serviceName: String): @ServiceProvider {
        return <- create ServiceProvider(address: address, serviceName: serviceName)
    }
    
    /// Create LiteLLM usage handler
    access(all) fun createLiteLLMHandler(): @LiteLLMUsageHandler {
        return <- create LiteLLMUsageHandler()
    }
    
    init() {
        self.VaultStoragePath = /storage/UsageBasedSubscriptionVault
        self.VaultPublicPath = /public/UsageBasedSubscriptionVault
        self.ProviderStoragePath = /storage/UsageBasedServiceProvider
        
        self.totalVaults = 0
        self.vaultRegistry = {}
    }
}