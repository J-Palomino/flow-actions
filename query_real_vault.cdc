import UsageBasedSubscriptions from 0x6daee039a7b9c2f0

/// Query a real subscription vault on mainnet
access(all) fun main(vaultId: UInt64): {String: AnyStruct}? {
    // Get the vault owner from registry
    let owner = UsageBasedSubscriptions.vaultRegistry[vaultId]
    if owner == nil {
        return nil
    }
    
    // Get public reference to the vault
    let vaultRef = getAccount(owner!)
        .capabilities.get<&UsageBasedSubscriptions.SubscriptionVault>(
            UsageBasedSubscriptions.VaultPublicPath
        ).borrow()
    
    if vaultRef == nil {
        return {"error": "Could not borrow vault reference"}
    }
    
    // Get real vault data
    return {
        "vaultId": vaultId,
        "owner": owner!.toString(),
        "balance": vaultRef!.getBalance(),
        "serviceName": vaultRef!.serviceName,
        "provider": vaultRef!.provider.toString(),
        "isActive": vaultRef!.isActive(),
        "totalPaid": vaultRef!.getTotalPaid(),
        "lastUpdate": vaultRef!.getLastUpdateTimestamp()
    }
}