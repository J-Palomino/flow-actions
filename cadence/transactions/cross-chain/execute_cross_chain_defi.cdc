import "FlareFDCTriggers"
import "LayerZeroConnectors"
import "FlowToken"
import "FungibleToken"

/// Execute a cross-chain DeFi operation triggered by FDC data
/// This transaction demonstrates the complete flow: FDC trigger -> Flow Actions -> LayerZero message
transaction(
    triggerType: UInt8,
    sourceChain: String,
    targetChain: UInt8,
    actionPayload: {String: String}
) {
    
    let flowVault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow Flow vault from signer's storage
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault from signer")
        
        // Withdraw some Flow tokens for cross-chain operation
        let amount = 1.0 // 1 FLOW token
        self.flowVault <- vaultRef.withdraw(amount: amount)
        
        log("Cross-chain DeFi operation prepared")
        log("Source chain: ".concat(sourceChain))
        log("Target chain: ".concat(targetChain.toString()))
        log("Amount to transfer: ".concat(amount.toString()))
    }
    
    execute {
        // Convert target chain to LayerZero chain ID
        let targetChainId = getLayerZeroChainId(targetChain)
        let actionType = mapToActionType(triggerType)
        
        // Generate a simple unique ID
        let uniqueId = getCurrentBlock().height.toString().concat("-").concat(getCurrentBlock().timestamp.toString())
        
        // Simulate FDC trigger submission
        let fdcTrigger = FlareFDCTriggers.FDCTrigger(
            id: uniqueId,
            triggerType: FlareFDCTriggers.TriggerType(rawValue: triggerType)!,
            sourceChain: sourceChain,
            targetChain: FlareFDCTriggers.TargetChain(rawValue: targetChain)!,
            payload: convertPayload(actionPayload),
            timestamp: getCurrentBlock().timestamp,
            signature: "mock-fdc-signature-".concat(uniqueId)
        )
        
        // Submit trigger to FDC system
        let processed = FlareFDCTriggers.submitFDCTrigger(trigger: fdcTrigger)
        
        if processed {
            log("FDC trigger processed successfully")
            
            // Create LayerZero message sink for cross-chain operation
            let layerZeroSink = LayerZeroConnectors.LayerZeroMessageSink(
                targetChain: targetChainId,
                actionType: actionType,
                uniqueID: nil
            )
            
            // Execute the cross-chain action through Flow Actions pattern
            layerZeroSink.depositCapacity(from: &self.flowVault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault})
            
            log("Cross-chain message sent successfully")
            log("Remaining vault balance: ".concat(self.flowVault.balance.toString()))
        } else {
            log("Failed to process FDC trigger")
        }
        
        // Destroy any remaining vault
        destroy self.flowVault
    }
}

/// Helper function to convert target chain enum to LayerZero chain ID
access(all) fun getLayerZeroChainId(_ targetChain: UInt8): UInt16 {
    switch targetChain {
        case 0: return 101  // Ethereum
        case 1: return 102  // BSC
        case 2: return 109  // Polygon
        case 3: return 110  // Arbitrum
        case 4: return 111  // Optimism
        case 5: return 106  // Avalanche
        default: return 101 // Default to Ethereum
    }
}

/// Helper function to map trigger type to action type
access(all) fun mapToActionType(_ triggerType: UInt8): LayerZeroConnectors.CrossChainActionType {
    switch triggerType {
        case 0: return LayerZeroConnectors.CrossChainActionType.Swap          // PriceThreshold
        case 1: return LayerZeroConnectors.CrossChainActionType.Swap          // VolumeSpike
        case 2: return LayerZeroConnectors.CrossChainActionType.LiquidityProvision // LiquidityChange
        case 3: return LayerZeroConnectors.CrossChainActionType.Harvest       // GovernanceVote
        case 4: return LayerZeroConnectors.CrossChainActionType.TokenTransfer // BridgeEvent
        case 5: return LayerZeroConnectors.CrossChainActionType.Compound      // DefiProtocolEvent
        default: return LayerZeroConnectors.CrossChainActionType.TokenTransfer
    }
}

/// Helper function to convert string payload to AnyStruct payload
access(all) fun convertPayload(_ stringPayload: {String: String}): {String: AnyStruct} {
    let payload: {String: AnyStruct} = {}
    for key in stringPayload.keys {
        payload[key] = stringPayload[key]!
    }
    return payload
}