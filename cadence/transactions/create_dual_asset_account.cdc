import "AccountFactory"

/// Transaction to create a new Flow account with dual-asset capabilities
/// using the AccountFactory contract
transaction(publicKeyHex: String) {
    let admin: &AccountFactory.Admin
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow the AccountFactory admin resource
        self.admin = signer.storage.borrow<&AccountFactory.Admin>(from: AccountFactory.AdminStoragePath)
            ?? panic("Could not borrow AccountFactory Admin resource")
    }
    
    execute {
        // Create new account with dual-asset capabilities
        let newAccount = self.admin.createDualAssetAccount(publicKey: publicKeyHex)
        
        // Initialize the account with Cadence and EVM capabilities
        let evmAddress = self.admin.initializeDualAssetAccount(account: newAccount)
        
        log("New dual-asset account created:")
        log("Flow Address: ".concat(newAccount.address.toString()))
        log("EVM Address: ".concat(evmAddress))
        log("Account ready for Cadence and EVM assets")
    }
}