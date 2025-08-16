import "FungibleToken"
import "TokenA"

access(all) fun main(account: Address): UFix64 {
    let vaultRef = getAccount(account)
        .capabilities.borrow<&{FungibleToken.Balance}>(TokenA.VaultPublicPath)
        ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
}