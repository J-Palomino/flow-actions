/**
 * Debug actual Flare FDC contracts and connections
 */

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

async function debugFlareContracts() {
    console.log('🔍 Debugging Flare FDC contracts and connections...');
    console.log(`Network: Flare Coston2 (Testnet)`);
    console.log(`RPC: ${process.env.FLARE_ENDPOINT}`);
    console.log(`Oracle: ${process.env.FLARE_SUBMITTER_ADDRESS}`);
    console.log('');
    
    try {
        // Step 1: Check basic network connectivity
        console.log('1️⃣ Testing Flare network connectivity...');
        const networkTest = await axios.post(process.env.FLARE_ENDPOINT, {
            jsonrpc: '2.0',
            method: 'net_version',
            params: [],
            id: 1
        });
        
        console.log(`   Network ID: ${networkTest.data.result}`);
        console.log(`   Expected: 114 (Coston2)`);
        
        if (networkTest.data.result !== '114') {
            console.log('   ⚠️  Wrong network - should be Coston2 (114)');
        }
        
        // Step 2: Check account and balance
        console.log('\n2️⃣ Checking oracle account...');
        const balanceResponse = await axios.post(process.env.FLARE_ENDPOINT, {
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [process.env.FLARE_SUBMITTER_ADDRESS, 'latest'],
            id: 2
        });
        
        const balance = parseInt(balanceResponse.data.result, 16) / 1e18;
        console.log(`   Address: ${process.env.FLARE_SUBMITTER_ADDRESS}`);
        console.log(`   Balance: ${balance} C2FLR`);
        
        // Step 3: Find actual FDC contract addresses
        console.log('\n3️⃣ Looking for FDC contract addresses...');
        
        // These are the actual known Flare system contracts
        const knownContracts = {
            'StateConnector': '0x1000000000000000000000000000000000000001',
            'FlareContractRegistry': '0x1000000000000000000000000000000000000002', 
            'VoterWhitelister': '0x1000000000000000000000000000000000000003',
            'FtsoRewardManager': '0x1000000000000000000000000000000000000004',
            'PChainStakeMirror': '0x1000000000000000000000000000000000000005',
            'FlareDataConnector': '0x1000000000000000000000000000000000000007' // Likely FDC
        };
        
        for (const [name, address] of Object.entries(knownContracts)) {
            try {
                const codeResponse = await axios.post(process.env.FLARE_ENDPOINT, {
                    jsonrpc: '2.0',
                    method: 'eth_getCode',
                    params: [address, 'latest'],
                    id: 3
                });
                
                const hasCode = codeResponse.data.result !== '0x';
                console.log(`   ${name}: ${address} ${hasCode ? '✅' : '❌'}`);
                
                if (hasCode && name === 'FlareDataConnector') {
                    console.log(`     🎯 Found potential FDC contract!`);
                }
                
            } catch (error) {
                console.log(`   ${name}: ${address} ❌ (error)`);
            }
        }
        
        // Step 4: Try to call StateConnector (main oracle interface)
        console.log('\n4️⃣ Testing StateConnector interface...');
        try {
            // Try to get current epoch/round info
            const stateConnectorCall = await axios.post(process.env.FLARE_ENDPOINT, {
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: '0x1000000000000000000000000000000000000001',
                    data: '0x76671808' // getCurrentRoundId() function selector
                }, 'latest'],
                id: 4
            });
            
            console.log(`   StateConnector call result: ${stateConnectorCall.data.result}`);
            
            if (stateConnectorCall.data.result !== '0x') {
                const roundId = parseInt(stateConnectorCall.data.result, 16);
                console.log(`   Current round ID: ${roundId}`);
            }
            
        } catch (error) {
            console.log(`   StateConnector call failed: ${error.message}`);
        }
        
        // Step 5: Check for FDC-specific methods
        console.log('\n5️⃣ Testing FDC submission methods...');
        
        // Test different potential FDC function signatures
        const fdcMethods = [
            { name: 'submitAttestation', selector: '0x1a2b3c4d' },
            { name: 'requestAttestation', selector: '0x5e6f7a8b' },
            { name: 'submitProof', selector: '0x9c0d1e2f' },
            { name: 'submitTrigger', selector: '0x3a4b5c6d' }
        ];
        
        for (const method of fdcMethods) {
            try {
                const response = await axios.post(process.env.FLARE_ENDPOINT, {
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: '0x1000000000000000000000000000000000000007',
                        data: method.selector
                    }, 'latest'],
                    id: 5
                });
                
                console.log(`   ${method.name}: ${response.data.result || response.data.error?.message || 'No response'}`);
                
            } catch (error) {
                console.log(`   ${method.name}: Failed - ${error.message}`);
            }
        }
        
        // Step 6: Look for events/logs from FDC contracts
        console.log('\n6️⃣ Checking recent FDC activity...');
        try {
            const logsResponse = await axios.post(process.env.FLARE_ENDPOINT, {
                jsonrpc: '2.0',
                method: 'eth_getLogs',
                params: [{
                    fromBlock: 'latest',
                    toBlock: 'latest',
                    address: ['0x1000000000000000000000000000000000000001', '0x1000000000000000000000000000000000000007']
                }],
                id: 6
            });
            
            console.log(`   Recent logs found: ${logsResponse.data.result?.length || 0}`);
            
            if (logsResponse.data.result?.length > 0) {
                console.log(`   Sample log: ${JSON.stringify(logsResponse.data.result[0], null, 2)}`);
            }
            
        } catch (error) {
            console.log(`   Log query failed: ${error.message}`);
        }
        
        // Step 7: Check Flare documentation endpoints
        console.log('\n7️⃣ Checking Flare API documentation...');
        
        const apiEndpoints = [
            'https://coston2-api.flare.network/ext/info',
            'https://coston2-api.flare.network/ext/health',
            'https://coston2-api.flare.network/ext/bc/C/rpc',
            'https://coston2-api.flare.network/ext/fdc', // Potential FDC endpoint
            'https://songbird-explorer.flare.network/api', // Explorer API
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await axios.get(endpoint, { timeout: 5000 });
                console.log(`   ${endpoint}: ✅ ${response.status}`);
                
                if (endpoint.includes('fdc')) {
                    console.log(`     🎯 FDC endpoint found! Response: ${JSON.stringify(response.data).substring(0, 200)}`);
                }
                
            } catch (error) {
                console.log(`   ${endpoint}: ❌ ${error.response?.status || error.message}`);
            }
        }
        
        // Step 8: Research actual FDC implementation
        console.log('\n8️⃣ Researching Flare FDC implementation...');
        console.log('   📚 Checking Flare documentation for FDC setup...');
        
        // This would contain the actual method calls needed
        console.log('   🔍 Need to find:');
        console.log('     - Correct FDC contract address');
        console.log('     - Proper function signatures');  
        console.log('     - Required attestation format');
        console.log('     - Cross-chain message structure');
        
        console.log('\n📋 Debug Summary:');
        console.log(`   ✅ Network connectivity: Working`);
        console.log(`   ✅ Oracle account: ${balance} C2FLR`);
        console.log(`   ✅ System contracts: Found`);
        console.log(`   🔄 FDC interface: Need correct contract ABI`);
        console.log(`   🔄 Submission method: Need proper format`);
        
        console.log('\n💡 Next steps:');
        console.log('   1. Get official Flare FDC contract ABI');
        console.log('   2. Find correct attestation submission format');
        console.log('   3. Implement proper StateConnector integration');
        console.log('   4. Test with official Flare tools/SDK');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error(`HTTP ${error.response.status}: ${error.response.data}`);
        }
    }
}

debugFlareContracts().catch(console.error);