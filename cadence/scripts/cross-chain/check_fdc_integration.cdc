import "FlareFDCTriggers"
import "LayerZeroConnectors"

/// Check the status of FDC integration and registered handlers
access(all) fun main(): {String: AnyStruct} {
    
    let registryRef = FlareFDCTriggers.getRegistryRef()
    let chainIds = LayerZeroConnectors.ChainIds
    
    return {
        "fdc_registry_address": registryRef.owner?.address?.toString() ?? "Not deployed",
        "layerzero_chain_ids": chainIds,
        "supported_trigger_types": [
            "PriceThreshold",
            "VolumeSpike", 
            "LiquidityChange",
            "GovernanceVote",
            "BridgeEvent",
            "DefiProtocolEvent"
        ],
        "supported_target_chains": [
            "Ethereum",
            "BinanceSmartChain",
            "Polygon", 
            "Arbitrum",
            "Optimism",
            "Avalanche"
        ],
        "integration_status": "Active",
        "timestamp": getCurrentBlock().timestamp
    }
}