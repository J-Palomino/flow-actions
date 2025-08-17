/**
 * Test LiteLLM endpoints to determine the correct API structure
 */

const axios = require('axios');
require('dotenv').config();

async function testLiteLLMEndpoints() {
    const baseUrl = process.env.LITELLM_API_URL;
    const apiKey = process.env.LITELLM_API_KEY;
    
    console.log('🧪 Testing LiteLLM API endpoints...');
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log('');
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    // Test different endpoint patterns
    const endpoints = [
        '/health',
        '/v1/health', 
        '/usage',
        '/v1/usage',
        '/analytics/usage',
        '/api/usage',
        '/metrics',
        '/stats'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testing: ${endpoint}`);
            const response = await axios.get(`${baseUrl}${endpoint}`, {
                headers,
                timeout: 10000
            });
            
            console.log(`✅ ${endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 200)}...`);
            
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
                if (error.response.data) {
                    console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
                }
            } else {
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
        console.log('');
    }
    
    // Test with different parameters for usage endpoint
    console.log('🔍 Testing usage endpoint with parameters...');
    try {
        const usageResponse = await axios.get(`${baseUrl}/usage`, {
            headers,
            params: {
                limit: 10,
                offset: 0
            },
            timeout: 10000
        });
        
        console.log('✅ Usage endpoint with params successful:');
        console.log(JSON.stringify(usageResponse.data, null, 2));
        
    } catch (error) {
        console.log('❌ Usage endpoint with params failed:', error.response?.status, error.message);
    }
}

testLiteLLMEndpoints().catch(console.error);