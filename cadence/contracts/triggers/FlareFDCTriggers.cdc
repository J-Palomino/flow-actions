import "DeFiActions"
import "DeFiActionsUtils"

/// FlareFDCTriggers: Interface for receiving and processing Flare Data Connector triggers
/// Integrates with Flow Actions to execute cross-chain DeFi operations
access(all) contract FlareFDCTriggers {
    
    /// Events
    access(all) event FDCTriggerReceived(
        triggerType: String,
        sourceChain: String,
        payloadKeys: [String],
        timestamp: UFix64
    )
    
    access(all) event CrossChainActionTriggered(
        actionId: String,
        targetChain: String,
        actionType: String,
        parameterKeys: [String]
    )
    
    /// Trigger Types supported by FDC
    access(all) enum TriggerType: UInt8 {
        access(all) case PriceThreshold     // Price crosses threshold
        access(all) case VolumeSpike        // Trading volume spike detected
        access(all) case LiquidityChange    // Liquidity pool changes
        access(all) case GovernanceVote     // Governance proposal state change
        access(all) case BridgeEvent        // Cross-chain bridge activity
        access(all) case DefiProtocolEvent  // DeFi protocol state change
    }
    
    /// Cross-chain target networks
    access(all) enum TargetChain: UInt8 {
        access(all) case Ethereum
        access(all) case BinanceSmartChain
        access(all) case Polygon
        access(all) case Arbitrum
        access(all) case Optimism
        access(all) case Avalanche
    }
    
    /// FDC Trigger data structure
    access(all) struct FDCTrigger {
        access(all) let id: String
        access(all) let triggerType: TriggerType
        access(all) let sourceChain: String
        access(all) let targetChain: TargetChain
        access(all) let payload: {String: AnyStruct}
        access(all) let timestamp: UFix64
        access(all) let signature: String  // FDC signature verification
        
        init(
            id: String,
            triggerType: TriggerType,
            sourceChain: String,
            targetChain: TargetChain,
            payload: {String: AnyStruct},
            timestamp: UFix64,
            signature: String
        ) {
            self.id = id
            self.triggerType = triggerType
            self.sourceChain = sourceChain
            self.targetChain = targetChain
            self.payload = payload
            self.timestamp = timestamp
            self.signature = signature
        }
    }
    
    /// Interface for FDC trigger handlers
    access(all) resource interface TriggerHandler {
        access(all) fun handleTrigger(trigger: FDCTrigger): Bool
        access(all) fun getSupportedTriggerTypes(): [TriggerType]
        access(all) fun isActive(): Bool
    }
    
    /// Registry for trigger handlers
    access(all) resource TriggerRegistry {
        access(self) var handlers: {String: Capability<&{TriggerHandler}>}
        access(self) var typeMapping: {TriggerType: [String]}
        
        /// Register a new trigger handler
        access(all) fun registerHandler(
            handlerId: String,
            handler: Capability<&{TriggerHandler}>,
            triggerTypes: [TriggerType]
        ) {
            pre {
                handler.check(): "Invalid handler capability"
            }
            
            self.handlers[handlerId] = handler
            
            for triggerType in triggerTypes {
                if self.typeMapping[triggerType] == nil {
                    self.typeMapping[triggerType] = []
                }
                self.typeMapping[triggerType]!.append(handlerId)
            }
        }
        
        /// Process incoming FDC trigger
        access(all) fun processTrigger(trigger: FDCTrigger): Bool {
            // Verify FDC signature
            if !self.verifyFDCSignature(trigger) {
                return false
            }
            
            // Get handlers for this trigger type
            let handlerIds = self.typeMapping[trigger.triggerType] ?? []
            var processed = false
            
            for handlerId in handlerIds {
                if let handler = self.handlers[handlerId] {
                    if let handlerRef = handler.borrow() {
                        if handlerRef.isActive() {
                            let result = handlerRef.handleTrigger(trigger: trigger)
                            processed = processed || result
                        }
                    }
                }
            }
            
            emit FDCTriggerReceived(
                triggerType: trigger.triggerType.rawValue.toString(),
                sourceChain: trigger.sourceChain,
                payloadKeys: trigger.payload.keys,
                timestamp: trigger.timestamp
            )
            
            return processed
        }
        
        /// Verify FDC signature (simplified - real implementation would use cryptographic verification)
        access(self) fun verifyFDCSignature(_ trigger: FDCTrigger): Bool {
            // TODO: Implement proper FDC signature verification
            // This would validate the trigger came from authentic Flare FDC
            return trigger.signature.length > 0
        }
        
        init() {
            self.handlers = {}
            self.typeMapping = {}
        }
    }
    
    /// Global trigger registry
    access(all) let registry: @TriggerRegistry
    
    /// Public interface for external trigger submission
    access(all) fun submitFDCTrigger(trigger: FDCTrigger): Bool {
        return self.registry.processTrigger(trigger: trigger)
    }
    
    /// Get registry reference for handler registration
    access(all) fun getRegistryRef(): &TriggerRegistry {
        return &self.registry as &TriggerRegistry
    }
    
    init() {
        self.registry <- create TriggerRegistry()
    }
}