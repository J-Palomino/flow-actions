import "SimpleUsageSubscriptions"

access(all) fun main(vaultId: UInt64): {String: AnyStruct}? {
    let manager = SimpleUsageSubscriptions.getVaultManager()
    
    if let vault = manager.borrowVault(vaultId: vaultId) {
        return vault.getInfo()
    }
    
    return nil
}