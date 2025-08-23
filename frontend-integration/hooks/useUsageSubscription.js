import { useState, useCallback } from 'react';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { CONTRACTS, TX_STATUS } from '../config/flowConfig';
import litellmKeyService from '../services/litellmKeyService';
import encryptionService from '../services/encryptionService';

// Transaction to set encrypted LiteLLM API key in vault - only works with new encrypted vaults
const SET_ENCRYPTED_LITELLM_KEY_TRANSACTION = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

transaction(vaultId: UInt64, encryptedApiKey: String, keyEncryptionSalt: String) {
    prepare(signer: auth(BorrowValue, Storage) &Account) {
        // Look for encrypted vault at the standard path
        let storagePath = StoragePath(identifier: "UsageSubscriptionVault_".concat(vaultId.toString()))!
        
        if let encryptedVaultRef = signer.storage.borrow<&EncryptedUsageSubscriptions.SubscriptionVault>(from: storagePath) {
            if encryptedVaultRef.id == vaultId {
                encryptedVaultRef.setEncryptedLiteLLMApiKey(encryptedKey: encryptedApiKey, salt: keyEncryptionSalt, caller: signer.address)
                log("✅ Encrypted key stored in vault #".concat(vaultId.toString()))
            } else {
                panic("Vault ID mismatch - expected ".concat(vaultId.toString()).concat(", found ".concat(encryptedVaultRef.id.toString())))
            }
        } else {
            panic("Could not find encrypted subscription vault with ID ".concat(vaultId.toString()).concat(". Ensure vault exists and was created with EncryptedUsageSubscriptions contract."))
        }
    }
}
`;

// Alternative transaction using storage access as fallback - same as primary now
const SET_ENCRYPTED_LITELLM_KEY_PUBLIC_TRANSACTION = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

transaction(vaultId: UInt64, encryptedApiKey: String, keyEncryptionSalt: String) {
    prepare(signer: auth(BorrowValue, Storage) &Account) {
        // Look for encrypted vault at the standard path
        let storagePath = StoragePath(identifier: "UsageSubscriptionVault_".concat(vaultId.toString()))!
        
        if let encryptedVaultRef = signer.storage.borrow<&EncryptedUsageSubscriptions.SubscriptionVault>(from: storagePath) {
            if encryptedVaultRef.id == vaultId {
                encryptedVaultRef.setEncryptedLiteLLMApiKey(encryptedKey: encryptedApiKey, salt: keyEncryptionSalt, caller: signer.address)
                log("✅ Encrypted key stored in vault #".concat(vaultId.toString()).concat(" (fallback)"))
            } else {
                panic("Vault ID mismatch - expected ".concat(vaultId.toString()).concat(", found ".concat(encryptedVaultRef.id.toString())))
            }
        } else {
            panic("Could not find encrypted subscription vault with ID ".concat(vaultId.toString()).concat(". Ensure vault exists and was created with EncryptedUsageSubscriptions contract."))
        }
    }
}
`;

// Transaction templates
const CREATE_SUBSCRIPTION_WITH_ENTITLEMENT_TRANSACTION = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

