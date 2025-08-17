import { useState, useCallback } from 'react';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { CONTRACTS, TX_STATUS } from '../config/flowConfig';

// Transaction templates
const CREATE_SUBSCRIPTION_TRANSACTION = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}
import SimpleUsageSubscriptions from ${CONTRACTS.SimpleUsageSubscriptions}

transaction(providerAddress: Address, initialDeposit: UFix64) {
    let vault: @SimpleUsageSubscriptions.SubscriptionVault
    let customer: auth(Storage, Capabilities) &Account
    
    prepare(signer: auth(BorrowValue, Storage, Capabilities) &Account) {
        self.customer = signer
        
        // Withdraw initial deposit from customer's FLOW vault
        let flowVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        let depositVault <- flowVaultRef.withdraw(amount: initialDeposit) as! @FlowToken.Vault
        
        // Create subscription vault
        self.vault <- SimpleUsageSubscriptions.createSubscriptionVault(
            customer: signer.address,
            provider: providerAddress,
            initialDeposit: <- depositVault
        )
        
        log("Subscription vault created with ID: ".concat(self.vault.id.toString()))
    }
    
    execute {
        // Store vault in customer's account
        self.customer.storage.save(<- self.vault, to: SimpleUsageSubscriptions.VaultStoragePath)
        
        // Create public capability for provider access
        let vaultCap = self.customer.capabilities.storage.issue<&SimpleUsageSubscriptions.SubscriptionVault>(
            SimpleUsageSubscriptions.VaultStoragePath
        )
        self.customer.capabilities.publish(vaultCap, at: SimpleUsageSubscriptions.VaultPublicPath)
        
        log("✅ Subscription activated - Provider can now charge based on usage")
    }
}`;

const TOP_UP_SUBSCRIPTION = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}
import SimpleUsageSubscriptions from ${CONTRACTS.SimpleUsageSubscriptions}

transaction(amount: UFix64) {
    prepare(customer: auth(BorrowValue, Storage) &Account) {
        let vaultRef = customer.storage.borrow<&SimpleUsageSubscriptions.SubscriptionVault>(
            from: SimpleUsageSubscriptions.VaultStoragePath
        ) ?? panic("No subscription vault found")
        
        let flowVault = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        let deposit <- flowVault.withdraw(amount: amount)
        vaultRef.deposit(from: <- deposit)
        
        log("Added ".concat(amount.toString()).concat(" FLOW to subscription"))
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

// Query scripts
const GET_VAULT_INFO_SCRIPT = `
import SimpleUsageSubscriptions from ${CONTRACTS.SimpleUsageSubscriptions}

access(all) fun main(customerAddress: Address): {String: AnyStruct}? {
    let account = getAccount(customerAddress)
    
    let vaultRef = account.capabilities.borrow<&SimpleUsageSubscriptions.SubscriptionVault>(
        SimpleUsageSubscriptions.VaultPublicPath
    )
    
    if let vault = vaultRef {
        // Use the contract's getInfo() method instead of individual field access
        let info = vault.getInfo()
        
        // Add the fields that getInfo() doesn't include
        let extendedInfo: {String: AnyStruct} = {
            "vaultId": vault.id,
            "customer": vault.customer,
            "provider": vault.provider
        }
        
        // Merge with getInfo() results
        for key in info.keys {
            extendedInfo[key] = info[key]!
        }
        
        return extendedInfo
    }
    
    return nil
}`;

const CHECK_BALANCE_SCRIPT = `
import FlowToken from ${CONTRACTS.FlowToken}
import FungibleToken from ${CONTRACTS.FungibleToken}

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    let vaultRef = account.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance)
        .borrow() ?? panic("Could not borrow Flow token vault")
    
    return vaultRef.balance
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

export const useUsageSubscription = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txStatus, setTxStatus] = useState(null);
    const [txDetails, setTxDetails] = useState(null);

    // Monitor transaction status
    const monitorTransaction = useCallback(async (txId) => {
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
        }
    }, []);

    // Create usage-based subscription vault
    const createSubscriptionVault = async (providerAddress, initialDepositAmount) => {
        setIsLoading(true);
        setError(null);
        setTxStatus(TX_STATUS.PENDING);
        setTxDetails(null);

        try {
            // Send transaction
            const txId = await fcl.mutate({
                cadence: CREATE_SUBSCRIPTION_TRANSACTION,
                args: (arg, t) => [
                    arg(providerAddress, t.Address),
                    arg(initialDepositAmount.toFixed(8), t.UFix64)
                ],
                proposer: fcl.authz,
                payer: fcl.authz,
                authorizations: [fcl.authz],
                limit: 9999
            });

            console.log('Transaction sent:', txId);
            
            // Monitor transaction
            await monitorTransaction(txId);

            // Wait for transaction to be sealed
            const transaction = await fcl.tx(txId).onceSealed();
            
            if (transaction.status === 4) {
                console.log('Subscription vault created successfully!', transaction);
                
                // Extract vault ID from events
                const subscriptionEvent = transaction.events.find(
                    event => event.type.includes('SubscriptionCreated')
                );
                
                const vaultId = subscriptionEvent?.data?.vaultId || null;
                
                return {
                    success: true,
                    txId,
                    vaultId,
                    transaction,
                    explorerUrl: `https://www.flowdiver.io/tx/${txId}`
                };
            } else {
                throw new Error('Transaction failed');
            }

        } catch (err) {
            console.error('Error creating subscription vault:', err);
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

    // Top up subscription
    const topUpSubscription = async (amount) => {
        setIsLoading(true);
        setError(null);
        setTxStatus(TX_STATUS.PENDING);

        try {
            const txId = await fcl.mutate({
                cadence: TOP_UP_SUBSCRIPTION,
                args: (arg, t) => [
                    arg(amount.toFixed(8), t.UFix64)
                ],
                limit: 9999
            });

            await monitorTransaction(txId);
            const transaction = await fcl.tx(txId).onceSealed();
            
            return {
                success: transaction.status === 4,
                txId,
                explorerUrl: `https://www.flowdiver.io/tx/${txId}`
            };
        } catch (err) {
            console.error('Error topping up subscription:', err);
            setError(err.message);
            setTxStatus(TX_STATUS.ERROR);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Get vault information
    const getVaultInfo = async (customerAddress) => {
        try {
            const result = await fcl.query({
                cadence: GET_VAULT_INFO_SCRIPT,
                args: (arg, t) => [
                    arg(customerAddress, t.Address)
                ]
            });

            return result;
        } catch (err) {
            console.error('Error getting vault info:', err);
            throw err;
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

    return {
        createSubscriptionVault,
        topUpSubscription,
        getVaultInfo,
        checkFlowBalance,
        checkVaultExists,
        getFDCStatus,
        isLoading,
        error,
        txStatus,
        txDetails
    };
};