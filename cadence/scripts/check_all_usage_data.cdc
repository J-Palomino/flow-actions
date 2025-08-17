import "SimpleUsageSubscriptions"
import "FlareFDCTriggers"

access(all) fun main(): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Contract state
    result["contractInfo"] = {
        "address": "0x6daee039a7b9c2f0",
        "totalVaults": SimpleUsageSubscriptions.totalVaults,
        "network": "Flow Mainnet"
    }
    
    // Pricing structure
    result["pricingTiers"] = {
        "starter": SimpleUsageSubscriptions.getStarterTier(),
        "growth": SimpleUsageSubscriptions.getTierForUsage(100000),
        "scale": SimpleUsageSubscriptions.getTierForUsage(1000000),
        "enterprise": SimpleUsageSubscriptions.getTierForUsage(10000000)
    }
    
    // Oracle integration status
    result["oracleIntegration"] = {
        "flareFDCContractDeployed": true,
        "litellmHandlerAvailable": true,
        "readyForUsageUpdates": true
    }
    
    // Usage data simulation (based on our oracle triggers)
    result["simulatedOracleData"] = {
        "vault424965": {
            "totalTokens": 0,
            "apiCalls": 1,
            "tier": "Starter",
            "estimatedCost": 0.0,
            "lastUpdate": "2025-08-17T04:47:00Z"
        },
        "vault746865": {
            "totalTokens": 0,
            "apiCalls": 1,
            "tier": "Starter", 
            "estimatedCost": 0.0,
            "lastUpdate": "2025-08-17T04:47:00Z"
        }
    }
    
    return result
}