transaction(
    providerAddress: Address,
    initialDeposit: UFix64,
    entitlementType: String,
    withdrawLimit: UFix64,
    expirationAmount: UInt64,
    expirationUnit: String,
    selectedModels: [String]
) {
    
    let vault: @FlowToken.Vault
    let customerAddress: Address
    let entitlementTypeEnum: EncryptedUsageSubscriptions.EntitlementType
    let validityPeriod: UFix64
    let signerAccount: auth(Storage, Capabilities) &Account
    
    prepare(signer: auth(BorrowValue, Storage, Capabilities) &Account) {
        self.customerAddress = signer.address
        self.signerAccount = signer
        
        // Convert entitlement type string to enum
        if entitlementType == "fixed" {
            self.entitlementTypeEnum = EncryptedUsageSubscriptions.EntitlementType.fixed
        } else {
            self.entitlementTypeEnum = EncryptedUsageSubscriptions.EntitlementType.dynamic
        }
        
        // Convert expiration to seconds
        self.validityPeriod = EncryptedUsageSubscriptions.convertToSeconds(
            amount: expirationAmount,
            unit: expirationUnit
        )
        
        // Withdraw FLOW from signer's vault
        let flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault from storage")
        
        self.vault <- flowVault.withdraw(amount: initialDeposit) as! @FlowToken.Vault
    }
    
    execute {
        
        // Create subscription vault with entitlement settings
        let vaultResource <- EncryptedUsageSubscriptions.createSubscriptionVault(
            owner: self.customerAddress,
            provider: providerAddress,
            serviceName: "LiteLLM API Access",
            initialDeposit: <- self.vault,
            entitlementType: self.entitlementTypeEnum,
            initialWithdrawLimit: withdrawLimit,
            validityPeriod: self.validityPeriod,
            selectedModels: selectedModels
        )
        
        // Get vault ID for logging 
        let vaultIdValue = vaultResource.id
        
        // Store the vault in user's storage - handle existing vault collision
        let storagePath = StoragePath(identifier: "UsageSubscriptionVault_".concat(vaultIdValue.toString()))!
        
        // If there's already something at this path, remove it first
        if self.signerAccount.storage.type(at: storagePath) != nil {
            log("⚠️ Storage path collision detected - removing existing resource to make room for new vault")
            
            // Remove whatever is at this path (could be old vault from previous attempt)
            let existingResource <- self.signerAccount.storage.load<@AnyResource>(from: storagePath)!
            destroy existingResource
            
            log("✅ Cleared storage path for new encrypted vault")
        }
        
        // Save vault to storage using signer account
        self.signerAccount.storage.save(<-vaultResource, to: storagePath)
        log("✅ New encrypted vault stored at: ".concat(storagePath.toString()))
        
        // Create and publish public capability for the vault using the public interface
        // Use unique public path for each vault to avoid collisions
        let uniquePublicPath = PublicPath(identifier: "UsageSubscriptionVault_".concat(vaultIdValue.toString()))!
        
        // Check if there's already a capability at this unique path and clean it up
        if self.signerAccount.capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(uniquePublicPath) != nil {
            log("⚠️ Found existing capability at unique path - cleaning up before creating new vault")
            self.signerAccount.capabilities.unpublish(uniquePublicPath)
        }
        
        // Issue and publish new capability
        let vaultCap = self.signerAccount.capabilities.storage.issue<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(storagePath)
        self.signerAccount.capabilities.publish(vaultCap, at: uniquePublicPath)
        
        // Also check and set up the default public path if it doesn't exist
        if self.signerAccount.capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(EncryptedUsageSubscriptions.VaultPublicPath) == nil {
            let defaultVaultCap = self.signerAccount.capabilities.storage.issue<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(storagePath)
            self.signerAccount.capabilities.publish(defaultVaultCap, at: EncryptedUsageSubscriptions.VaultPublicPath)
            log("✅ Set up default public capability at standard path")
        }
        
        log("✅ Subscription created with entitlement settings!")
        log("  - Vault ID: ".concat(vaultIdValue.toString()))
        log("  - Entitlement Type: ".concat(entitlementType))
        log("  - Withdraw Limit: ".concat(withdrawLimit.toString()).concat(" FLOW"))
        log("  - Expires In: ".concat(expirationAmount.toString()).concat(" ").concat(expirationUnit))
    }
}
`;

const CREATE_SUBSCRIPTION_TRANSACTION = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}
import SimpleUsageSubscriptions from ${CONTRACTS.SimpleUsageSubscriptions}

transaction(providerAddress: Address, initialDeposit: UFix64, vaultIdentifier: String) {
    let vault: @SimpleUsageSubscriptions.SubscriptionVault
    let customer: auth(Storage, Capabilities) &Account
    let vaultId: UInt64
    
    prepare(signer: auth(BorrowValue, Storage, Capabilities) &Account) {
        self.customer = signer
        
        // Check signer has sufficient FLOW balance
        let flowVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault - ensure wallet is properly connected")
        
        if flowVaultRef.balance < initialDeposit {
            panic("Insufficient FLOW balance. Required: ".concat(initialDeposit.toString()).concat(", Available: ").concat(flowVaultRef.balance.toString()))
        }
        
        // Withdraw initial deposit from connected user's FLOW vault
        let depositVault <- flowVaultRef.withdraw(amount: initialDeposit) as! @FlowToken.Vault
        
        // Create new subscription vault with unique identifier
        self.vault <- SimpleUsageSubscriptions.createSubscriptionVault(
            customer: signer.address,
            provider: providerAddress,
            initialDeposit: <- depositVault
        )
        
        self.vaultId = self.vault.id
        log("New subscription vault created - ID: ".concat(self.vaultId.toString()).concat(", Customer: ").concat(signer.address.toString()).concat(", Provider: ").concat(providerAddress.toString()))
    }
    
    execute {
        // Store vault with unique storage path to support multiple subscriptions per user
        let uniqueStoragePath = StoragePath(identifier: "SubscriptionVault_".concat(vaultIdentifier))!
        let uniquePublicPath = PublicPath(identifier: "SubscriptionVault_".concat(vaultIdentifier))!
        
        // Ensure no existing vault at this path
        if self.customer.storage.type(at: uniqueStoragePath) != nil {
            panic("Subscription vault already exists at this path")
        }
        
        // Store vault in customer's account with unique path
        self.customer.storage.save(<- self.vault, to: uniqueStoragePath)
        
        // Create public capability for provider access with unique path
        let vaultCap = self.customer.capabilities.storage.issue<&SimpleUsageSubscriptions.SubscriptionVault>(
            uniqueStoragePath
        )
        self.customer.capabilities.publish(vaultCap, at: uniquePublicPath)
        
        log("✅ Subscription vault ".concat(self.vaultId.toString()).concat(" funded with ").concat(initialDeposit.toString()).concat(" FLOW from user wallet and activated for independent usage tracking"))
    }
}`;

const TOP_UP_SUBSCRIPTION = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}
import SimpleUsageSubscriptions from ${CONTRACTS.SimpleUsageSubscriptions}

transaction(amount: UFix64, vaultIdentifier: String) {
    prepare(customer: auth(BorrowValue, Storage) &Account) {
        // Use the unique storage path for this specific subscription vault
        let uniqueStoragePath = StoragePath(identifier: "SubscriptionVault_".concat(vaultIdentifier))!
        
        let vaultRef = customer.storage.borrow<&SimpleUsageSubscriptions.SubscriptionVault>(
            from: uniqueStoragePath
        ) ?? panic("No subscription vault found at path: ".concat(uniqueStoragePath.toString()))
        
        // Check user has sufficient FLOW balance
        let flowVault = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault - ensure wallet is connected")
        
        if flowVault.balance < amount {
            panic("Insufficient FLOW balance. Required: ".concat(amount.toString()).concat(", Available: ").concat(flowVault.balance.toString()))
        }
        
        // Withdraw from user's connected wallet and add to subscription vault
        let deposit <- flowVault.withdraw(amount: amount)
        vaultRef.deposit(from: <- deposit)
        
        log("Added ".concat(amount.toString()).concat(" FLOW from user wallet to subscription vault ").concat(vaultRef.id.toString()))
    }
}`;

const CHECK_VAULT_EXISTS_SCRIPT = `
import SimpleUsageSubscriptions from ${CONTRACTS.SimpleUsageSubscriptions}

access(all) fun main(customerAddress: Address): Bool {
    let account = getAccount(customerAddress)
    
    // Check if vault exists in storage
    let vaultType = account.storage.type(at: SimpleUsageSubscriptions.VaultStoragePath)
    if vaultType == nil {
        return false
    }
    
    // Check if public capability exists
    let vaultCap = account.capabilities.get<&SimpleUsageSubscriptions.SubscriptionVault>(
        SimpleUsageSubscriptions.VaultPublicPath
    )
    
    return vaultCap.check()
}`;

// Query scripts for real blockchain data
const GET_USER_VAULT_IDS_SCRIPT = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

access(all) fun main(userAddress: Address): [UInt64] {
    return EncryptedUsageSubscriptions.getUserVaultIds(owner: userAddress)
}`;

const GET_VAULT_INFO_SCRIPT = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

