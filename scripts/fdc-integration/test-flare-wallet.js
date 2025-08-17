
const axios = require('axios');

async function testFlareWallet() {
    const address = '0x1c4763bb5a59dc077ebdda4fb66a00246997f438';
    const privateKey = '0x6558b8d9255bcce8fc648c0f6becd45fd0c43d6b373521041eef39ae25f3404b';
    const endpoint = 'https://coston2-api.flare.network/ext/bc/C/rpc';
    
    console.log('🧪 Testing Flare wallet...');
    console.log(`📍 Address: ${address}`);
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
        console.log(`💰 Balance: ${balance} C2FLR`);
        
        if (balance === 0) {
            console.log('⚠️  No balance found. Get test tokens:');
            console.log('   1. Visit: https://faucet.flare.network/coston2');
            console.log(`   2. Enter: ${address}`);
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
        console.log(`📊 Latest block: ${blockNumber}`);
        console.log('✅ Flare network connection successful!');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('🔧 Check your internet connection and try again');
    }
}

testFlareWallet();
