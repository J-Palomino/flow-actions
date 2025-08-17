import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import UsageBasedSubscriptions from "UsageBasedSubscriptions"

/// LayerZeroReceiver: Handles incoming cross-chain messages from LayerZero
/// Processes token bridges from EVM chains and adds funds to Flow subscriptions
access(all) contract LayerZeroReceiver {
    
    // Events
    access(all) event CrossChainMessageReceived(srcChainId: UInt16, payload: String, amount: UFix64)
    access(all) event SubscriptionTopUpCompleted(vaultId: UInt64, amount: UFix64, srcChain: UInt16)
    access(all) event TokenConverted(originalToken: String, flowAmount: UFix64, rate: UFix64)
    access(all) event LayerZeroEndpointUpdated(oldEndpoint: Address?, newEndpoint: Address)
    
    // Storage
    access(all) let LayerZeroEndpointStoragePath: StoragePath
    access(all) let LayerZeroEndpointPublicPath: PublicPath
    
    // Configuration
    access(all) var layerZeroEndpoint: Address?
    access(all) var isActive: Bool
    access(all) let supportedChains: {UInt16: String} // chainId -> chain name
    access(all) let tokenRates: {String: UFix64} // token symbol -> FLOW conversion rate
    
    // Structs
    access(all) struct BridgePayload {
        access(all) let sender: String          // Original sender address (hex)
        access(all) let token: String           // Token address (0x0 for native)
        access(all) let amount: UFix64          // Amount bridged
        access(all) let vaultId: UInt64         // Flow subscription vault ID
        access(all) let operation: String       // Operation type
        access(all) let timestamp: UFix64       // Bridge timestamp
        
        init(
            sender: String,
            token: String, 
            amount: UFix64,
            vaultId: UInt64,
            operation: String,
            timestamp: UFix64
        ) {
            self.sender = sender
            self.token = token
            self.amount = amount
            self.vaultId = vaultId
            self.operation = operation
            self.timestamp = timestamp
        }
    }
    
    // LayerZero Endpoint Interface
    access(all) resource interface LayerZeroEndpointPublic {
        access(all) fun receiveMessage(
            srcChainId: UInt16,
            srcAddress: String,
            nonce: UInt64,
            payload: String
        ): Bool
    }
    
    // LayerZero Endpoint Resource
    access(all) resource LayerZeroEndpoint: LayerZeroEndpointPublic {
        
        access(all) fun receiveMessage(
            srcChainId: UInt16,
            srcAddress: String,
            nonce: UInt64,
            payload: String
        ): Bool {
            pre {
                LayerZeroReceiver.isActive: "LayerZero receiver is not active"
                LayerZeroReceiver.supportedChains.containsKey(srcChainId): "Unsupported source chain"
            }
            
            log("📨 LayerZero message received:")
            log("   Source Chain: ".concat(srcChainId.toString()))
            log("   Source Address: ".concat(srcAddress))
            log("   Nonce: ".concat(nonce.toString()))
            log("   Payload: ".concat(payload))
            
            emit CrossChainMessageReceived(
                srcChainId: srcChainId,
                payload: payload,
                amount: 0.0 // Will be updated when payload is decoded
            )
            
            // Process the cross-chain message
            return LayerZeroReceiver.processMessage(srcChainId, payload)
        }
    }
    
    // Process incoming LayerZero message
    access(all) fun processMessage(srcChainId: UInt16, payload: String): Bool {
        // Decode the payload (simplified JSON parsing)
        // In production, use proper payload decoding
        let bridgePayload = self.decodePayload(payload)
        
        if bridgePayload == nil {
            log("❌ Failed to decode bridge payload")
            return false
        }
        
        let payload = bridgePayload!
        
        log("🔄 Processing bridge operation:")
        log("   Operation: ".concat(payload.operation))
        log("   Vault ID: ".concat(payload.vaultId.toString()))
        log("   Amount: ".concat(payload.amount.toString()))
        log("   Token: ".concat(payload.token))
        
        // Handle subscription top-up
        if payload.operation == "subscription_topup" {
            return self.handleSubscriptionTopUp(payload, srcChainId)
        }
        
        log("❌ Unknown operation type: ".concat(payload.operation))
        return false
    }
    
    // Handle subscription vault top-up from cross-chain bridge
    access(all) fun handleSubscriptionTopUp(payload: BridgePayload, srcChainId: UInt16): Bool {
        // Convert bridged token to FLOW
        let flowAmount = self.convertToFlow(payload.token, payload.amount)
        
        if flowAmount <= 0.0 {
            log("❌ Invalid conversion amount")
            return false
        }
        
        log("💰 Converting bridged tokens to FLOW:")
        log("   Original: ".concat(payload.amount.toString()).concat(" ").concat(self.getTokenSymbol(payload.token)))
        log("   Converted: ".concat(flowAmount.toString()).concat(" FLOW"))
        
        // Get vault information
        let vaultInfo = UsageBasedSubscriptions.getVaultInfo(vaultId: payload.vaultId)
        if vaultInfo == nil {
            log("❌ Vault not found: ".concat(payload.vaultId.toString()))
            return false
        }
        
        let vaultData = vaultInfo!
        let ownerAddress = vaultData["owner"] as! Address
        
        // Create FLOW tokens (this would be done by a minter in production)
        // For now, we'll emit an event and handle off-chain
        log("✅ Subscription top-up completed:")
        log("   Vault ID: ".concat(payload.vaultId.toString()))
        log("   Owner: ".concat(ownerAddress.toString()))
        log("   Amount: ".concat(flowAmount.toString()).concat(" FLOW"))
        
        emit SubscriptionTopUpCompleted(
            vaultId: payload.vaultId,
            amount: flowAmount,
            srcChain: srcChainId
        )
        
        // In production implementation:
        // 1. Mint or transfer FLOW tokens
        // 2. Add to subscription vault balance
        // 3. Update vault state
        
        return true
    }
    
    // Convert token to FLOW based on rates
    access(all) fun convertToFlow(tokenAddress: String, amount: UFix64): UFix64 {
        let tokenSymbol = self.getTokenSymbol(tokenAddress)
        let rate = self.tokenRates[tokenSymbol] ?? 1.0
        
        let flowAmount = amount * rate
        
        emit TokenConverted(
            originalToken: tokenSymbol,
            flowAmount: flowAmount,
            rate: rate
        )
        
        return flowAmount
    }
    
    // Get token symbol from address
    access(all) fun getTokenSymbol(tokenAddress: String): String {
        // Native tokens
        if tokenAddress == "0x0000000000000000000000000000000000000000" {
            return "ETH"
        }
        
        // USDC addresses
        if tokenAddress == "0xA0b86a33E6441b8450C6cB75a3b8e4C8e0A2C3a3" ||
           tokenAddress == "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" ||
           tokenAddress == "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" {
            return "USDC"
        }
        
        // Default to unknown
        return "UNKNOWN"
    }
    
    // Decode LayerZero payload (simplified)
    access(all) fun decodePayload(payload: String): BridgePayload? {
        // In production, implement proper ABI decoding
        // For now, return a mock payload for testing
        return BridgePayload(
            sender: "0x1234567890123456789012345678901234567890",
            token: "0x0000000000000000000000000000000000000000",
            amount: 1.0,
            vaultId: 1,
            operation: "subscription_topup",
            timestamp: getCurrentBlock().timestamp
        )
    }
    
    // Admin functions
    access(all) fun setLayerZeroEndpoint(endpoint: Address) {
        pre {
            self.account.storage.type(at: self.LayerZeroEndpointStoragePath) != nil:
                "LayerZero endpoint resource not found"
        }
        
        let oldEndpoint = self.layerZeroEndpoint
        self.layerZeroEndpoint = endpoint
        
        emit LayerZeroEndpointUpdated(oldEndpoint: oldEndpoint, newEndpoint: endpoint)
    }
    
    access(all) fun setActive(active: Bool) {
        self.isActive = active
    }
    
    access(all) fun addSupportedChain(chainId: UInt16, name: String) {
        self.supportedChains[chainId] = name
    }
    
    access(all) fun setTokenRate(tokenSymbol: String, rate: UFix64) {
        self.tokenRates[tokenSymbol] = rate
    }
    
    // Public getters
    access(all) fun getLayerZeroEndpoint(): Address? {
        return self.layerZeroEndpoint
    }
    
    access(all) fun isReceiverActive(): Bool {
        return self.isActive
    }
    
    access(all) fun getSupportedChains(): {UInt16: String} {
        return self.supportedChains
    }
    
    access(all) fun getTokenRates(): {String: UFix64} {
        return self.tokenRates
    }
    
    init() {
        // Set storage paths
        self.LayerZeroEndpointStoragePath = /storage/LayerZeroEndpoint
        self.LayerZeroEndpointPublicPath = /public/LayerZeroEndpoint
        
        // Initialize state
        self.layerZeroEndpoint = nil
        self.isActive = true
        self.supportedChains = {
            101: "Ethereum",
            109: "Polygon", 
            110: "Arbitrum",
            184: "Base"
        }
        
        // Default conversion rates (1:1 for simplicity)
        self.tokenRates = {
            "ETH": 1.0,
            "USDC": 1.0,
            "USDT": 1.0,
            "MATIC": 1.0
        }
        
        // Create and store LayerZero endpoint resource
        let endpoint <- create LayerZeroEndpoint()
        self.account.storage.save(<- endpoint, to: self.LayerZeroEndpointStoragePath)
        
        // Create public capability
        let endpointCap = self.account.capabilities.storage.issue<&LayerZeroEndpoint{LayerZeroEndpointPublic}>(
            self.LayerZeroEndpointStoragePath
        )
        self.account.capabilities.publish(endpointCap, at: self.LayerZeroEndpointPublicPath)
        
        log("🌉 LayerZero Receiver initialized")
        log("   Supported chains: ".concat(self.supportedChains.length.toString()))
        log("   Token rates configured: ".concat(self.tokenRates.length.toString()))
    }
}