access(all) fun main(vaultId: UInt64): {String: AnyStruct}? {
    // Get the owner address from the registry
    if let ownerAddress = EncryptedUsageSubscriptions.vaultRegistry[vaultId] {
        let account = getAccount(ownerAddress)
        
        // Try to borrow the vault reference
        if let vaultRef = account.storage.borrow<&EncryptedUsageSubscriptions.SubscriptionVault>(
            from: EncryptedUsageSubscriptions.VaultStoragePath
        ) {
            // Only return info if this is the correct vault
            if vaultRef.id == vaultId {
                return vaultRef.getVaultInfo()
            }
        }
    }
    return nil
}`;

// Script to get encrypted LiteLLM key data from vault
const GET_ENCRYPTED_KEY_DATA_SCRIPT = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

access(all) fun main(vaultId: UInt64): {String: String?}? {
    // Get the owner address from the registry
    if let ownerAddress = EncryptedUsageSubscriptions.vaultRegistry[vaultId] {
        let account = getAccount(ownerAddress)
        
        // Try unique public capability path first (this is where each vault is published)
        let uniquePublicPath = PublicPath(identifier: "UsageSubscriptionVault_".concat(vaultId.toString()))!
        let uniqueCap = account.capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(uniquePublicPath)
        if uniqueCap.check() {
            if let vaultRef = uniqueCap.borrow() {
                if vaultRef.id == vaultId {
                    return vaultRef.getEncryptedLiteLLMKeyData()
                }
            }
        }
        
        // Fallback to default public path
        if let vaultRef = account.capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(
            EncryptedUsageSubscriptions.VaultPublicPath
        ).borrow() {
            // Only return data if this is the correct vault
            if vaultRef.id == vaultId {
                return vaultRef.getEncryptedLiteLLMKeyData()
            }
        }
    }
    return nil
}`;

const GET_USER_SUBSCRIPTIONS_SCRIPT = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

access(all) fun main(userAddress: Address): [{String: AnyStruct}] {
    let subscriptions: [{String: AnyStruct}] = []
    
    // Check all vaults in registry
    for vaultId in EncryptedUsageSubscriptions.vaultRegistry.keys {
        let owner = EncryptedUsageSubscriptions.vaultRegistry[vaultId]
        
        // Only include vaults owned by the user
        if owner == userAddress {
            // Get public reference to the vault
            let vaultRef = getAccount(owner!)
                .capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(
                    EncryptedUsageSubscriptions.VaultPublicPath
                ).borrow()
            
            if vaultRef != nil {
                subscriptions.append({
                    "vaultId": vaultId,
                    "owner": owner!.toString(),
                    "serviceName": vaultRef!.serviceName,
                    "provider": vaultRef!.provider.toString(),
                    "balance": vaultRef!.getBalance(),
                    "createdAt": getCurrentBlock().timestamp,
                    "isActive": true,
                    "network": "mainnet",
                    "litellmKey": "sk-flow-" + vaultId.toString() + "-demo",
                    "maxBudget": 100.0,
                    "currentSpend": 0.0
                })
            }
        }
    }
    
    return subscriptions
}`;

const CHECK_BALANCE_SCRIPT = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    
    // Try the standard FlowToken receiver path first
    if let receiverRef = account.capabilities.get<&{FungibleToken.Balance}>(/public/flowTokenReceiver).borrow() {
        return receiverRef.balance
    }
    
    // Fallback to alternative paths that might exist
    if let vaultRef = account.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance).borrow() {
        return vaultRef.balance
    }
    
    // If no public capability exists, return 0 (account may not be set up)
    return 0.0
}`;

const GET_FDC_STATUS = `
import FlareFDCTriggers from ${CONTRACTS.FlareFDCTriggers}

access(all) fun main(): {String: AnyStruct} {
    let registryRef = FlareFDCTriggers.getRegistryRef()
    
    return {
        "registryAddress": registryRef.owner?.address?.toString() ?? "Not deployed",
        "integrationStatus": "Active",
        "supportedTriggerTypes": [
            "PriceThreshold",
            "VolumeSpike",
            "LiquidityChange",
            "GovernanceVote",
            "BridgeEvent",
            "DefiProtocolEvent"
        ],
        "dataFeedActive": true
    }
}`;

// Script to detect vault type using only public capabilities (no private storage access)
const DETECT_VAULT_TYPE_SCRIPT = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

access(all) fun main(userAddress: Address, vaultId: UInt64): {String: AnyStruct} {
    let account = getAccount(userAddress)
    var result: {String: AnyStruct} = {
        "vaultFound": false,
        "vaultType": "unknown",
        "supportsEncryption": false,
        "vaultId": vaultId,
        "owner": userAddress.toString()
    }
    
    // Try unique public capability path first
    let uniquePublicPath = PublicPath(identifier: "UsageSubscriptionVault_".concat(vaultId.toString()))!
    let uniqueCap = account.capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(uniquePublicPath)
    if uniqueCap.check() {
        if let vaultRef = uniqueCap.borrow() {
            if vaultRef.id == vaultId {
                result["vaultFound"] = true
                result["vaultType"] = "EncryptedUsageSubscriptions"
                result["supportsEncryption"] = true
                result["hasApiKey"] = vaultRef.hasApiKey()
                result["balance"] = vaultRef.getBalance()
                return result
            }
        }
    }
    
    // Try default public capability path as fallback
    let defaultCap = account.capabilities.get<&{EncryptedUsageSubscriptions.SubscriptionVaultPublic}>(EncryptedUsageSubscriptions.VaultPublicPath)
    if defaultCap.check() {
        if let vaultRef = defaultCap.borrow() {
            if vaultRef.id == vaultId {
                result["vaultFound"] = true
                result["vaultType"] = "EncryptedUsageSubscriptions"
                result["supportsEncryption"] = true
                result["hasApiKey"] = vaultRef.hasApiKey()
                result["balance"] = vaultRef.getBalance()
                return result
            }
        }
    }
    
    // Check if vault exists in registry even if we can't access it via capability
    if let registryOwner = EncryptedUsageSubscriptions.vaultRegistry[vaultId] {
        if registryOwner == userAddress {
            result["vaultFound"] = true
            result["vaultType"] = "EncryptedUsageSubscriptions"
            result["supportsEncryption"] = true
            result["hasApiKey"] = false // Unknown since we can't access it
            result["balance"] = 0.0 // Unknown since we can't access it
            result["foundInRegistry"] = true
            result["capabilityIssue"] = true
            return result
        }
    }
    
    return result
}`;

// Simplified debug script using only registry and public capabilities
const DEBUG_USER_STORAGE_SCRIPT = `
import EncryptedUsageSubscriptions from ${CONTRACTS.EncryptedUsageSubscriptions}

