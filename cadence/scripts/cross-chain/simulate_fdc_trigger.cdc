import "FlareFDCTriggers"
import "LayerZeroConnectors"

/// Simulate an FDC trigger for testing purposes
/// Returns the result of trigger processing
access(all) fun main(
    triggerType: UInt8,
    sourceChain: String,
    targetChain: UInt8,
    priceThreshold: UFix64?,
    volumeAmount: UFix64?,
    liquidityChange: UFix64?
): Bool {
    
    // Build payload based on trigger type
    var payload: {String: AnyStruct} = {}
    
    switch triggerType {
        case 0: // PriceThreshold
            payload["threshold"] = priceThreshold ?? 1000.0
            payload["current_price"] = (priceThreshold ?? 1000.0) + 50.0
            payload["asset"] = "ETH/USD"
        case 1: // VolumeSpike  
            payload["volume_24h"] = volumeAmount ?? 1000000.0
            payload["spike_percentage"] = 25.0
            payload["asset"] = "ETH"
        case 2: // LiquidityChange
            payload["pool_address"] = "0x1234567890123456789012345678901234567890"
            payload["liquidity_change"] = liquidityChange ?? 500000.0
            payload["change_percentage"] = 15.0
        case 3: // GovernanceVote
            payload["proposal_id"] = "prop-123"
            payload["vote_result"] = "passed"
            payload["vote_count"] = 150000
        case 4: // BridgeEvent
            payload["bridge_contract"] = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            payload["transfer_amount"] = 1000.0
            payload["token"] = "USDC"
        case 5: // DefiProtocolEvent
            payload["protocol"] = "UniswapV3"
            payload["event_type"] = "pool_created"
            payload["pool_fee"] = 3000
        default:
            payload["message"] = "unknown_trigger_type"
    }
    
    // Create FDC trigger
    let trigger = FlareFDCTriggers.FDCTrigger(
        id: "test-trigger-".concat(getCurrentBlock().timestamp.toString()),
        triggerType: FlareFDCTriggers.TriggerType(rawValue: triggerType)!,
        sourceChain: sourceChain,
        targetChain: FlareFDCTriggers.TargetChain(rawValue: targetChain)!,
        payload: payload,
        timestamp: getCurrentBlock().timestamp,
        signature: "test-signature-mock"
    )
    
    // Submit trigger and return result
    return FlareFDCTriggers.submitFDCTrigger(trigger: trigger)
}