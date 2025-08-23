import UsageBasedSubscriptions from 0x6daee039a7b9c2f0

/// Get detailed vault information for display
access(all) fun main(userAddress: Address): [{String: AnyStruct}] {
    let subscriptions: [{String: AnyStruct}] = []
    
    // Check all vaults in registry
    for vaultId in UsageBasedSubscriptions.vaultRegistry.keys {
        let owner = UsageBasedSubscriptions.vaultRegistry[vaultId]
        
        // Only include vaults owned by the user
        if owner == userAddress {
            // Get public reference to the vault
            let vaultRef = getAccount(owner!)
                .capabilities.get<&UsageBasedSubscriptions.SubscriptionVault>(
                    UsageBasedSubscriptions.VaultPublicPath
                ).borrow()
            
            if vaultRef != nil {
                subscriptions.append({
                    "vaultId": vaultId,
                    "owner": owner!.toString(),
                    "serviceName": vaultRef!.serviceName,
                    "provider": vaultRef!.provider.toString(),
                    "balance": vaultRef!.getBalance(),
                    "createdAt": getCurrentBlock().timestamp,
                    "isActive": true,
                    "network": "mainnet"
                })
            }
        }
    }
    
    return subscriptions
}