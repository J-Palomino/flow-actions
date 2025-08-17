import { useState } from 'react';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';

const CREATE_SUBSCRIPTION_TRANSACTION = `
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7
import SimpleUsageSubscriptions from 0x7ee75d81c7229a61

transaction(providerAddress: Address, initialDeposit: UFix64) {
    let vault: @SimpleUsageSubscriptions.SubscriptionVault
    
    prepare(customer: auth(BorrowValue, Storage) &Account) {
        // Withdraw initial deposit from customer's FLOW vault
        let flowVaultRef = customer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        let depositVault <- flowVaultRef.withdraw(amount: initialDeposit) as! @FlowToken.Vault
        
        // Create subscription vault
        self.vault <- SimpleUsageSubscriptions.createSubscriptionVault(
            customer: customer.address,
            provider: providerAddress,
            initialDeposit: <- depositVault
        )
    }
    
    execute {
        // Store vault in customer's account
        customer.storage.save(<- self.vault, to: SimpleUsageSubscriptions.VaultStoragePath)
        
        // Create public capability for provider access
        let vaultCap = customer.capabilities.storage.issue<&SimpleUsageSubscriptions.SubscriptionVault>(
            SimpleUsageSubscriptions.VaultStoragePath
        )
        customer.capabilities.publish(vaultCap, at: SimpleUsageSubscriptions.VaultPublicPath)
    }
}`;

const GET_VAULT_INFO_SCRIPT = `
import SimpleUsageSubscriptions from 0x7ee75d81c7229a61

access(all) fun main(customerAddress: Address): {String: AnyStruct}? {
    let account = getAccount(customerAddress)
    
    if let vaultRef = account.storage.borrow<&SimpleUsageSubscriptions.SubscriptionVault>(
        from: SimpleUsageSubscriptions.VaultStoragePath
    ) {
        return vaultRef.getInfo()
    }
    
    return nil
}`;

const CHECK_BALANCE_SCRIPT = `
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    let vaultRef = account.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance)
        .borrow() ?? panic("Could not borrow Flow token vault")
    
    return vaultRef.balance
}`;

export const useUsageSubscription = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txStatus, setTxStatus] = useState(null);

    // Create usage-based subscription vault
    const createSubscriptionVault = async (providerAddress, initialDepositAmount) => {
        setIsLoading(true);
        setError(null);
        setTxStatus('PENDING');

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
            setTxStatus('SUBMITTED');

            // Wait for transaction to be sealed
            const transaction = await fcl.tx(txId).onceSealed();
            
            if (transaction.status === 4) {
                setTxStatus('SUCCESS');
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
                    transaction
                };
            } else {
                throw new Error('Transaction failed');
            }

        } catch (err) {
            console.error('Error creating subscription vault:', err);
            setError(err.message);
            setTxStatus('ERROR');
            return {
                success: false,
                error: err.message
            };
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

    return {
        createSubscriptionVault,
        getVaultInfo,
        checkFlowBalance,
        isLoading,
        error,
        txStatus
    };
};