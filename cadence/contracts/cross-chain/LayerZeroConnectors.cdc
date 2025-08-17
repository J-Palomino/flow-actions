import "DeFiActions"
import "FungibleToken"
import "FlareFDCTriggers"

/// LayerZero Endpoint interface for cross-chain messaging
access(all) contract interface LayerZeroEndpoint {
    access(all) resource interface Endpoint {
        access(all) fun send(
            dstChainId: UInt16,
            destination: [UInt8],
            payload: [UInt8],
            refundAddress: Address,
            zroPaymentAddress: Address?,
            adapterParams: [UInt8]
        )
        
        access(all) fun estimateFees(
            dstChainId: UInt16,
            userApplication: Address,
            payload: [UInt8],
            payInZRO: Bool,
            adapterParams: [UInt8]
        ): UFix64
        
        access(all) fun getInboundNonce(srcChainId: UInt16, srcAddress: [UInt8]): UInt64
        access(all) fun getOutboundNonce(dstChainId: UInt16, srcAddress: Address): UInt64
    }
}

/// LayerZeroConnectors: Simplified Flow Actions connectors for LayerZero cross-chain messaging
/// Uses struct-based DeFiActions pattern for cross-chain operations
access(all) contract LayerZeroConnectors {
    
    /// Events
    access(all) event CrossChainMessageSent(
        messageId: String,
        targetChain: UInt16,
        payload: String,
        gasLimit: UInt256
    )
    
    access(all) event CrossChainMessageReceived(
        messageId: String,
        sourceChain: UInt16,
        payload: String
    )
    
    access(all) event ActionExecuted(
        actionId: String,
        actionType: String,
        success: Bool
    )
    
    /// LayerZero chain IDs
    access(all) let ChainIds: {String: UInt16}
    
    /// Cross-chain action types
    access(all) enum CrossChainActionType: UInt8 {
        access(all) case TokenTransfer
        access(all) case LiquidityProvision
        access(all) case Swap
        access(all) case Stake
        access(all) case Unstake
        access(all) case Harvest
        access(all) case Compound
    }
    
    /// Cross-chain message structure
    access(all) struct CrossChainMessage {
        access(all) let messageId: String
        access(all) let sourceChain: UInt16
        access(all) let targetChain: UInt16
        access(all) let actionType: CrossChainActionType
        access(all) let payload: {String: String}
        access(all) let gasLimit: UInt256
        access(all) let timestamp: UFix64
        
        init(
            messageId: String,
            sourceChain: UInt16,
            targetChain: UInt16,
            actionType: CrossChainActionType,
            payload: {String: String},
            gasLimit: UInt256
        ) {
            self.messageId = messageId
            self.sourceChain = sourceChain
            self.targetChain = targetChain
            self.actionType = actionType
            self.payload = payload
            self.gasLimit = gasLimit
            self.timestamp = getCurrentBlock().timestamp
        }
    }
    
    /// LayerZero Message Sink: Processes cross-chain messages following DeFiActions pattern
    access(all) struct LayerZeroMessageSink: DeFiActions.Sink {
        access(contract) var uniqueID: DeFiActions.UniqueIdentifier?
        access(contract) let targetChain: UInt16
        access(contract) let actionType: CrossChainActionType
        
        init(
            targetChain: UInt16,
            actionType: CrossChainActionType,
            uniqueID: DeFiActions.UniqueIdentifier?
        ) {
            self.targetChain = targetChain
            self.actionType = actionType
            self.uniqueID = uniqueID
        }
        
        /// Required by Sink: advertise the supported vault type
        access(all) view fun getSinkType(): Type {
            // Accept any FungibleToken vault for cross-chain messaging
            return Type<@{FungibleToken.Vault}>()
        }
        
        /// This sink can accept unlimited capacity for message creation
        access(all) fun minimumCapacity(): UFix64 {
            return UFix64.max
        }
        
        /// Deposit vault and create cross-chain message
        access(all) fun depositCapacity(from: auth(FungibleToken.Withdraw) &{FungibleToken.Vault}) {
            let amount = from.balance
            if amount == 0.0 { return }
            
            // Create cross-chain message based on deposit
            let messageId = self.generateMessageId()
            let message = CrossChainMessage(
                messageId: messageId,
                sourceChain: LayerZeroConnectors.ChainIds["Flow"]!,
                targetChain: self.targetChain,
                actionType: self.actionType,
                payload: {
                    "amount": amount.toString(),
                    "token_type": from.getType().identifier,
                    "timestamp": getCurrentBlock().timestamp.toString()
                },
                gasLimit: 200000
            )
            
            // Consume the vault (in real implementation, this would be bridged)
            let vault <- from.withdraw(amount: amount)
            destroy vault
            
            // Send cross-chain message
            LayerZeroConnectors.sendCrossChainMessage(message)
        }
        
        /// Report metadata about this component
        access(all) fun getComponentInfo(): DeFiActions.ComponentInfo {
            return DeFiActions.ComponentInfo(
                type: self.getType(),
                id: self.id(),
                innerComponents: []
            )
        }
        
        /// UniqueIdentifier passthrough
        access(contract) view fun copyID(): DeFiActions.UniqueIdentifier? {
            return self.uniqueID
        }
        
        /// Allow framework to set UniqueIdentifier
        access(contract) fun setID(_ id: DeFiActions.UniqueIdentifier?) {
            self.uniqueID = id
        }
        
        access(self) fun generateMessageId(): String {
            let timestamp = getCurrentBlock().timestamp
            let id = self.id() ?? 0
            return "lz-".concat(id.toString()).concat("-").concat(timestamp.toString())
        }
    }
    
    /// FDC Trigger Handler that processes Flare triggers
    access(all) resource FDCLayerZeroHandler: FlareFDCTriggers.TriggerHandler {
        access(all) let supportedTypes: [FlareFDCTriggers.TriggerType]
        access(self) var isHandlerActive: Bool
        access(self) let chainMapping: {String: UInt16}
        
        access(all) fun handleTrigger(trigger: FlareFDCTriggers.FDCTrigger): Bool {
            if !self.isHandlerActive {
                return false
            }
            
            // Convert FDC trigger to LayerZero action type
            let actionType = self.mapTriggerToAction(trigger.triggerType)
            let targetChainId = self.chainMapping[trigger.targetChain.rawValue.toString()] ?? 101
            
            // Create cross-chain message
            let messageId = self.generateMessageId(trigger)
            let payload: {String: String} = {}
            
            // Convert trigger payload to string format
            for key in trigger.payload.keys {
                if let value = trigger.payload[key] {
                    // Convert AnyStruct to string representation
                    payload[key] = value.getType().identifier.concat(":").concat(key)
                }
            }
            
            let message = CrossChainMessage(
                messageId: messageId,
                sourceChain: LayerZeroConnectors.ChainIds["Flow"]!,
                targetChain: targetChainId,
                actionType: actionType,
                payload: payload,
                gasLimit: 300000
            )
            
            LayerZeroConnectors.sendCrossChainMessage(message)
            
            // Emit local event (not importing FlareFDCTriggers event)
            emit ActionExecuted(
                actionId: messageId,
                actionType: actionType.rawValue.toString(),
                success: true
            )
            
            return true
        }
        
        access(all) fun getSupportedTriggerTypes(): [FlareFDCTriggers.TriggerType] {
            return self.supportedTypes
        }
        
        access(all) fun isActive(): Bool {
            return self.isHandlerActive
        }
        
        access(all) fun setActive(_ active: Bool) {
            self.isHandlerActive = active
        }
        
        access(self) fun mapTriggerToAction(_ triggerType: FlareFDCTriggers.TriggerType): CrossChainActionType {
            switch triggerType {
                case FlareFDCTriggers.TriggerType.PriceThreshold:
                    return CrossChainActionType.Swap
                case FlareFDCTriggers.TriggerType.LiquidityChange:
                    return CrossChainActionType.LiquidityProvision
                case FlareFDCTriggers.TriggerType.VolumeSpike:
                    return CrossChainActionType.Swap
                case FlareFDCTriggers.TriggerType.DefiProtocolEvent:
                    return CrossChainActionType.Compound
                default:
                    return CrossChainActionType.TokenTransfer
            }
        }
        
        access(self) fun generateMessageId(_ trigger: FlareFDCTriggers.FDCTrigger): String {
            return "fdc-".concat(trigger.id).concat("-").concat(getCurrentBlock().timestamp.toString())
        }
        
        init() {
            self.supportedTypes = [
                FlareFDCTriggers.TriggerType.PriceThreshold,
                FlareFDCTriggers.TriggerType.VolumeSpike,
                FlareFDCTriggers.TriggerType.LiquidityChange,
                FlareFDCTriggers.TriggerType.DefiProtocolEvent
            ]
            self.isHandlerActive = true
            self.chainMapping = {
                "0": 101,   // Ethereum
                "1": 102,   // BSC
                "2": 109,   // Polygon
                "3": 110,   // Arbitrum
                "4": 111,   // Optimism
                "5": 106    // Avalanche
            }
        }
    }
    
    /// Message storage for cross-chain communication
    access(self) var pendingMessages: {String: CrossChainMessage}
    access(self) var messageNonce: UInt256
    
    /// Send cross-chain message via LayerZero
    access(all) fun sendCrossChainMessage(_ message: CrossChainMessage) {
        self.pendingMessages[message.messageId] = message
        
        // In real implementation, this would call LayerZero endpoint
        emit CrossChainMessageSent(
            messageId: message.messageId,
            targetChain: message.targetChain,
            payload: self.encodeMessage(message),
            gasLimit: message.gasLimit
        )
    }
    
    /// Receive cross-chain message from LayerZero
    access(all) fun receiveCrossChainMessage(
        messageId: String,
        sourceChain: UInt16,
        payload: String
    ) {
        emit CrossChainMessageReceived(
            messageId: messageId,
            sourceChain: sourceChain,
            payload: payload
        )
    }
    
    /// Factory functions
    access(all) fun createLayerZeroMessageSink(
        targetChain: UInt16,
        actionType: CrossChainActionType,
        uniqueID: DeFiActions.UniqueIdentifier?
    ): LayerZeroMessageSink {
        return LayerZeroMessageSink(
            targetChain: targetChain,
            actionType: actionType,
            uniqueID: uniqueID
        )
    }
    
    access(all) fun createFDCHandler(): @FDCLayerZeroHandler {
        return <- create FDCLayerZeroHandler()
    }
    
    access(self) fun encodeMessage(_ message: CrossChainMessage): String {
        // Encode message for LayerZero transmission
        return message.messageId.concat(":").concat(message.actionType.rawValue.toString())
    }
    
    init() {
        self.pendingMessages = {}
        self.messageNonce = 0
        
        // Initialize LayerZero chain IDs
        self.ChainIds = {
            "Flow": 114,        // Flow (hypothetical LZ chain ID)
            "Ethereum": 101,
            "BSC": 102,
            "Polygon": 109,
            "Arbitrum": 110,
            "Optimism": 111,
            "Avalanche": 106
        }
    }
}