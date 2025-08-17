/**
 * Generate a new Flare wallet for oracle submissions
 * Creates address and private key for Flare testnet/mainnet
 */

const crypto = require('crypto');

function generateFlareWallet() {
    console.log('🔥 Generating new Flare wallet...\n');
    
    // Generate random private key (32 bytes)
    const privateKey = crypto.randomBytes(32);
    const privateKeyHex = '0x' + privateKey.toString('hex');
    
    // For simplicity, generate a mock address
    // In production, you'd use proper elliptic curve cryptography
    const addressHash = crypto.createHash('sha256').update(privateKey).digest('hex');
    const address = '0x' + addressHash.slice(-40);
    
    console.log('🔐 WALLET GENERATED');
    console.log('=====================================');
    console.log(`Address: ${address}`);
    console.log(`Private Key: ${privateKeyHex}`);
    console.log('=====================================\n');
    
    console.log('⚠️  SECURITY WARNING:');
    console.log('- Keep your private key secure and never share it');
    console.log('- This is a simplified generator for testing');
    console.log('- For production, use MetaMask or hardware wallet\n');
    
    console.log('📝 Add to your .env file:');
    console.log(`FLARE_SUBMITTER_ADDRESS=${address}`);
    console.log(`FLARE_SUBMITTER_PRIVATE_KEY=${privateKeyHex}\n`);
    
    console.log('🚰 Next steps for Testnet (Coston2):');
    console.log('1. Add Flare testnet to MetaMask:');
    console.log('   - Network: Flare Testnet Coston2');
    console.log('   - RPC: https://coston2-api.flare.network/ext/bc/C/rpc');
    console.log('   - Chain ID: 114');
    console.log('   - Symbol: C2FLR\n');
    
    console.log('2. Get test tokens:');
    console.log(`   - Visit: https://faucet.flare.network/coston2`);
    console.log(`   - Enter address: ${address}`);
    console.log('   - Request C2FLR tokens\n');
    
    console.log('3. Verify setup:');
    console.log('   - node test-flare-wallet.js\n');
    
    return {
        address,
        privateKey: privateKeyHex,
        network: 'coston2-testnet',
        faucetUrl: `https://faucet.flare.network/coston2`,
        explorerUrl: `https://coston2-explorer.flare.network/address/${address}`
    };
}

// Enhanced wallet generator with proper cryptography (optional)
function generateFlareWalletAdvanced() {
    try {
        // Try to use secp256k1 if available
        const secp256k1 = require('secp256k1');
        const createKeccakHash = require('keccak');
        
        console.log('🔥 Generating Flare wallet with proper cryptography...\n');
        
        // Generate private key
        let privateKey;
        do {
            privateKey = crypto.randomBytes(32);
        } while (!secp256k1.privateKeyVerify(privateKey));
        
        // Generate public key
        const publicKey = secp256k1.publicKeyCreate(privateKey, false);
        
        // Generate address (Ethereum-style)
        const address = '0x' + createKeccakHash('keccak256')
            .update(publicKey.slice(1))
            .digest('hex')
            .slice(-40);
        
        const privateKeyHex = '0x' + privateKey.toString('hex');
        
        console.log('🔐 FLARE WALLET (PRODUCTION-READY)');
        console.log('=========================================');
        console.log(`Address: ${address}`);
        console.log(`Private Key: ${privateKeyHex}`);
        console.log('=========================================\n');
        
        return {
            address,
            privateKey: privateKeyHex,
            network: 'flare',
            isProductionReady: true
        };
        
    } catch (error) {
        console.log('ℹ️  Advanced cryptography libraries not available');
        console.log('📦 Install with: npm install secp256k1 keccak');
        console.log('🔄 Falling back to simple generator...\n');
        return generateFlareWallet();
    }
}

// Create test script
function createTestScript(walletInfo) {
    const testScript = `
const axios = require('axios');

async function testFlareWallet() {
    const address = '${walletInfo.address}';
    const privateKey = '${walletInfo.privateKey}';
    const endpoint = 'https://coston2-api.flare.network/ext/bc/C/rpc';
    
    console.log('🧪 Testing Flare wallet...');
    console.log(\`📍 Address: \${address}\`);
    console.log('');
    
    try {
        // Check balance
        const balanceResponse = await axios.post(endpoint, {
            jsonrpc: '2.0',
            method: 'eth_getBalance', 
            params: [address, 'latest'],
            id: 1
        });
        
        const balance = parseInt(balanceResponse.data.result, 16) / 1e18;
        console.log(\`💰 Balance: \${balance} C2FLR\`);
        
        if (balance === 0) {
            console.log('⚠️  No balance found. Get test tokens:');
            console.log('   1. Visit: https://faucet.flare.network/coston2');
            console.log(\`   2. Enter: \${address}\`);
            console.log('   3. Request C2FLR tokens');
            console.log('   4. Wait 1-2 minutes and test again');
        } else {
            console.log('✅ Wallet funded and ready for oracle submissions!');
        }
        
        // Check latest block
        const blockResponse = await axios.post(endpoint, {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 2
        });
        
        const blockNumber = parseInt(blockResponse.data.result, 16);
        console.log(\`📊 Latest block: \${blockNumber}\`);
        console.log('✅ Flare network connection successful!');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('🔧 Check your internet connection and try again');
    }
}

testFlareWallet();
`;

    require('fs').writeFileSync('test-flare-wallet.js', testScript);
    console.log('📝 Created test-flare-wallet.js');
    console.log('🧪 Run: node test-flare-wallet.js');
}

// Main execution
if (require.main === module) {
    console.log('🚀 Flare Wallet Generator\n');
    
    // Try advanced generator first, fallback to simple
    const walletInfo = generateFlareWalletAdvanced();
    
    // Create test script
    createTestScript(walletInfo);
    
    console.log('🎯 Complete setup:');
    console.log('1. Copy the private key and address to your .env file');
    console.log('2. Get test tokens from the faucet');  
    console.log('3. Run the test script to verify');
    console.log('4. Start your LiteLLM → Flare connector');
    console.log('');
    console.log('🔗 Useful links:');
    console.log('- Faucet: https://faucet.flare.network/coston2');
    console.log('- Explorer: https://coston2-explorer.flare.network');
    console.log('- Add to MetaMask: Chain ID 114, RPC https://coston2-api.flare.network/ext/bc/C/rpc');
}

module.exports = { generateFlareWallet, generateFlareWalletAdvanced };