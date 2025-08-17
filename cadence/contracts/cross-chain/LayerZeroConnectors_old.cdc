import "DeFiActions"
import "DeFiActionsUtils"
import "FungibleToken"
import "FlareFDCTriggers"

/// LayerZeroConnectors: Flow Actions connectors for LayerZero cross-chain messaging
/// Enables sending/receiving cross-chain DeFi actions via LayerZero protocol
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
        success: Bool,
        gasUsed: UInt256
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
        access(all) let payload: {String: AnyStruct}
        access(all) let gasLimit: UInt256
        access(all) let timestamp: UFix64
        
        init(
            messageId: String,
            sourceChain: UInt16,
            targetChain: UInt16,
            actionType: CrossChainActionType,
            payload: {String: AnyStruct},
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
    
    /// LayerZero Source: Sends cross-chain messages based on local actions
    access(all) resource LayerZeroSource: DeFiActions.Source {
        access(all) var uniqueID: String
        access(self) var targetChain: UInt16
        access(self) var actionType: CrossChainActionType
        access(self) var messagePayload: {String: AnyStruct}
        
        access(all) fun withdraw(amount: UFix64): @{FungibleToken.Vault} {
            // For LayerZero, "withdrawal" means preparing cross-chain message
            let messageId = self.generateMessageId()
            let message = CrossChainMessage(
                messageId: messageId,
                sourceChain: LayerZeroConnectors.ChainIds["Flow"]!,
                targetChain: self.targetChain,
                actionType: self.actionType,
                payload: self.messagePayload,
                gasLimit: 200000 // Default gas limit
            )
            
            LayerZeroConnectors.sendCrossChainMessage(message)
            
            // Return empty vault as this is a message operation
            return <- LayerZeroConnectors.createEmptyVault()
        }
        
        access(all) view fun minimumAvailable(): UFix64 {
            // Always available for message sending
            return 1.0
        }
        
        access(all) view fun canWithdraw(amount: UFix64): Bool {
            return amount <= self.minimumAvailable()
        }
        
        access(all) fun setTargetChain(_ chainId: UInt16) {
            self.targetChain = chainId
        }
        
        access(all) fun setActionType(_ actionType: CrossChainActionType) {
            self.actionType = actionType
        }
        
        access(all) fun setPayload(_ payload: {String: AnyStruct}) {
            self.messagePayload = payload
        }
        
        // Required DeFiActions.Source methods
        access(all) fun getSourceType(): String {
            return "LayerZeroSource"
        }
        
        access(all) fun withdrawAvailable(): @{FungibleToken.Vault} {
            return <- self.withdraw(amount: self.minimumAvailable())
        }
        
        access(all) fun getComponentInfo(): {String: AnyStruct} {
            return {
                "type": "LayerZeroSource",
                "id": self.uniqueID,
                "targetChain": self.targetChain,
                "actionType": self.actionType.rawValue
            }
        }
        
        access(all) fun copyID(): String {
            return self.uniqueID
        }
        
        access(all) fun setID(_ id: String) {
            self.uniqueID = id
        }
        
        access(self) fun generateMessageId(): String {
            let timestamp = getCurrentBlock().timestamp
            return self.uniqueID.concat("-").concat(timestamp.toString())
        }
        
        init(id: String, targetChain: UInt16, actionType: CrossChainActionType) {
            self.uniqueID = id
            self.targetChain = targetChain
            self.actionType = actionType
            self.messagePayload = {}
        }
    }
    
    /// LayerZero Sink: Executes actions received from cross-chain messages
    access(all) resource LayerZeroSink: DeFiActions.Sink {
        access(all) var uniqueID: String
        access(self) var pendingActions: [CrossChainMessage]
        access(self) let actionExecutor: @{ActionExecutor}?
        
        access(all) fun deposit(vault: @{FungibleToken.Vault}): UFix64 {
            let amount = vault.balance
            
            // Process pending cross-chain actions
            while self.pendingActions.length > 0 {
                let action = self.pendingActions.removeFirst()
                self.executeAction(action)
            }
            
            destroy vault
            return amount
        }
        
        access(all) view fun minimumCapacity(): UFix64 {
            // Can always accept cross-chain messages
            return UFix64.max
        }
        
        access(all) view fun canDeposit(amount: UFix64): Bool {
            return true
        }
        
        access(all) fun addPendingAction(_ message: CrossChainMessage) {
            self.pendingActions.append(message)
        }
        
        access(self) fun executeAction(_ message: CrossChainMessage) {
            // Execute the cross-chain action based on message type
            var success = false
            
            switch message.actionType {
                case CrossChainActionType.TokenTransfer:
                    success = self.executeTokenTransfer(message)
                case CrossChainActionType.LiquidityProvision:
                    success = self.executeLiquidityProvision(message)
                case CrossChainActionType.Swap:
                    success = self.executeSwap(message)
                case CrossChainActionType.Stake:
                    success = self.executeStake(message)
                case CrossChainActionType.Unstake:
                    success = self.executeUnstake(message)
                case CrossChainActionType.Harvest:
                    success = self.executeHarvest(message)
                case CrossChainActionType.Compound:
                    success = self.executeCompound(message)
                default:
                    success = false
            }
            
            emit ActionExecuted(
                actionId: message.messageId,
                actionType: message.actionType.rawValue.toString(),
                success: success,
                gasUsed: 50000 // Estimated gas
            )
        }
        
        // Action execution implementations
        access(self) fun executeTokenTransfer(_ message: CrossChainMessage): Bool {
            // Implement token transfer logic
            return true
        }
        
        access(self) fun executeSwap(_ message: CrossChainMessage): Bool {
            // Implement swap logic using existing DeFi Actions
            return true
        }
        
        access(self) fun executeLiquidityProvision(_ message: CrossChainMessage): Bool {
            // Implement liquidity provision logic
            return true
        }
        
        access(self) fun executeStake(_ message: CrossChainMessage): Bool {
            // Implement staking logic
            return true
        }
        
        access(self) fun executeUnstake(_ message: CrossChainMessage): Bool {
            // Implement unstaking logic
            return true
        }
        
        access(self) fun executeHarvest(_ message: CrossChainMessage): Bool {
            // Implement harvest logic
            return true
        }
        
        access(self) fun executeCompound(_ message: CrossChainMessage): Bool {
            // Implement compound logic
            return true
        }
        
        // Required DeFiActions.Sink methods
        access(all) fun getSinkType(): String {
            return "LayerZeroSink"
        }
        
        access(all) fun depositCapacity(): UFix64 {
            return self.minimumCapacity()
        }
        
        access(all) fun getComponentInfo(): {String: AnyStruct} {
            return {
                "type": "LayerZeroSink",
                "id": self.uniqueID,
                "pendingActions": self.pendingActions.length
            }
        }
        
        access(all) fun copyID(): String {
            return self.uniqueID
        }
        
        access(all) fun setID(_ id: String) {
            self.uniqueID = id
        }
        
        init(id: String) {
            self.uniqueID = id
            self.pendingActions = []
            self.actionExecutor <- nil
        }
        
    }
    
    /// Action executor interface for custom logic
    access(all) resource interface ActionExecutor {
        access(all) fun executeAction(message: CrossChainMessage): Bool
    }
    
    /// FDC Trigger Handler that creates LayerZero actions
    access(all) resource FDCToLayerZeroHandler: FlareFDCTriggers.TriggerHandler {
        access(all) let supportedTypes: [FlareFDCTriggers.TriggerType]
        access(self) var isHandlerActive: Bool
        access(self) let chainMapping: {String: UInt16}
        
        access(all) fun handleTrigger(trigger: FlareFDCTriggers.FDCTrigger): Bool {
            if !self.isHandlerActive {
                return false
            }
            
            // Convert FDC trigger to LayerZero message
            let targetChainId = self.chainMapping[trigger.targetChain.rawValue.toString()] ?? 0
            if targetChainId == 0 {
                return false
            }
            
            let actionType = self.mapTriggerToAction(trigger.triggerType)
            let messageId = self.generateMessageId(trigger)
            
            let message = CrossChainMessage(
                messageId: messageId,
                sourceChain: LayerZeroConnectors.ChainIds["Flow"]!,
                targetChain: targetChainId,
                actionType: actionType,
                payload: trigger.payload,
                gasLimit: 300000
            )
            
            LayerZeroConnectors.sendCrossChainMessage(message)
            
            emit FlareFDCTriggers.CrossChainActionTriggered(
                actionId: messageId,
                targetChain: trigger.targetChain.rawValue.toString(),
                actionType: actionType.rawValue.toString(),
                parameterKeys: trigger.payload.keys
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
        let message = self.decodeMessage(payload, sourceChain: sourceChain)
        
        emit CrossChainMessageReceived(
            messageId: messageId,
            sourceChain: sourceChain,
            payload: payload
        )
        
        // Process the message (would typically route to appropriate sink)
    }
    
    /// Factory functions
    access(all) fun createLayerZeroSource(
        id: String,
        targetChain: UInt16,
        actionType: CrossChainActionType
    ): @LayerZeroSource {
        return <- create LayerZeroSource(
            id: id,
            targetChain: targetChain,
            actionType: actionType
        )
    }
    
    access(all) fun createLayerZeroSink(id: String): @LayerZeroSink {
        return <- create LayerZeroSink(id: id)
    }
    
    access(all) fun createFDCHandler(): @FDCToLayerZeroHandler {
        return <- create FDCToLayerZeroHandler()
    }
    
    access(all) fun createEmptyVault(): @{FungibleToken.Vault} {
        // This would return an appropriate empty vault type
        // For now, using a placeholder
        panic("Must implement empty vault creation")
    }
    
    access(self) fun encodeMessage(_ message: CrossChainMessage): String {
        // Encode message for LayerZero transmission
        return message.messageId
    }
    
    access(self) fun decodeMessage(_ payload: String, sourceChain: UInt16): CrossChainMessage {
        // Decode LayerZero message
        return CrossChainMessage(
            messageId: payload,
            sourceChain: sourceChain,
            targetChain: self.ChainIds["Flow"]!,
            actionType: CrossChainActionType.TokenTransfer,
            payload: {},
            gasLimit: 100000
        )
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