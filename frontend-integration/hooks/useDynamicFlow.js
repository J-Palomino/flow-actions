import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import * as fcl from '@onflow/fcl';

export const useDynamicFlow = () => {
    const { primaryWallet, user, setShowAuthFlow, handleLogOut } = useDynamicContext();
    const [flowUser, setFlowUser] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Convert Dynamic wallet to FCL-compatible user object
    useEffect(() => {
        if (primaryWallet && user) {
            const flowUserObject = {
                addr: primaryWallet.address,
                cid: primaryWallet.connector?.wallet?.id,
                expiresAt: null,
                f_type: 'User',
                f_vsn: '1.0.0',
                loggedIn: true,
                services: [{
                    f_type: 'Service',
                    f_vsn: '1.0.0',
                    type: 'authn',
                    method: 'dynamic',
                    endpoint: 'dynamic://wallet',
                    uid: primaryWallet.id,
                    id: primaryWallet.address,
                    identity: {
                        address: primaryWallet.address,
                        keyId: null,
                    },
                    provider: {
                        address: null,
                        name: primaryWallet.connector?.name || 'Dynamic',
                        icon: null,
                        description: 'Connected via Dynamic'
                    }
                }]
            };

            console.log('🔗 Dynamic wallet connected to Flow:', flowUserObject);
            setFlowUser(flowUserObject);

            // Update FCL current user
            fcl.currentUser.set(flowUserObject);
        } else {
            console.log('🔌 Dynamic wallet disconnected from Flow');
            setFlowUser(null);
            fcl.currentUser.set(null);
        }
    }, [primaryWallet, user]);

    const connectWallet = async () => {
        try {
            setIsConnecting(true);
            console.log('🔗 Connecting Dynamic wallet...');
            setShowAuthFlow(true);
        } catch (error) {
            console.error('❌ Dynamic wallet connection failed:', error);
            throw error;
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = async () => {
        try {
            console.log('🔌 Disconnecting Dynamic wallet...');
            await handleLogOut();
            setFlowUser(null);
            fcl.currentUser.set(null);
        } catch (error) {
            console.error('❌ Dynamic wallet disconnection failed:', error);
            throw error;
        }
    };

    const signTransaction = async (transaction) => {
        if (!primaryWallet) {
            throw new Error('No wallet connected');
        }

        try {
            console.log('✍️ Signing transaction with Dynamic wallet...');
            // Use Dynamic's signing capabilities
            const signature = await primaryWallet.connector.signTransaction(transaction);
            console.log('✅ Transaction signed successfully');
            return signature;
        } catch (error) {
            console.error('❌ Transaction signing failed:', error);
            throw error;
        }
    };

    return {
        flowUser,
        isConnected: !!flowUser,
        isConnecting,
        primaryWallet,
        dynamicUser: user,
        connectWallet,
        disconnectWallet,
        signTransaction,
    };
};