import "FungibleToken"
import "FlowToken"

/// Transaction to setup FlowToken vault for an account
transaction() {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        // Check if FlowToken vault already exists
        if signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) != nil {
            log("FlowToken vault already exists")
            return
        }

        // Create a new FlowToken Vault and put it in storage
        signer.storage.save(
            <-FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()),
            to: /storage/flowTokenVault
        )

        // Create a public capability to the stored Vault that exposes
        // the `deposit` method through the `Receiver` interface
        let receiverCap = signer.capabilities.storage.issue<&FlowToken.Vault>(/storage/flowTokenVault)
        signer.capabilities.publish(receiverCap, at: /public/flowTokenReceiver)

        // Create a public capability to the stored Vault that only exposes
        // the `balance` field through the `Balance` interface
        let balanceCap = signer.capabilities.storage.issue<&FlowToken.Vault>(/storage/flowTokenVault)
        signer.capabilities.publish(balanceCap, at: /public/flowTokenBalance)
        
        log("FlowToken vault setup completed")
    }
}