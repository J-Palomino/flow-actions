import "SimpleUsageSubscriptions"

access(all) fun main(): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Get basic contract state
    result["totalVaults"] = SimpleUsageSubscriptions.totalVaults
    result["contractAddress"] = "0x6daee039a7b9c2f0"
    
    // Get pricing tiers
    result["starterTier"] = SimpleUsageSubscriptions.getStarterTier()
    result["availableTiers"] = [
        SimpleUsageSubscriptions.getStarterTier(),
        SimpleUsageSubscriptions.getTierForUsage(10000),
        SimpleUsageSubscriptions.getTierForUsage(100000),
        SimpleUsageSubscriptions.getTierForUsage(1000000)
    ]
    
    return result
}