import React from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { FlowWalletConnectors } from '@dynamic-labs/flow';
import { DYNAMIC_CONFIG, DYNAMIC_THEME } from '../config/dynamicConfig';

const DynamicProvider = ({ children }) => {
    return (
        <DynamicContextProvider
            settings={{
                environmentId: DYNAMIC_CONFIG.environmentId,
                walletConnectors: [FlowWalletConnectors],
                networks: DYNAMIC_CONFIG.networks,
                handlers: DYNAMIC_CONFIG.handlers,
                walletConnectorExtensions: DYNAMIC_CONFIG.walletConnectorExtensions,
                appName: 'FlareFlow.link',
                appLogoUrl: 'https://placekitten.com/g/200/200',
                theme: DYNAMIC_THEME.theme,
                variant: DYNAMIC_THEME.variant,
                defaultChain: 'flow',
            }}
        >
            {children}
        </DynamicContextProvider>
    );
};

export default DynamicProvider;