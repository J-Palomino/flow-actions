import "FlareFDCTriggers"
import "LayerZeroConnectors"
import "DeFiActions"

/// Setup automated cross-chain DeFi execution triggered by Flare FDC events
/// This transaction configures the integration between FDC triggers and LayerZero messaging
transaction() {
    
    let registryRef: &FlareFDCTriggers.TriggerRegistry
    let fdcHandler: @LayerZeroConnectors.FDCToLayerZeroHandler
    
    prepare(signer: &Account) {
        // Get reference to FDC trigger registry
        self.registryRef = FlareFDCTriggers.getRegistryRef()
        
        // Create FDC to LayerZero handler
        self.fdcHandler <- LayerZeroConnectors.createFDCHandler()
        
        // Store handler capability in account storage
        let handlerPath = /storage/fdcLayerZeroHandler
        let handlerCapPath = /private/fdcLayerZeroHandler
        
        signer.storage.save(<-self.fdcHandler, to: handlerPath)
        
        let handlerCap = signer.capabilities.storage.issue<&LayerZeroConnectors.FDCToLayerZeroHandler>(handlerPath)
        signer.capabilities.publish(handlerCap, at: handlerCapPath)
    }
    
    execute {
        // Get handler capability
        let account = self.registryRef.owner!.address
        let handlerCap = getAccount(account)
            .capabilities.get<&LayerZeroConnectors.FDCToLayerZeroHandler>(/private/fdcLayerZeroHandler)
        
        // Register the handler with FDC registry
        self.registryRef.registerHandler(
            handlerId: "layerzero-automation",
            handler: handlerCap,
            triggerTypes: [
                FlareFDCTriggers.TriggerType.PriceThreshold,
                FlareFDCTriggers.TriggerType.VolumeSpike,
                FlareFDCTriggers.TriggerType.LiquidityChange,
                FlareFDCTriggers.TriggerType.DefiProtocolEvent
            ]
        )
        
        log("FDC to LayerZero automation setup completed")
        log("Handler registered for price, volume, liquidity, and protocol triggers")
    }
}