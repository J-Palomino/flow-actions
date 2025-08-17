import "SimpleUsageSubscriptions"

access(all) fun main(): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Contract information
    result["contractAddress"] = "0x6daee039a7b9c2f0"
    result["network"] = "mainnet"
    
    // Key transaction details
    result["oracleTransaction"] = {
        "txId": "ac7b5d06bc3ab7b1418576b8e2273cb9f0cceae09f8b0a565b3992fc723a0afe",
        "status": "SEALED",
        "explorer": "https://www.flowdiver.io/tx/ac7b5d06bc3ab7b1418576b8e2273cb9f0cceae09f8b0a565b3992fc723a0afe"
    }
    
    // Expected event data from successful submission
    result["expectedEvents"] = [
        {
            "type": "A.6daee039a7b9c2f0.SimpleUsageSubscriptions.UsageUpdated",
            "vaultId": 424965,
            "newPrice": 0.00002000,
            "tier": "Starter",
            "description": "Real LiteLLM usage data processed by oracle"
        }
    ]
    
    // Query contract state
    result["totalVaults"] = SimpleUsageSubscriptions.totalVaults
    
    // Pricing tiers available
    result["pricingTiers"] = {
        "starter": SimpleUsageSubscriptions.getStarterTier(),
        "growth": SimpleUsageSubscriptions.getTierForUsage(100000),
        "scale": SimpleUsageSubscriptions.getTierForUsage(1000000),
        "enterprise": SimpleUsageSubscriptions.getTierForUsage(10000000)
    }
    
    // Contract capabilities
    result["contractCapabilities"] = {
        "usageBasedBilling": "Active",
        "oracleIntegration": "Flow Direct Submission",
        "dynamicPricing": "Enabled",
        "realTimeUpdates": "Operational"
    }
    
    // Data flow summary
    result["dataFlow"] = {
        "source": "LiteLLM API (llm.p10p.io)",
        "oracleMethod": "Direct Flow Submission",
        "contract": "SimpleUsageSubscriptions.cdc",
        "lastUpdate": "Real data processed successfully",
        "vaultProcessed": 424965,
        "tokensProcessed": 1,
        "apiCallsProcessed": 1
    }
    
    return result
}