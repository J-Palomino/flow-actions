import "FungibleToken"
import "TokenA"

transaction() {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        // Return early if the account already stores a TokenA Vault
        if signer.storage.borrow<&TokenA.Vault>(from: TokenA.VaultStoragePath) != nil {
            return
        }

        // Create a new TokenA Vault and put it in storage
        signer.storage.save(
            <-TokenA.createEmptyVault(vaultType: Type<@TokenA.Vault>()),
            to: TokenA.VaultStoragePath
        )

        // Create a public capability to the stored Vault that exposes
        // the `deposit` method through the `Receiver` interface
        let receiverCap = signer.capabilities.storage.issue<&TokenA.Vault>(TokenA.VaultStoragePath)
        signer.capabilities.publish(receiverCap, at: TokenA.ReceiverPublicPath)

        // Create a public capability to the stored Vault that only exposes
        // the `balance` field and the `resolveView` method through the `Balance` interface
        let balanceCap = signer.capabilities.storage.issue<&TokenA.Vault>(TokenA.VaultStoragePath)
        signer.capabilities.publish(balanceCap, at: TokenA.VaultPublicPath)
    }
}