import UsageBasedSubscriptions from 0x6daee039a7b9c2f0

/// Check the actual contract interface and existing vaults
access(all) fun main(): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Get basic contract info
    result["totalVaults"] = UsageBasedSubscriptions.totalVaults
    result["vaultRegistry"] = UsageBasedSubscriptions.vaultRegistry
    
    // Check storage paths
    result["vaultStoragePath"] = UsageBasedSubscriptions.VaultStoragePath.toString()
    result["vaultPublicPath"] = UsageBasedSubscriptions.VaultPublicPath.toString()
    result["providerStoragePath"] = UsageBasedSubscriptions.ProviderStoragePath.toString()
    
    return result
}