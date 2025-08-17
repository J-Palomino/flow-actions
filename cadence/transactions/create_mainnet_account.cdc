import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61

transaction(publicKey: String, initialFunding: UFix64) {
    prepare(signer: auth(BorrowValue) &Account) {
        let newAccount = Account(payer: signer)
        
        // Add the public key to the new account
        let key = PublicKey(
            publicKey: publicKey.decodeHex(),
            signatureAlgorithm: SignatureAlgorithm.ECDSA_P256
        )
        
        newAccount.keys.add(
            publicKey: key,
            hashAlgorithm: HashAlgorithm.SHA3_256,
            weight: 1000.0
        )
        
        // Send initial FLOW tokens to the new account
        if initialFunding > 0.0 {
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow Flow Token vault")
            
            let tokens <- vault.withdraw(amount: initialFunding)
            
            let receiverRef = newAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver
            ) ?? panic("Could not borrow receiver reference")
            
            receiverRef.deposit(from: <-tokens)
        }
        
        log("New account created with address: ".concat(newAccount.address.toString()))
    }
}