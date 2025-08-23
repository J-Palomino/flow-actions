import UsageBasedSubscriptions from 0x6daee039a7b9c2f0

/// Query real subscription data from mainnet
access(all) fun main(): {String: AnyStruct} {
    return {
        "totalVaults": UsageBasedSubscriptions.totalVaults,
        "contractAddress": "0x6daee039a7b9c2f0",
        "vaultStoragePath": UsageBasedSubscriptions.VaultStoragePath.toString(),
        "vaultPublicPath": UsageBasedSubscriptions.VaultPublicPath.toString(),
        "providerStoragePath": UsageBasedSubscriptions.ProviderStoragePath.toString()
    }
}