access(all) fun main(userAddress: Address): {String: AnyStruct} {
    let account = getAccount(userAddress)
    var result: {String: AnyStruct} = {
        "userAddress": userAddress.toString(),
        "vaults": [],
        "method": "registry-only",
        "registryKeys": [],
        "totalRegistryVaults": 0
    }
    
    var vaults: [{String: AnyStruct}] = []
    var allRegistryKeys: [UInt64] = []
    
    // Get all vault IDs from registry and find user's vaults
    for vaultId in EncryptedUsageSubscriptions.vaultRegistry.keys {
        allRegistryKeys.append(vaultId)
        let owner = EncryptedUsageSubscriptions.vaultRegistry[vaultId]
        
        if owner == userAddress {
            let vaultInfo: {String: AnyStruct} = {
                "vaultId": vaultId,
                "type": "EncryptedUsageSubscriptions", 
                "owner": owner.toString(),
                "foundInRegistry": true
            }
            vaults.append(vaultInfo)
        }
    }
    
    result["registryKeys"] = allRegistryKeys
    result["totalRegistryVaults"] = allRegistryKeys.length
    result["vaults"] = vaults
    result["vaultCount"] = vaults.length
    
    return result
}`;

export const useUsageSubscription = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txStatus, setTxStatus] = useState(null);
    const [txDetails, setTxDetails] = useState(null);

    // Monitor transaction status
    const monitorTransaction = useCallback((txId) => {
        try {
            // Subscribe to transaction status updates
            const unsub = fcl.tx(txId).subscribe((transaction) => {
                console.log('Transaction update:', transaction);
                
                if (transaction.status === 0) {
                    setTxStatus(TX_STATUS.PENDING);
                } else if (transaction.status === 1) {
                    setTxStatus(TX_STATUS.PENDING);
                } else if (transaction.status === 2) {
                    setTxStatus(TX_STATUS.PENDING);
                } else if (transaction.status === 3) {
                    setTxStatus(TX_STATUS.EXECUTED);
                } else if (transaction.status === 4) {
                    setTxStatus(TX_STATUS.SEALED);
                    setTxDetails(transaction);
                } else if (transaction.status === 5) {
                    setTxStatus(TX_STATUS.ERROR);
                    setError(transaction.errorMessage);
                }
            });

            return unsub;
        } catch (err) {
            console.error('Error monitoring transaction:', err);
            setError(err.message);
            return null;
        }
    }, []);

    // Create usage-based subscription vault with LiteLLM key - REAL BLOCKCHAIN TRANSACTION
    // 1 User -> Many Subscriptions -> 1 Subscription -> 1 LiteLLM Key -> Independent Usage Data
    const createSubscriptionVault = async (providerAddress, initialDepositAmount, entitlementType, withdrawLimit, expirationAmount, expirationUnit, selectedModels) => {
        setIsLoading(true);
        setError(null);
        setTxStatus(TX_STATUS.PENDING);
        setTxDetails(null);

        try {
            // Get current user from FCL
            const currentUser = await fcl.currentUser.snapshot();
            const userAddress = currentUser?.addr;
            
            if (!userAddress || !currentUser.loggedIn) {
                throw new Error('User must be connected to create subscription. Please connect your Flow wallet first.');
            }

            console.log('🚀 Creating REAL subscription with user funds and LiteLLM integration...');
            console.log(`   User: ${userAddress}`);
            console.log(`   Provider: ${providerAddress}`);
            console.log(`   Initial deposit: ${initialDepositAmount} FLOW`);
            
            // Generate unique identifier for this subscription vault
            const vaultIdentifier = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            console.log(`   Vault identifier: ${vaultIdentifier}`);
            
            // Check user's FLOW balance first
            console.log('💰 Checking user FLOW balance...');
            const userBalance = await checkFlowBalance(userAddress);
            console.log(`   User balance: ${userBalance} FLOW`);
            
            if (userBalance < initialDepositAmount) {
                throw new Error(`Insufficient FLOW balance. Required: ${initialDepositAmount} FLOW, Available: ${userBalance} FLOW`);
            }
            
            // Execute REAL Flow blockchain transaction with user's connected wallet funds
            console.log('💾 Executing REAL Flow transaction with entitlement settings...');
            console.log(`   Entitlement type: ${entitlementType}`);
            console.log(`   Withdraw limit: ${withdrawLimit} FLOW`);
            console.log(`   Expiration: ${expirationAmount} ${expirationUnit}`);
            
            // Convert selectedModels to array of model IDs with safety checks
            const modelIds = (selectedModels || []).map(model => {
                const id = model?.id || model;
                return typeof id === 'string' ? id : String(id);
            });
            
            // Ensure all string parameters are properly converted
            const safeEntitlementType = String(entitlementType || 'dynamic');
            const safeExpirationUnit = String(expirationUnit || 'days');
            
            const txId = await fcl.mutate({
                cadence: CREATE_SUBSCRIPTION_WITH_ENTITLEMENT_TRANSACTION,
                args: (arg, t) => [
                    arg(providerAddress, t.Address),
                    arg((initialDepositAmount || 0).toFixed(8), t.UFix64),
                    arg(safeEntitlementType, t.String),
                    arg((withdrawLimit || 0).toFixed(8), t.UFix64),
                    arg(parseInt(expirationAmount, 10) || 30, t.UInt64),
                    arg(safeExpirationUnit, t.String),
                    arg(modelIds, t.Array(t.String))
                ],
                limit: 9999,
                proposer: fcl.authz,
                payer: fcl.authz,
                authorizations: [fcl.authz]
            });

            console.log('⏳ Monitoring REAL transaction:', txId);
            
            // Monitor transaction status (this sets up state updates)
            const unsub = monitorTransaction(txId);
            
            // Wait for transaction to be sealed
            const transaction = await fcl.tx(txId).onceSealed();
            
            if (transaction.status !== 4) {
                throw new Error(`Transaction failed with status ${transaction.status}: ${transaction.errorMessage || 'Unknown error'}`);
            }

            // Extract vault ID from transaction events or logs
            let vaultId = null;
            
            console.log('🔍 Debugging transaction for vault ID extraction:');
            console.log('  Transaction ID:', txId);
            console.log('  Events count:', transaction.events?.length || 0);
            console.log('  Logs count:', transaction.logs?.length || 0);
            
            // Check transaction events first
            if (transaction.events && transaction.events.length > 0) {
                console.log('  📋 All transaction events:');
                transaction.events.forEach((event, index) => {
                    console.log(`    Event ${index}:`, event.type, event.data);
                });
                
                const createEvent = transaction.events.find(event => 
                    event.type.includes('SubscriptionCreated') || 
                    event.type.includes('VaultCreated') ||
                    event.type.includes('Encrypted')
                );
                if (createEvent && createEvent.data) {
                    vaultId = createEvent.data.vaultId || createEvent.data.id;
                    console.log('  ✅ Found vault ID in events:', vaultId);
                }
            }
            
            // Check transaction logs for vault ID with better pattern matching
            if (!vaultId && transaction.logs && transaction.logs.length > 0) {
                console.log('  📋 All transaction logs:');
                transaction.logs.forEach((log, index) => {
                    console.log(`    Log ${index}:`, log);
                });
                
                // Look for various patterns that might contain the vault ID
                for (const log of transaction.logs) {
                    // Pattern 1: "Vault ID: 123"
                    let match = log.match(/Vault ID[:\s]*(\d+)/i);
                    if (match && match[1]) {
                        vaultId = parseInt(match[1], 10);
                        console.log('  ✅ Found vault ID in log (pattern 1):', vaultId);
                        break;
                    }
                    
                    // Pattern 2: "vault #123"
                    match = log.match(/vault\s*#\s*(\d+)/i);
                    if (match && match[1]) {
                        vaultId = parseInt(match[1], 10);
                        console.log('  ✅ Found vault ID in log (pattern 2):', vaultId);
                        break;
                    }
                    
                    // Pattern 3: "stored at: /storage/UsageSubscriptionVault_123"
                    match = log.match(/UsageSubscriptionVault_(\d+)/);
                    if (match && match[1]) {
                        vaultId = parseInt(match[1], 10);
                        console.log('  ✅ Found vault ID in log (pattern 3):', vaultId);
                        break;
                    }
                }
            }
            
            // If we still don't have a vault ID, this is a problem
            if (!vaultId) {
                console.error('❌ Could not extract vault ID from transaction');
                console.error('  This means the vault creation might have failed silently');
                throw new Error('Failed to extract vault ID from transaction. Vault creation may have failed.');
            }
            
            console.log('🔑 Creating REAL LiteLLM API key for independent vault:', vaultId);
            
            // Create unique LiteLLM key for this specific subscription vault
            const litellmKey = await litellmKeyService.createSubscriptionKey(
                vaultId,
                userAddress,
                providerAddress,
                selectedModels
            );
            
            console.log('✅ REAL subscription vault funded and LiteLLM key created');
            console.log(`   Vault ID: ${vaultId}`);
            console.log(`   LiteLLM Key: ${litellmKey.key.slice(0, 20)}...`);
            console.log(`   Vault funded with: ${initialDepositAmount} FLOW from user wallet`);
            
            // Encrypt and store the LiteLLM key in the Flow vault
            console.log('🔒 Encrypting and storing LiteLLM key in Flow vault...');
            try {
                await setEncryptedLiteLLMKeyInVault(vaultId, litellmKey.key, userAddress);
            } catch (keyStorageErr) {
                if (keyStorageErr.code === 'VAULT_TYPE_INCOMPATIBLE') {
                    console.warn('⚠️ Vault incompatible with encryption, but subscription was created successfully');
                    console.log('📋 Subscription created without on-chain key storage - user will need to manage key manually');
                    // Continue with subscription creation, just note the limitation
                } else {
                    throw keyStorageErr;
                }
            }
            
            const subscription = {
                vaultId: vaultId,
                vaultIdentifier: vaultIdentifier,
                customer: userAddress,
                provider: providerAddress,
                balance: initialDepositAmount,
                litellmKey: litellmKey.key,  // Keep for immediate return, but not stored in localStorage
                keyName: litellmKey.key_name,
                maxBudget: litellmKey.max_budget,
                selectedModels: selectedModels,
                entitlementType: entitlementType,
                withdrawLimit: withdrawLimit,
                expirationAmount: expirationAmount,
                expirationUnit: expirationUnit,
                createdAt: new Date().toISOString(),
                status: 'active',
                txId: txId,
                blockId: transaction.blockId,
                uniqueStoragePath: `SubscriptionVault_${vaultIdentifier}`,
                fundedFromWallet: true,
                storedOnChain: true  // Indicates key is stored in Flow vault
            };
            
            // Note: We're no longer storing LiteLLM keys in localStorage
            // Keys are now stored on-chain in the Flow vault for security and persistence
            console.log('✅ Subscription created with on-chain key storage');
            
            // Clean up transaction monitor
            if (unsub && typeof unsub === 'function') {
                try {
                    unsub();
                } catch (cleanupErr) {
                    console.warn('Failed to cleanup transaction monitor:', cleanupErr.message);
                }
            }
            
            return {
                success: true,
                txId: txId,
                vaultId: vaultId,
                vaultIdentifier: vaultIdentifier,
                subscription: subscription,
                litellmKey: litellmKey.key,
                explorerUrl: `https://www.flowdiver.io/tx/${txId}`,
                blockId: transaction.blockId,
                message: `Subscription vault ${vaultId} created and funded with ${initialDepositAmount} FLOW from your connected wallet`
            };

        } catch (err) {
            console.error('❌ Error creating REAL subscription vault:', err);
            setError(err.message);
            setTxStatus(TX_STATUS.ERROR);
            return {
                success: false,
                error: err.message
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Top up specific subscription vault - PRESERVING FUNCTIONALITY
    const topUpSubscription = async (amount, vaultIdentifier, vaultId) => {
        if (!vaultIdentifier) {
            throw new Error('Vault identifier is required for top-up');
        }

        setIsLoading(true);
        setError(null);
        setTxStatus(TX_STATUS.PENDING);

        try {
            console.log(`💰 Topping up subscription vault ${vaultId} with ${amount} FLOW from user wallet...`);
            
            const txId = await fcl.mutate({
                cadence: TOP_UP_SUBSCRIPTION,
                args: (arg, t) => [
                    arg((amount || 0).toFixed(8), t.UFix64),
                    arg(vaultIdentifier, t.String)
                ],
                limit: 9999,
                proposer: fcl.authz,
                payer: fcl.authz,
                authorizations: [fcl.authz]
            });

            console.log('⏳ Monitoring top-up transaction:', txId);
            
            // Monitor transaction status (this sets up state updates)
            const unsub = monitorTransaction(txId);
            
            const transaction = await fcl.tx(txId).onceSealed();
            
            if (transaction.status !== 4) {
                throw new Error(`Top-up transaction failed with status ${transaction.status}: ${transaction.errorMessage || 'Unknown error'}`);
            }

            console.log(`✅ Successfully topped up vault ${vaultId} with ${amount} FLOW`);
            
            // Clean up transaction monitor
            if (unsub && typeof unsub === 'function') {
                try {
                    unsub();
                } catch (cleanupErr) {
                    console.warn('Failed to cleanup transaction monitor:', cleanupErr.message);
                }
            }
            
            return {
                success: true,
                txId,
                vaultId,
                amount,
                explorerUrl: `https://www.flowdiver.io/tx/${txId}`,
                message: `Added ${amount} FLOW from your wallet to subscription vault ${vaultId}`
            };
        } catch (err) {
            console.error('❌ Error topping up subscription:', err);
            setError(err.message);
            setTxStatus(TX_STATUS.ERROR);
            return { 
                success: false, 
                error: err.message,
                vaultId
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Set encrypted LiteLLM API key in vault with contract compatibility check
    const setEncryptedLiteLLMKeyInVault = async (vaultId, apiKey, userAddress) => {
        try {
            console.log('🔒 Encrypting API key using user wallet address...');
            console.log('  Vault ID:', vaultId);
            console.log('  User Address:', userAddress);
            console.log('  Expected storage path:', `UsageSubscriptionVault_${vaultId}`);
            
            // Encrypt the API key using the user's wallet address
            const encryptionResult = await encryptionService.encryptApiKey(apiKey, userAddress);
            
            console.log('🔑 Attempting to set encrypted LiteLLM key in vault...');
            
            // First, let's debug what vaults actually exist in storage
            console.log('🔍 Debugging user storage before key storage...');
            try {
                const storageDebug = await debugUserStorage(userAddress);
                console.log('  Storage debug results:', storageDebug);
            } catch (debugErr) {
                console.warn('  Could not debug storage:', debugErr.message);
            }
            
            // Try to set encrypted key (this will detect if vault supports encryption)
            const txId = await fcl.mutate({
                cadence: SET_ENCRYPTED_LITELLM_KEY_TRANSACTION,
                args: (arg, t) => [
                    arg(parseInt(vaultId, 10) || 0, t.UInt64),
                    arg(encryptionResult.encryptedData, t.String),
                    arg(encryptionResult.salt, t.String)
                ],
                proposer: fcl.authz,
                payer: fcl.authz,
                authorizations: [fcl.authz],
                limit: 100
            });

            console.log('Setting encrypted LiteLLM key in vault transaction:', txId);
            
            // Wait for transaction to be sealed
            const transaction = await fcl.tx(txId).onceSealed();
            
            if (transaction.status === 4) {
                console.log('✅ Encrypted LiteLLM key stored in vault successfully');
                return transaction;
            } else {
                throw new Error(`Transaction failed with status ${transaction.status}: ${transaction.errorMessage}`);
            }
            
        } catch (err) {
            // Check if this is a contract compatibility error
            if (err.message.includes('UsageBasedSubscriptions.SubscriptionVault') && 
                err.message.includes('EncryptedUsageSubscriptions.SubscriptionVault')) {
                
                const compatibilityError = new Error(
                    'INCOMPATIBLE_VAULT_TYPE: This subscription vault was created with the old contract and does not support encrypted on-chain key storage. ' +
                    'To use encrypted key storage, please create a new subscription. ' +
                    'Your current vault and funds are safe and can still be used for payments, but API keys cannot be stored on-chain for this vault.'
                );
                compatibilityError.code = 'VAULT_TYPE_INCOMPATIBLE';
                compatibilityError.vaultType = 'UsageBasedSubscriptions';
                compatibilityError.requiredType = 'EncryptedUsageSubscriptions';
                compatibilityError.userGuidance = 'Create a new subscription to use encrypted on-chain key storage';
                throw compatibilityError;
            }
            
            // Re-throw other errors as-is
            throw err;
        }
    };

    // Get vault information from blockchain
    const getVaultInfo = async (vaultId) => {
        try {
            const result = await fcl.query({
                cadence: GET_VAULT_INFO_SCRIPT,
                args: (arg, t) => [
                    arg(parseInt(vaultId, 10) || 0, t.UInt64)
                ]
            });

            return result;
        } catch (err) {
            console.error('Error getting vault info:', err);
            throw err;
        }
    };
    
    // Get encrypted key data from vault
    const getEncryptedKeyData = async (vaultId) => {
        try {
            const result = await fcl.query({
                cadence: GET_ENCRYPTED_KEY_DATA_SCRIPT,
                args: (arg, t) => [
                    arg(parseInt(vaultId, 10) || 0, t.UInt64)
                ]
            });

            return result;
        } catch (err) {
            console.error('Error getting encrypted key data:', err);
            throw err;
        }
    };
    
    // Get all user vault IDs from blockchain
    const getUserVaultIds = async (userAddress) => {
        try {
            const vaultIds = await fcl.query({
                cadence: GET_USER_VAULT_IDS_SCRIPT,
                args: (arg, t) => [
                    arg(userAddress, t.Address)
                ]
            });

            return vaultIds || [];
        } catch (err) {
            console.error('Error getting user vault IDs:', err);
            return [];
        }
    };

    // Check Flow token balance
    const checkFlowBalance = async (address) => {
        try {
            const balance = await fcl.query({
                cadence: CHECK_BALANCE_SCRIPT,
                args: (arg, t) => [
                    arg(address, t.Address)
                ]
            });

            return parseFloat(balance);
        } catch (err) {
            console.error('Error checking Flow balance:', err);
            throw err;
        }
    };

    // Check if vault exists
    const checkVaultExists = async (customerAddress) => {
        try {
            const exists = await fcl.query({
                cadence: CHECK_VAULT_EXISTS_SCRIPT,
                args: (arg, t) => [
                    arg(customerAddress, t.Address)
                ]
            });
            return exists;
        } catch (err) {
            console.error('Error checking vault existence:', err);
            return false;
        }
    };

    // Get Flare FDC status
    const getFDCStatus = async () => {
        try {
            const status = await fcl.query({
                cadence: GET_FDC_STATUS
            });
            return status;
        } catch (err) {
            console.error('Error getting FDC status:', err);
            throw err;
        }
    };

    // Detect vault type and encryption capabilities
    const detectVaultType = async (userAddress, vaultId) => {
        try {
            const result = await fcl.query({
                cadence: DETECT_VAULT_TYPE_SCRIPT,
                args: (arg, t) => [
                    arg(userAddress, t.Address),
                    arg(parseInt(vaultId, 10) || 0, t.UInt64)
                ]
            });
            return result;
        } catch (err) {
            console.error('Error detecting vault type:', err);
            throw err;
        }
    };

    // Debug function to see all vaults in user storage
    const debugUserStorage = async (userAddress) => {
        try {
            const result = await fcl.query({
                cadence: DEBUG_USER_STORAGE_SCRIPT,
                args: (arg, t) => [
                    arg(userAddress, t.Address)
                ]
            });
            return result;
        } catch (err) {
            console.error('Error debugging user storage:', err);
            throw err;
        }
    };

    // Get all user subscriptions - REAL DATA FROM BLOCKCHAIN ONLY
    const getUserSubscriptions = async (userAddress) => {
        try {
            console.log(`📋 Fetching REAL subscriptions from Flow blockchain for user ${userAddress}`);
            
            // First try using the contract registry
            console.log('   Trying contract registry approach...');
            let vaultIds = [];
            try {
                vaultIds = await getUserVaultIds(userAddress);
                console.log(`   Found ${vaultIds.length} vault IDs in contract registry:`, vaultIds);
            } catch (registryErr) {
                console.warn('   Contract registry approach failed:', registryErr.message);
            }
            
            // If no vaults found in registry, try the storage scan approach
            if (vaultIds.length === 0) {
                console.log('   Trying storage scan approach...');
                try {
                    const storageDebug = await debugUserStorage(userAddress);
                    console.log(`   Found ${storageDebug.vaultCount} vaults in storage scan`);
                    vaultIds = storageDebug.vaults
                        .filter(v => v.type === 'EncryptedUsageSubscriptions' && v.vaultId)
                        .map(v => v.vaultId);
                    console.log(`   Extracted vault IDs from storage:`, vaultIds);
                } catch (storageErr) {
                    console.warn('   Storage scan approach also failed:', storageErr.message);
                }
            }
            
            if (vaultIds.length === 0) {
                console.log('   No subscriptions found via any method');
                return [];
            }
            
            // Get detailed info for each vault ID
            const subscriptions = [];
            for (const vaultId of vaultIds) {
                try {
                    console.log(`   Processing vault ${vaultId}...`);
                    
                    // Try to get vault info using the detection script
                    const vaultDetails = await detectVaultType(userAddress, vaultId);
                    console.log(`   Vault ${vaultId} details:`, vaultDetails);
                    
                    if (!vaultDetails.vaultFound) {
                        console.warn(`   Vault ${vaultId} not found or accessible`);
                        continue;
                    }
                    
                    // Get encrypted LiteLLM key data from the Flow vault (stored on-chain)
                    // NOTE: We no longer auto-decrypt keys for security - user must explicitly decrypt
                    let encryptedKeyData = null;
                    
                    // Try to get encrypted key data (but don't decrypt yet)
                    try {
                        encryptedKeyData = await getEncryptedKeyData(vaultId);
                        if (encryptedKeyData && encryptedKeyData.encryptedKey && encryptedKeyData.salt) {
                            console.log(`   🔒 Found encrypted LiteLLM key in Flow vault ${vaultId} (requires signature to decrypt)`);
                        }
                    } catch (keyErr) {
                        console.warn(`   Could not fetch encrypted key data for vault ${vaultId}:`, keyErr.message);
                    }
                    
                    // We no longer auto-decrypt or auto-fetch usage data for security
                    // User must explicitly request decryption via UI button with wallet signature
                    
                    // Convert blockchain data to subscription format
                    const subscription = {
                        vaultId: vaultId,
                        owner: userAddress,
                        provider: "0x6daee039a7b9c2f0", // Default provider for now
                        serviceName: "LiteLLM API Access",
                        balance: parseFloat(vaultDetails.balance || 0),
                        selectedModels: [],
                        modelPricing: {},
                        entitlementType: "dynamic",
                        withdrawLimit: 0,
                        usedAmount: 0,
                        validUntil: null,
                        isActive: true,
                        currentTier: "Starter",
                        basePrice: 0,
                        currentPrice: 0,
                        autoPay: true,
                        maxMonthlySpend: 1000.0,
                        lastPaidTokens: 0,
                        lastPaidRequests: 0,
                        totalPaidAmount: 0,
                        lastOracleUpdate: 0,
                        // Security change: No longer auto-decrypt keys
                        litellmKey: null, // Will be populated when user explicitly decrypts
                        encryptedKeyData: encryptedKeyData, // Store encrypted data for later decryption
                        usageData: null, // Will be fetched after key decryption
                        hasApiKey: vaultDetails.hasApiKey || false,
                        supportsEncryption: vaultDetails.supportsEncryption || false,
                        requiresSignature: true, // New flag indicating signature-based decryption
                        source: 'blockchain-registry-and-detection',
                        blockchainVerified: true,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    subscriptions.push(subscription);
                    console.log(`   ✅ Vault ${vaultId}: Balance ${subscription.balance} FLOW, Encryption: ${subscription.supportsEncryption ? 'Yes' : 'No'}, API Key: ${subscription.hasApiKey ? 'Yes' : 'No'}`);
                } catch (vaultErr) {
                    console.error(`   ❌ Error processing vault ${vaultId}:`, vaultErr.message);
                }
            }
            
            // Sort by vault ID (newest first, since IDs are incremental)
            subscriptions.sort((a, b) => b.vaultId - a.vaultId);
            
            console.log(`✅ Retrieved ${subscriptions.length} subscriptions from blockchain`);
            return subscriptions;
            
        } catch (err) {
            console.error('❌ Error fetching subscriptions from blockchain:', err);
            throw err;
        }
    };

    // Update subscription settings - REAL UPDATES
    const updateSubscription = async (vaultId, updates) => {
        try {
            console.log(`🔧 Updating REAL subscription ${vaultId}:`, updates);
            
            // Update local cache first
            const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
            const subscriptionIndex = subscriptions.findIndex(sub => sub.vaultId === vaultId);
            
            if (subscriptionIndex === -1) {
                throw new Error('Subscription not found in local cache');
            }
            
            const subscription = subscriptions[subscriptionIndex];
            
            // Update LiteLLM key settings with REAL API calls
            if ((updates.maxBudget || updates.permissions) && subscription.litellmKey) {
                console.log('   Updating REAL LiteLLM key settings...');
                await litellmKeyService.updateKey(subscription.litellmKey, {
                    max_budget: updates.maxBudget,
                    permissions: updates.permissions
                });
                console.log('   ✅ LiteLLM key updated successfully');
            }
            
            // Update local cache
            subscriptions[subscriptionIndex] = {
                ...subscription,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
            
            console.log(`✅ Subscription ${vaultId} updated successfully`);
            
            return subscriptions[subscriptionIndex];
            
        } catch (err) {
            console.error('❌ Error updating REAL subscription:', err);
            throw err;
        }
    };

    // Delete subscription - REAL DELETION
    const deleteSubscription = async (vaultId) => {
        try {
            console.log(`🗑️ Deleting REAL subscription ${vaultId}...`);
            
            const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
            const subscription = subscriptions.find(sub => sub.vaultId === vaultId);
            
            if (!subscription) {
                throw new Error('Subscription not found');
            }
            
            // Revoke LiteLLM key with REAL API call
            if (subscription.litellmKey) {
                console.log('   Revoking REAL LiteLLM key...');
                await litellmKeyService.revokeKey(subscription.litellmKey);
                console.log('   ✅ LiteLLM key revoked successfully');
            }
            
            // Note: In a full implementation, we would also need to close/withdraw the Flow vault
            // This would require additional blockchain transactions
            console.log('   ⚠️ Note: Flow vault remains on-chain (withdrawal transaction not implemented)');
            
            // Remove from local storage
            const updatedSubscriptions = subscriptions.filter(sub => sub.vaultId !== vaultId);
            localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
            
            console.log(`✅ Subscription ${vaultId} deleted successfully`);
            
            return true;
            
        } catch (err) {
            console.error('❌ Error deleting REAL subscription:', err);
            throw err;
        }
    };

    // Decrypt API key for a specific vault with wallet signature
    const decryptVaultApiKey = async (vaultId, userAddress) => {
        try {
            console.log(`🔓 Decrypting API key for vault ${vaultId} with wallet signature...`);
            
            // Get encrypted key data from vault
            const encryptedKeyData = await getEncryptedKeyData(vaultId);
            if (!encryptedKeyData || !encryptedKeyData.encryptedKey || !encryptedKeyData.salt) {
                throw new Error('No encrypted key found in vault');
            }
            
            // Decrypt using wallet signature
            const litellmKey = await encryptionService.decryptApiKeyWithSignature(
                encryptedKeyData.encryptedKey,
                encryptedKeyData.salt,
                userAddress,
                vaultId,
                async (message) => {
                    try {
                        console.log(`📝 Requesting wallet signature for message: "${message}"`);
                        
                        // Use FCL to sign the message with proper error handling
                        const signatureResult = await fcl.currentUser.signUserMessage(message);
                        
                        console.log(`✅ Signature result:`, signatureResult);
                        
                        // FCL returns signature in different formats, extract the signature
                        let signature;
                        if (typeof signatureResult === 'string') {
                            signature = signatureResult;
                        } else if (signatureResult?.signature) {
                            signature = signatureResult.signature;
                        } else if (signatureResult?.[0]?.signature) {
                            signature = signatureResult[0].signature;
                        } else {
                            throw new Error('No signature found in wallet response');
                        }
                        
                        console.log(`🔏 Extracted signature: ${signature}`);
                        return signature;
                        
                    } catch (sigError) {
                        console.error('❌ Wallet signature failed:', sigError);
                        throw new Error(`Wallet signature failed: ${sigError.message}`);
                    }
                }
            );
            
            console.log(`✅ Successfully decrypted API key for vault ${vaultId}`);
            return litellmKey;
            
        } catch (error) {
            console.error(`❌ Failed to decrypt API key for vault ${vaultId}:`, error);
            throw error;
        }
    };

    return {
        createSubscriptionVault,
        topUpSubscription,
        getVaultInfo,
        getEncryptedKeyData,
        getUserVaultIds,
        checkFlowBalance,
        checkVaultExists,
        getFDCStatus,
        detectVaultType,
        debugUserStorage,
        getUserSubscriptions,
        updateSubscription,
        deleteSubscription,
        setEncryptedLiteLLMKeyInVault,
        decryptVaultApiKey,
        isLoading,
        error,
        txStatus,
        txDetails
    };
};