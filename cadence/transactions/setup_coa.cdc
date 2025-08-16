import "EVM"

/// Transaction to setup a Cadence-Owned Account (COA) for EVM interaction
/// This enables the Flow account to interact with the Flow EVM environment
transaction() {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        // Check if COA already exists
        if signer.storage.borrow<&EVM.CadenceOwnedAccount>(from: /storage/evm) != nil {
            log("COA already exists")
            return
        }

        // Create a new Cadence-Owned Account for EVM interactions
        let coa <- EVM.createCadenceOwnedAccount()
        let coaAddress = coa.address()
        
        // Save the COA in account storage
        signer.storage.save(<-coa, to: /storage/evm)
        
        // Create and publish a public capability for the COA
        let coaCap = signer.capabilities.storage.issue<&EVM.CadenceOwnedAccount>(/storage/evm)
        signer.capabilities.publish(coaCap, at: /public/evm)
        
        log("COA created with EVM address: ".concat(coaAddress.toString()))
    }

    execute {
        log("COA setup completed successfully")
    }
}