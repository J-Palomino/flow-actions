const LiteLLMFlareConnector = require('./litellm-flare-connector');

async function testConnector() {
    console.log('🧪 Testing LiteLLM → Flare Connector...');
    
    const connector = new LiteLLMFlareConnector({
        litellmApiUrl: process.env.LITELLM_API_URL || 'https://llm.p10p.io',
        litellmApiKey: process.env.LITELLM_API_KEY || 'test-key',
        flareEndpoint: process.env.FLARE_ENDPOINT || 'https://coston2-api.flare.network/ext/bc/C/rpc',
        pollInterval: 10000 // 10 seconds for testing
    });
    
    console.log('📊 Connector Status:', connector.getStatus());
    
    // Test without actually starting
    console.log('✅ Connector initialized successfully!');
    console.log('💡 To run full test, configure .env file and restart');
}

testConnector().catch(console.error);
