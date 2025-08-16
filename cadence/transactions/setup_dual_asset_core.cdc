import "FungibleToken"
import "FlowToken"
import "EVM"

/// Transaction to setup core dual-asset account capabilities:
/// 1. FlowToken vault for Cadence assets
/// 2. COA for EVM interactions
transaction() {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        
        // === CADENCE ASSET SETUP ===
        
        // Setup FlowToken vault if not exists
        if signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) == nil {
            signer.storage.save(<-FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: /storage/flowTokenVault)
            
            let flowReceiverCap = signer.capabilities.storage.issue<&FlowToken.Vault>(/storage/flowTokenVault)
            signer.capabilities.publish(flowReceiverCap, at: /public/flowTokenReceiver)
            
            let flowBalanceCap = signer.capabilities.storage.issue<&FlowToken.Vault>(/storage/flowTokenVault)
            signer.capabilities.publish(flowBalanceCap, at: /public/flowTokenBalance)
            
            log("FlowToken vault setup completed")
        } else {
            log("FlowToken vault already exists")
        }
        
        // === EVM SETUP ===
        
        // Setup Cadence-Owned Account (COA) for EVM interactions
        if signer.storage.borrow<&EVM.CadenceOwnedAccount>(from: /storage/evm) == nil {
            let coa <- EVM.createCadenceOwnedAccount()
            let coaAddress = coa.address()
            
            signer.storage.save(<-coa, to: /storage/evm)
            
            let coaCap = signer.capabilities.storage.issue<&EVM.CadenceOwnedAccount>(/storage/evm)
            signer.capabilities.publish(coaCap, at: /public/evm)
            
            log("COA created with EVM address: ".concat(coaAddress.toString()))
        } else {
            log("COA already exists")
        }
    }

    execute {
        log("Core dual-asset account setup completed successfully")
        log("Account can now:")
        log("- Hold Flow tokens (Cadence)")
        log("- Interact with Flow EVM via COA")
    }
}