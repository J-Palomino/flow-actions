import "FungibleToken"
import "TokenA"

transaction(amount: UFix64) {
    let tokenAdmin: &TokenA.Minter

    prepare(signer: auth(BorrowValue) &Account) {
        self.tokenAdmin = signer.storage.borrow<&TokenA.Minter>(from: TokenA.AdminStoragePath)
            ?? panic("Signer is not the token admin")
    }

    execute {
        let minterVault <- self.tokenAdmin.mintTokens(amount: amount)
        
        let tokenAVault = signer.storage.borrow<&TokenA.Vault>(from: TokenA.VaultStoragePath)
            ?? panic("Could not borrow vault from storage")
        
        tokenAVault.deposit(from: <-minterVault)
    }
}