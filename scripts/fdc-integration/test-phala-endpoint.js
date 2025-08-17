/**
 * Test script for Phala Network LiteLLM endpoint
 * Tests connectivity and API structure for the specific endpoint
 */

const axios = require('axios');

const PHALA_LITELLM_ENDPOINT = 'https://c1d44f34775bd04d0ec7a1f603cc2ff895d7d881-4000.dstack-prod7.phala.network';

async function testPhalaEndpoint() {
    console.log('🧪 Testing Phala Network LiteLLM Endpoint...');
    console.log(`📡 Endpoint: ${PHALA_LITELLM_ENDPOINT}`);
    console.log('');

    // Test 1: Basic connectivity
    console.log('1️⃣  Testing basic connectivity...');
    try {
        const response = await axios.get(`${PHALA_LITELLM_ENDPOINT}/health`, {
            timeout: 10000
        });
        console.log(`✅ Health check successful: ${response.status}`);
        console.log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
        console.log(`⚠️  Health endpoint not available (${error.response?.status || error.message})`);
        console.log('ℹ️  This is normal for some LiteLLM deployments');
    }
    console.log('');

    // Test 2: Check available endpoints
    console.log('2️⃣  Discovering available endpoints...');
    const endpoints = [
        '/v1/models',
        '/models', 
        '/usage',
        '/analytics/usage',
        '/v1/usage',
        '/api/usage',
        '/stats',
        '/metrics'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${PHALA_LITELLM_ENDPOINT}${endpoint}`, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FlareOracleConnector/1.0'
                }
            });
            console.log(`✅ ${endpoint}: Available (${response.status})`);
            
            // Show sample data for usage endpoints
            if (endpoint.includes('usage') || endpoint.includes('stats')) {
                console.log(`   📊 Sample response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
            }
        } catch (error) {
            const status = error.response?.status;
            if (status === 401) {
                console.log(`🔐 ${endpoint}: Requires authentication (${status})`);
            } else if (status === 404) {
                console.log(`❌ ${endpoint}: Not found (${status})`);
            } else {
                console.log(`⚠️  ${endpoint}: Error (${status || error.message})`);
            }
        }
    }
    console.log('');

    // Test 3: Test completion endpoint (if available)
    console.log('3️⃣  Testing completion endpoint...');
    try {
        const response = await axios.post(`${PHALA_LITELLM_ENDPOINT}/v1/chat/completions`, {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: 'Hello, this is a test message for usage tracking.' }
            ],
            max_tokens: 10,
            user: 'test_vault_123' // This would map to vault ID 123
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-key',
                'User-Agent': 'FlareOracleConnector/1.0'
            },
            timeout: 15000
        });
        
        console.log('✅ Completion endpoint available');
        console.log(`📊 Response structure: ${Object.keys(response.data).join(', ')}`);
        
        // Check if usage is tracked
        if (response.data.usage) {
            console.log(`📈 Usage tracking detected:`);
            console.log(`   - Prompt tokens: ${response.data.usage.prompt_tokens}`);
            console.log(`   - Completion tokens: ${response.data.usage.completion_tokens}`);
            console.log(`   - Total tokens: ${response.data.usage.total_tokens}`);
        }
        
    } catch (error) {
        const status = error.response?.status;
        if (status === 401) {
            console.log('🔐 Completion endpoint requires valid API key (expected)');
        } else if (status === 400) {
            console.log('⚠️  Completion endpoint available but request format may need adjustment');
        } else {
            console.log(`❌ Completion endpoint error: ${status || error.message}`);
        }
    }
    console.log('');

    // Test 4: Check CORS and headers
    console.log('4️⃣  Checking CORS and response headers...');
    try {
        const response = await axios.options(PHALA_LITELLM_ENDPOINT, {
            timeout: 5000
        });
        
        const corsHeaders = {
            'access-control-allow-origin': response.headers['access-control-allow-origin'],
            'access-control-allow-methods': response.headers['access-control-allow-methods'],
            'access-control-allow-headers': response.headers['access-control-allow-headers']
        };
        
        console.log('✅ CORS headers:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            if (value) console.log(`   ${key}: ${value}`);
        });
        
    } catch (error) {
        console.log('ℹ️  CORS preflight not supported (normal for API endpoints)');
    }
    console.log('');

    // Test 5: Generate configuration
    console.log('5️⃣  Generating configuration for your endpoint...');
    
    const config = {
        litellmApiUrl: PHALA_LITELLM_ENDPOINT,
        recommendedEndpoints: {
            completion: '/v1/chat/completions',
            models: '/v1/models',
            usage: '/usage || /v1/usage || /api/usage',
            health: '/health'
        },
        notes: [
            'This is a Phala Network deployment on dstack infrastructure',
            'Endpoint appears to be running on port 4000',
            'Usage tracking may require specific API key configuration',
            'Monitor logs for actual usage data structure'
        ],
        nextSteps: [
            '1. Get valid API key for this endpoint',
            '2. Test with real API key to verify usage tracking',
            '3. Configure user mapping strategy',
            '4. Start the Flare connector with this endpoint'
        ]
    };
    
    console.log('📝 Configuration summary:');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    
    console.log('🎯 To use this endpoint with Flare oracle:');
    console.log('1. Copy the .env.example to .env');
    console.log('2. Set LITELLM_API_URL to the Phala endpoint');
    console.log('3. Add your API key');
    console.log('4. Run: npm start');
    console.log('');
    
    return config;
}

// Run the test if called directly
if (require.main === module) {
    testPhalaEndpoint().catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
}

module.exports = { testPhalaEndpoint, PHALA_LITELLM_ENDPOINT };