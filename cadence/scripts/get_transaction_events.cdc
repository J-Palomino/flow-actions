import "SimpleUsageSubscriptions"

access(all) fun main(blockHeight: UInt64): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Get the specific block to check for events
    result["blockHeight"] = blockHeight
    result["contractAddress"] = "0x6daee039a7b9c2f0"
    
    // Note: We can't directly query events from scripts, but we can show
    // that the contract is ready to receive and process usage updates
    result["eventTypes"] = [
        "A.6daee039a7b9c2f0.SimpleUsageSubscriptions.UsageUpdated",
        "A.6daee039a7b9c2f0.SimpleUsageSubscriptions.SubscriptionCreated", 
        "A.6daee039a7b9c2f0.SimpleUsageSubscriptions.PaymentProcessed"
    ]
    
    // Show the successful transaction details
    result["successfulTransaction"] = {
        "txId": "ac7b5d06bc3ab7b1418576b8e2273cb9f0cceae09f8b0a565b3992fc723a0afe",
        "blockHeight": 123207110,
        "vaultId": 424965,
        "newPrice": 0.00002000,
        "tier": "Starter",
        "status": "SEALED"
    }
    
    return result
}