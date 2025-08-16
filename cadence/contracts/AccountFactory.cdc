import "FungibleToken"
import "FlowToken"
import "EVM"

/// AccountFactory: A helper contract for managing dual-asset Flow accounts
/// that can own both Cadence assets and interact with Flow EVM
access(all) contract AccountFactory {
    
    /// Events
    access(all) event DualAssetAccountSetup(account: Address, evmAddress: String)
    access(all) event AccountCapabilitiesVerified(account: Address, features: [String])
    
    /// Public function to check if an account has dual-asset capabilities
    access(all) view fun hasDualAssetCapabilities(account: Address): {String: Bool} {
        let accountRef = getAccount(account)
        
        let hasFlowToken = accountRef.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance) != nil
        let hasEVM = accountRef.capabilities.borrow<&EVM.CadenceOwnedAccount>(/public/evm) != nil
        
        return {
            "FlowToken": hasFlowToken,
            "EVM": hasEVM,
            "DualAsset": hasFlowToken && hasEVM
        }
    }
    
    /// Get EVM address for a Flow account (if it has a COA)
    access(all) view fun getEVMAddress(account: Address): String? {
        let accountRef = getAccount(account)
        if let coaRef = accountRef.capabilities.borrow<&EVM.CadenceOwnedAccount>(/public/evm) {
            return coaRef.address().toString()
        }
        return nil
    }
    
    /// Get account capabilities summary
    access(all) view fun getAccountCapabilities(account: Address): {String: AnyStruct} {
        let capabilities = self.hasDualAssetCapabilities(account: account)
        let evmAddress = self.getEVMAddress(account: account)
        
        return {
            "address": account.toString(),
            "capabilities": capabilities,
            "evmAddress": evmAddress,
            "isDualAsset": capabilities["DualAsset"] as! Bool
        }
    }
    
    /// Check if an account is ready for dual-asset operations
    access(all) view fun isAccountReady(account: Address): Bool {
        let capabilities = self.hasDualAssetCapabilities(account: account)
        return capabilities["DualAsset"] as! Bool
    }
    
    /// Get setup instructions for missing capabilities
    access(all) view fun getSetupInstructions(account: Address): [String] {
        let capabilities = self.hasDualAssetCapabilities(account: account)
        
        let hasFlowToken = capabilities["FlowToken"] as! Bool
        let hasEVM = capabilities["EVM"] as! Bool
        
        if !hasFlowToken && !hasEVM {
            return ["Setup FlowToken vault - run setup_flow_vault transaction", "Setup COA for EVM - run setup_coa transaction"]
        } else if !hasFlowToken {
            return ["Setup FlowToken vault - run setup_flow_vault transaction"]
        } else if !hasEVM {
            return ["Setup COA for EVM - run setup_coa transaction"]
        } else {
            return ["Account is ready for dual-asset operations!"]
        }
    }
    
    init() {
        // Contract initialization
        emit AccountCapabilitiesVerified(account: self.account.address, features: ["AccountFactory"])
    }
}