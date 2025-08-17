import "FungibleToken"
import "FlowEVMBridge"
import "FlowEVMBridgeTokenEscrow"
import "CrossVMToken"
import "SubscriptionVaults"
import "DeFiActions"

/// EVMBridgeMonitor: Automatically detects EVM bridge deposits and credits subscription vaults
/// Integrates with FlowEVMBridge to provide seamless EVM → Flow funding experience
access(all) contract EVMBridgeMonitor {
    
    /// Events
    access(all) event BridgeDepositDetected(
        evmAddress: String,
        flowAddress: Address?,
        amount: UFix64,
        tokenType: String,
        bridgeTxHash: String
    )
    
    access(all) event VaultCredited(
        vaultOwner: Address,
        evmAddress: String,
        amount: UFix64,
        tokenType: String
    )
    
    access(all) event VaultCreatedForEVMUser(
        evmAddress: String,
        flowAddress: Address,
        vaultID: UInt64
    )
    
    /// Storage paths
    access(all) let MonitorStoragePath: StoragePath
    access(all) let MonitorPublicPath: PublicPath
    
    /// Global registry mapping EVM addresses to Flow addresses
    access(all) let evmToFlowRegistry: {String: Address}
    access(all) let flowToEvmRegistry: {Address: String}
    
    /// Bridge transaction tracking
    access(all) let processedBridgeTxs: {String: Bool}
    
    /// Supported token mappings (EVM → Flow)
    access(all) let tokenMappings: {String: String}
    
    /// Bridge monitor resource
    access(all) resource BridgeMonitor {
        
        /// Register EVM address with Flow account
        access(all) fun registerEVMAddress(evmAddress: String, flowAddress: Address) {
            pre {
                evmAddress.length == 42: "Invalid EVM address format"
                evmAddress.slice(from: 0, upTo: 2) == "0x": "EVM address must start with 0x"
            }
            
            EVMBridgeMonitor.evmToFlowRegistry[evmAddress] = flowAddress
            EVMBridgeMonitor.flowToEvmRegistry[flowAddress] = evmAddress
        }
        
        /// Process bridge deposit and credit subscription vault
        access(all) fun processBridgeDeposit(
            evmAddress: String,
            amount: UFix64,
            tokenContractAddress: String,
            bridgeTxHash: String
        ) {
            pre {
                EVMBridgeMonitor.processedBridgeTxs[bridgeTxHash] == nil: "Bridge transaction already processed"
            }
            
            // Mark transaction as processed
            EVMBridgeMonitor.processedBridgeTxs[bridgeTxHash] = true
            
            // Map EVM token to Flow token type
            let flowTokenType = EVMBridgeMonitor.tokenMappings[tokenContractAddress]
                ?? "A.0ae53cb6e3f42a79.FlowToken.Vault" // Default to FLOW
            
            emit BridgeDepositDetected(
                evmAddress: evmAddress,
                flowAddress: EVMBridgeMonitor.evmToFlowRegistry[evmAddress],
                amount: amount,
                tokenType: flowTokenType,
                bridgeTxHash: bridgeTxHash
            )
            
            // Get or create Flow account for EVM user
            let flowAddress = self.getOrCreateFlowAccount(evmAddress: evmAddress)
            
            // Get or create subscription vault
            let vaultRef = self.getOrCreateSubscriptionVault(
                flowAddress: flowAddress,
                evmAddress: evmAddress
            )
            
            // Create bridged tokens and credit vault
            self.creditVaultFromBridge(
                vaultRef: vaultRef,
                amount: amount,
                tokenType: flowTokenType,
                evmAddress: evmAddress
            )
        }
        
        /// Get existing Flow account or create mapping for EVM user
        access(all) fun getOrCreateFlowAccount(evmAddress: String): Address {
            // Check if EVM address is already registered
            if let existingFlowAddress = EVMBridgeMonitor.evmToFlowRegistry[evmAddress] {
                return existingFlowAddress
            }
            
            // For demo purposes, we'll use a derived address
            // In production, this would integrate with proper account creation
            let derivedAddress = self.deriveFlowAddress(evmAddress: evmAddress)
            
            // Register the mapping
            self.registerEVMAddress(evmAddress: evmAddress, flowAddress: derivedAddress)
            
            return derivedAddress
        }
        
        /// Get or create subscription vault for user
        access(all) fun getOrCreateSubscriptionVault(
            flowAddress: Address,
            evmAddress: String
        ): &SubscriptionVaults.SubscriptionVault {
            let account = getAccount(flowAddress)
            
            // Try to borrow existing vault
            if let vaultRef = account.capabilities
                .get<&SubscriptionVaults.SubscriptionVault>(SubscriptionVaults.VaultPublicPath)
                .borrow() {
                return vaultRef
            }
            
            // Vault doesn't exist, we need to create one
            // For demo, we'll assume the account exists and can receive the vault
            // In production, this would require proper account setup
            
            panic("Subscription vault not found and cannot be created automatically. User must setup vault first.")
        }
        
        /// Credit subscription vault with bridged tokens
        access(all) fun creditVaultFromBridge(
            vaultRef: &SubscriptionVaults.SubscriptionVault,
            amount: UFix64,
            tokenType: String,
            evmAddress: String
        ) {
            // For demo, create mock bridged tokens
            // In production, this would integrate with actual FlowEVMBridge
            
            if tokenType == "A.0ae53cb6e3f42a79.FlowToken.Vault" {
                // Create FLOW tokens (mock bridged)
                let serviceAccount = getAccount(0xf8d6e0586b0a20c7)
                let flowVaultRef = serviceAccount.storage
                    .borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow Flow vault")
                
                let bridgedTokens <- flowVaultRef.withdraw(amount: amount)
                vaultRef.depositFromBridge(vault: <-bridgedTokens)
                
                emit VaultCredited(
                    vaultOwner: vaultRef.owner,
                    evmAddress: evmAddress,
                    amount: amount,
                    tokenType: tokenType
                )
            }
        }
        
        /// Derive Flow address from EVM address (simplified for demo)
        access(all) fun deriveFlowAddress(evmAddress: String): Address {
            // In production, this would use proper address derivation
            // For demo, we'll use the service account
            return 0xf8d6e0586b0a20c7
        }
        
        /// Monitor bridge events and auto-process (called by automation)
        access(all) fun monitorAndProcessBridgeEvents() {
            // This would listen for FlowEVMBridge events and automatically process them
            // For demo purposes, this is a placeholder for the automation system
        }
    }
    
    /// Public interface for bridge monitoring
    access(all) resource interface BridgeMonitorPublic {
        access(all) fun processBridgeDeposit(
            evmAddress: String,
            amount: UFix64,
            tokenContractAddress: String,
            bridgeTxHash: String
        )
    }
    
    /// Create bridge monitor capability
    access(all) fun createBridgeMonitor(): @BridgeMonitor {
        return <- create BridgeMonitor()
    }
    
    /// Get EVM address for Flow account
    access(all) view fun getEVMAddress(flowAddress: Address): String? {
        return self.flowToEvmRegistry[flowAddress]
    }
    
    /// Get Flow address for EVM account
    access(all) view fun getFlowAddress(evmAddress: String): Address? {
        return self.evmToFlowRegistry[evmAddress]
    }
    
    /// Check if bridge transaction was processed
    access(all) view fun isBridgeTxProcessed(bridgeTxHash: String): Bool {
        return self.processedBridgeTxs[bridgeTxHash] ?? false
    }
    
    /// Admin functions
    access(all) resource Admin {
        access(all) fun addTokenMapping(evmTokenAddress: String, flowTokenType: String) {
            EVMBridgeMonitor.tokenMappings[evmTokenAddress] = flowTokenType
        }
        
        access(all) fun removeTokenMapping(evmTokenAddress: String) {
            EVMBridgeMonitor.tokenMappings.remove(key: evmTokenAddress)
        }
    }
    
    init() {
        self.MonitorStoragePath = /storage/evmBridgeMonitor
        self.MonitorPublicPath = /public/evmBridgeMonitor
        
        self.evmToFlowRegistry = {}
        self.flowToEvmRegistry = {}
        self.processedBridgeTxs = {}
        self.tokenMappings = {}
        
        // Add default token mappings
        // USDC on Ethereum
        self.tokenMappings["0xA0b86a33E6441d7d0b21b2f7c9e00B42F0E2D1B"] = "A.0ae53cb6e3f42a79.FlowToken.Vault"
        // WETH on Ethereum  
        self.tokenMappings["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"] = "A.0ae53cb6e3f42a79.FlowToken.Vault"
        
        // Create admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: /storage/evmBridgeMonitorAdmin)
        
        // Create and store bridge monitor
        let monitor <- create BridgeMonitor()
        self.account.storage.save(<-monitor, to: self.MonitorStoragePath)
        
        // Create public capability
        let monitorCap = self.account.capabilities.storage.issue<&BridgeMonitor>(self.MonitorStoragePath)
        self.account.capabilities.publish(monitorCap, at: self.MonitorPublicPath)
    }
}