import "SimpleUsageSubscriptions"

access(all) fun main(accountAddress: Address): {String: AnyStruct} {
    let account = getAccount(accountAddress)
    let result: {String: AnyStruct} = {}
    
    result["accountAddress"] = accountAddress.toString()
    result["hasSubscriptionStorage"] = account.storage.check<@AnyResource>(from: /storage/SimpleUsageSubscriptionsVault)
    
    // Try to check public capabilities
    result["hasPublicCapability"] = account.capabilities.get<&{SimpleUsageSubscriptions.SubscriptionVaultPublic}>(
        /public/SimpleUsageSubscriptionsVault
    ).check()
    
    return result
}