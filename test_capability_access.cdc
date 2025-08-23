import TestInterface from "./test_interface_syntax.cdc"

transaction(apiKey: String) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // Create test vault
        let vault <- TestInterface.createTestVault()
        let vaultId = vault.id
        
        // Store in account
        let storagePath = StoragePath(identifier: "TestVault_".concat(vaultId.toString()))!
        signer.storage.save(<-vault, to: storagePath)
        
        // Create public capability using the interface
        let publicPath = PublicPath(identifier: "TestVault_".concat(vaultId.toString()))!
        let vaultCap = signer.capabilities.storage.issue<&TestInterface.SubscriptionVaultPublic>(storagePath)
        signer.capabilities.publish(vaultCap, at: publicPath)
        
        // Test accessing the capability
        let vaultRef = signer.capabilities.get<&TestInterface.SubscriptionVaultPublic>(publicPath)
            .borrow() ?? panic("Could not borrow public vault reference")
        
        // This should work - calling setLiteLLMApiKey through the interface
        vaultRef.setLiteLLMApiKey(apiKey: apiKey)
        
        log("✅ Successfully called setLiteLLMApiKey through public interface!")
        log("API Key set: ".concat(vaultRef.getLiteLLMApiKey() ?? "nil"))
    }
}