import "FungibleToken"
import "FlowToken"
import "TokenA"
import "TokenB" 
import "EVM"
import "FlowEVMBridge"

/// Transaction to setup a complete dual-asset account capable of:
/// 1. Holding Cadence assets (Flow, TokenA, TokenB, etc.)
/// 2. Interacting with Flow EVM
/// 3. Bridging assets between Cadence and EVM
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
        }
        
        // Setup TokenA vault if not exists
        if signer.storage.borrow<&TokenA.Vault>(from: TokenA.VaultStoragePath) == nil {
            signer.storage.save(<-TokenA.createEmptyVault(vaultType: Type<@TokenA.Vault>()), to: TokenA.VaultStoragePath)
            
            let tokenAReceiverCap = signer.capabilities.storage.issue<&TokenA.Vault>(TokenA.VaultStoragePath)
            signer.capabilities.publish(tokenAReceiverCap, at: TokenA.ReceiverPublicPath)
            
            let tokenABalanceCap = signer.capabilities.storage.issue<&TokenA.Vault>(TokenA.VaultStoragePath)
            signer.capabilities.publish(tokenABalanceCap, at: TokenA.VaultPublicPath)
        }
        
        // Setup TokenB vault if not exists  
        if signer.storage.borrow<&TokenB.Vault>(from: TokenB.VaultStoragePath) == nil {
            signer.storage.save(<-TokenB.createEmptyVault(vaultType: Type<@TokenB.Vault>()), to: TokenB.VaultStoragePath)
            
            let tokenBReceiverCap = signer.capabilities.storage.issue<&TokenB.Vault>(TokenB.VaultStoragePath)
            signer.capabilities.publish(tokenBReceiverCap, at: TokenB.ReceiverPublicPath)
            
            let tokenBBalanceCap = signer.capabilities.storage.issue<&TokenB.Vault>(TokenB.VaultStoragePath)
            signer.capabilities.publish(tokenBBalanceCap, at: TokenB.VaultPublicPath)
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
        }
        
        // === BRIDGE SETUP ===
        
        // Setup bridge capabilities if bridge is available
        // Note: This enables cross-chain asset movement between Cadence and EVM
        if signer.storage.borrow<&FlowEVMBridge.BridgeRouter>(from: FlowEVMBridge.RouterStoragePath) == nil {
            // Create bridge router if it doesn't exist
            // This allows the account to bridge assets between Cadence and EVM
            let router <- FlowEVMBridge.createBridgeRouter()
            signer.storage.save(<-router, to: FlowEVMBridge.RouterStoragePath)
            
            let routerCap = signer.capabilities.storage.issue<&FlowEVMBridge.BridgeRouter>(FlowEVMBridge.RouterStoragePath)
            signer.capabilities.publish(routerCap, at: FlowEVMBridge.RouterPublicPath)
        }
    }

    execute {
        log("Dual-asset account setup completed successfully")
        log("Account can now:")
        log("- Hold Cadence assets (Flow, TokenA, TokenB)")
        log("- Interact with Flow EVM via COA")
        log("- Bridge assets between Cadence and EVM")
    }
}