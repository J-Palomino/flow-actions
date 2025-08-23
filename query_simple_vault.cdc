import UsageBasedSubscriptions from 0x6daee039a7b9c2f0

/// Query basic vault info from real mainnet contract
access(all) fun main(vaultId: UInt64): {String: AnyStruct}? {
    // Get the vault owner from registry
    let owner = UsageBasedSubscriptions.vaultRegistry[vaultId]
    if owner == nil {
        return {"error": "Vault not found"}
    }
    
    // Get public reference to the vault
    let vaultRef = getAccount(owner!)
        .capabilities.get<&UsageBasedSubscriptions.SubscriptionVault>(
            UsageBasedSubscriptions.VaultPublicPath
        ).borrow()
    
    if vaultRef == nil {
        return {"error": "Could not borrow vault reference"}
    }
    
    // Get basic vault data that we know exists
    return {
        "vaultId": vaultId,
        "owner": owner!.toString(),
        "serviceName": vaultRef!.serviceName,
        "provider": vaultRef!.provider.toString(),
        "balance": vaultRef!.getBalance()
    }
}