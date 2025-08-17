import "FungibleToken"
import "FlowToken"
import "FlowEVMBridge"
import "CrossVMToken"
import "DeFiActions"

/// SubscriptionVaults: EVM-funded subscription management system
/// Users fund vaults from EVM accounts, Cadence controls automated payouts
access(all) contract SubscriptionVaults {
    
    /// Events
    access(all) event VaultCreated(owner: Address, evmAddress: String)
    access(all) event FundsReceived(owner: Address, amount: UFix64, token: String, fromEVM: Bool)
    access(all) event SubscriptionCreated(vaultID: UInt64, serviceProvider: Address, plan: String)
    access(all) event PaymentProcessed(vaultID: UInt64, recipient: Address, amount: UFix64, reason: String)
    access(all) event PaymentFailed(vaultID: UInt64, recipient: Address, amount: UFix64, reason: String)
    
    /// Storage paths
    access(all) let VaultStoragePath: StoragePath
    access(all) let VaultPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath
    
    /// Global state
    access(all) var totalVaults: UInt64
    access(all) let supportedTokens: {String: Type}
    
    /// Subscription plan structure
    access(all) struct SubscriptionPlan {
        access(all) let serviceProvider: Address
        access(all) let planName: String
        access(all) let amount: UFix64
        access(all) let tokenType: String
        access(all) let interval: UFix64 // seconds between payments
        access(all) let maxPayments: UInt64? // nil for unlimited
        access(all) var paymentsProcessed: UInt64
        access(all) var lastPayment: UFix64
        access(all) var isActive: Bool
        
        init(
            serviceProvider: Address,
            planName: String,
            amount: UFix64,
            tokenType: String,
            interval: UFix64,
            maxPayments: UInt64?
        ) {
            self.serviceProvider = serviceProvider
            self.planName = planName
            self.amount = amount
            self.tokenType = tokenType
            self.interval = interval
            self.maxPayments = maxPayments
            self.paymentsProcessed = 0
            self.lastPayment = 0.0
            self.isActive = true
        }
        
        access(all) fun isDue(): Bool {
            if !self.isActive { return false }
            if let max = self.maxPayments {
                if self.paymentsProcessed >= max { return false }
            }
            return getCurrentBlock().timestamp >= (self.lastPayment + self.interval)
        }
        
        access(contract) fun recordPayment() {
            self.paymentsProcessed = self.paymentsProcessed + 1
            self.lastPayment = getCurrentBlock().timestamp
            
            if let max = self.maxPayments {
                if self.paymentsProcessed >= max {
                    self.isActive = false
                }
            }
        }
    }
    
    /// User's subscription vault resource
    access(all) resource SubscriptionVault {
        access(all) let id: UInt64
        access(all) let ownerAddress: Address
        access(all) let evmAddress: String
        access(self) let vaults: @{String: {FungibleToken.Vault}}
        access(self) let subscriptions: {String: SubscriptionPlan}
        access(self) let authorizedPayees: {Address: UFix64} // max amounts per payee
        
        init(owner: Address, evmAddress: String) {
            self.id = SubscriptionVaults.totalVaults
            self.ownerAddress = owner
            self.evmAddress = evmAddress
            self.vaults <- {}
            self.subscriptions = {}
            self.authorizedPayees = {}
            
            SubscriptionVaults.totalVaults = SubscriptionVaults.totalVaults + 1
        }
        
        /// Get balance for a specific token
        access(all) view fun getBalance(tokenType: String): UFix64 {
            if let vault = &self.vaults[tokenType] as &{FungibleToken.Vault}? {
                return vault.balance
            }
            return 0.0
        }
        
        /// Get all balances
        access(all) view fun getAllBalances(): {String: UFix64} {
            let balances: {String: UFix64} = {}
            for tokenType in self.vaults.keys {
                balances[tokenType] = self.getBalance(tokenType: tokenType)
            }
            return balances
        }
        
        /// Deposit funds from EVM bridge
        access(all) fun depositFromBridge(vault: @{FungibleToken.Vault}) {
            let tokenType = vault.getType().identifier
            let amount = vault.balance
            
            if let existingVault = &self.vaults[tokenType] as &{FungibleToken.Vault}? {
                existingVault.deposit(from: <-vault)
            } else {
                self.vaults[tokenType] <-! vault
            }
            
            emit FundsReceived(
                owner: self.ownerAddress,
                amount: amount,
                token: tokenType,
                fromEVM: true
            )
        }
        
        /// Deposit funds directly (non-EVM)
        access(all) fun deposit(vault: @{FungibleToken.Vault}) {
            let tokenType = vault.getType().identifier
            let amount = vault.balance
            
            if let existingVault = &self.vaults[tokenType] as &{FungibleToken.Vault}? {
                existingVault.deposit(from: <-vault)
            } else {
                self.vaults[tokenType] <-! vault
            }
            
            emit FundsReceived(
                owner: self.ownerAddress,
                amount: amount,
                token: tokenType,
                fromEVM: false
            )
        }
        
        /// Create a subscription plan
        access(all) fun createSubscription(
            subscriptionID: String,
            serviceProvider: Address,
            planName: String,
            amount: UFix64,
            tokenType: String,
            interval: UFix64,
            maxPayments: UInt64?
        ) {
            pre {
                self.subscriptions[subscriptionID] == nil: "Subscription ID already exists"
                SubscriptionVaults.supportedTokens[tokenType] != nil: "Token type not supported"
                self.getBalance(tokenType: tokenType) >= amount: "Insufficient balance for first payment"
            }
            
            let plan = SubscriptionPlan(
                serviceProvider: serviceProvider,
                planName: planName,
                amount: amount,
                tokenType: tokenType,
                interval: interval,
                maxPayments: maxPayments
            )
            
            self.subscriptions[subscriptionID] = plan
            
            emit SubscriptionCreated(
                vaultID: self.id,
                serviceProvider: serviceProvider,
                plan: planName
            )
        }
        
        /// Process due payments for all subscriptions
        access(all) fun processDuePayments() {
            for subscriptionID in self.subscriptions.keys {
                self.processSubscriptionPayment(subscriptionID: subscriptionID)
            }
        }
        
        /// Process payment for a specific subscription
        access(all) fun processSubscriptionPayment(subscriptionID: String) {
            if let subscription = &self.subscriptions[subscriptionID] as &SubscriptionPlan? {
                if !subscription.isDue() {
                    return
                }
            
            let amount = subscription.amount
            let tokenType = subscription.tokenType
            let recipient = subscription.serviceProvider
            
            // Check if we have sufficient balance
            if self.getBalance(tokenType: tokenType) < amount {
                emit PaymentFailed(
                    vaultID: self.id,
                    recipient: recipient,
                    amount: amount,
                    reason: "Insufficient balance"
                )
                return
            }
            
            // Check authorization limits
            if let maxAmount = self.authorizedPayees[recipient] {
                if amount > maxAmount {
                    emit PaymentFailed(
                        vaultID: self.id,
                        recipient: recipient,
                        amount: amount,
                        reason: "Amount exceeds authorization limit"
                    )
                    return
                }
            }
            
            // Execute payment
            if let vault = &self.vaults[tokenType] as auth(FungibleToken.Withdraw) &{FungibleToken.Vault}? {
                let payment <- vault.withdraw(amount: amount)
                
                // Get recipient's capability
                let recipientAccount = getAccount(recipient)
                let receiverCap = recipientAccount.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                
                if let receiver = receiverCap.borrow() {
                    receiver.deposit(from: <-payment)
                    subscription.recordPayment()
                    
                    emit PaymentProcessed(
                        vaultID: self.id,
                        recipient: recipient,
                        amount: amount,
                        reason: "Subscription: ".concat(subscription.planName)
                    )
                } else {
                    // Return payment if recipient can't receive
                    vault.deposit(from: <-payment)
                    emit PaymentFailed(
                        vaultID: self.id,
                        recipient: recipient,
                        amount: amount,
                        reason: "Recipient cannot receive tokens"
                    )
                }
            }
            } // Close the if let subscription statement
        }
        
        /// Authorize a payee with maximum amount
        access(all) fun authorizePayee(payee: Address, maxAmount: UFix64) {
            self.authorizedPayees[payee] = maxAmount
        }
        
        /// Cancel a subscription
        access(all) fun cancelSubscription(subscriptionID: String) {
            if self.subscriptions.containsKey(subscriptionID) {
                let oldPlan = self.subscriptions[subscriptionID]!
                let cancelledPlan = SubscriptionPlan(
                    serviceProvider: oldPlan.serviceProvider,
                    planName: oldPlan.planName,
                    amount: oldPlan.amount,
                    tokenType: oldPlan.tokenType,
                    interval: oldPlan.interval,
                    maxPayments: oldPlan.maxPayments,
                    paymentsProcessed: oldPlan.paymentsProcessed,
                    lastPayment: oldPlan.lastPayment,
                    isActive: false
                )
                self.subscriptions[subscriptionID] = cancelledPlan
            }
        }
        
        /// Get subscription details
        access(all) view fun getSubscription(subscriptionID: String): SubscriptionPlan? {
            return self.subscriptions[subscriptionID]
        }
        
        /// Get all subscriptions
        access(all) view fun getAllSubscriptions(): {String: SubscriptionPlan} {
            return self.subscriptions
        }
        
        /// Emergency withdraw (owner only)
        access(all) fun emergencyWithdraw(tokenType: String, amount: UFix64): @{FungibleToken.Vault} {
            pre {
                self.vaults[tokenType] != nil: "Token vault not found"
            }
            
            let vault = &self.vaults[tokenType] as auth(FungibleToken.Withdraw) &{FungibleToken.Vault}?
                ?? panic("Could not borrow vault reference")
            
            return <- vault.withdraw(amount: amount)
        }
        
    }
    
    /// Public interface for vault access
    access(all) resource interface VaultPublic {
        access(all) view fun getBalance(tokenType: String): UFix64
        access(all) view fun getAllBalances(): {String: UFix64}
        access(all) view fun getSubscription(subscriptionID: String): SubscriptionPlan?
        access(all) view fun getAllSubscriptions(): {String: SubscriptionPlan}
        access(all) fun depositFromBridge(vault: @{FungibleToken.Vault})
        access(all) fun deposit(vault: @{FungibleToken.Vault})
    }
    
    /// Create a new subscription vault
    access(all) fun createVault(owner: Address, evmAddress: String): @SubscriptionVault {
        let vault <- create SubscriptionVault(owner: owner, evmAddress: evmAddress)
        
        emit VaultCreated(owner: owner, evmAddress: evmAddress)
        
        return <- vault
    }
    
    /// Process payments for all vaults (called by automation)
    access(all) fun processAllDuePayments() {
        // This would be called by a scheduled transaction or external automation
        // For now, it's a placeholder for the automation system
    }
    
    /// Admin functions
    access(all) resource Admin {
        access(all) fun addSupportedToken(identifier: String, type: Type) {
            SubscriptionVaults.supportedTokens[identifier] = type
        }
        
        access(all) fun removeSupportedToken(identifier: String) {
            SubscriptionVaults.supportedTokens.remove(key: identifier)
        }
    }
    
    init() {
        self.VaultStoragePath = /storage/subscriptionVault
        self.VaultPublicPath = /public/subscriptionVault
        self.AdminStoragePath = /storage/subscriptionVaultAdmin
        
        self.totalVaults = 0
        self.supportedTokens = {}
        
        // Add default supported tokens
        self.supportedTokens["A.0ae53cb6e3f42a79.FlowToken.Vault"] = Type<@FlowToken.Vault>()
        
        // Create admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }
}