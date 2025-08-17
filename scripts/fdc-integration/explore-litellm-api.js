/**
 * Explore the available LiteLLM API endpoints
 */

const axios = require('axios');
require('dotenv').config();

async function exploreLiteLLMAPI() {
    const baseUrl = process.env.LITELLM_API_URL;
    const apiKey = process.env.LITELLM_API_KEY;
    
    console.log('🔍 Exploring LiteLLM API structure...');
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log('');
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Get health info to see what's available
        const healthResponse = await axios.get(`${baseUrl}/health`, { headers });
        console.log('✅ Health endpoint response:');
        console.log(JSON.stringify(healthResponse.data, null, 2));
        console.log('');
        
        // Try common LiteLLM proxy endpoints
        const proxyEndpoints = [
            '/chat/completions',
            '/v1/chat/completions', 
            '/models',
            '/v1/models',
            '/key/info',
            '/key/generate',
            '/user/info',
            '/spend/logs',
            '/spend/report',
            '/global/spend',
            '/global/spend/logs',
            '/ui',
            '/'
        ];
        
        console.log('🔍 Testing LiteLLM proxy endpoints:');
        for (const endpoint of proxyEndpoints) {
            try {
                const response = await axios.get(`${baseUrl}${endpoint}`, {
                    headers,
                    timeout: 5000
                });
                console.log(`✅ ${endpoint}: ${response.status}`);
                
                // If it's models or similar, show some data
                if (endpoint.includes('models') || endpoint.includes('info')) {
                    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 200)}...`);
                }
                
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.log(`⚠️  ${endpoint}: ${error.response?.status || error.message}`);
                }
            }
        }
        
        console.log('');
        console.log('🎯 Based on the health response, this appears to be a LiteLLM proxy.');
        console.log('📊 For usage tracking, we need to:');
        console.log('   1. Check if usage logging is enabled');
        console.log('   2. Find the database/logging backend');
        console.log('   3. Use spend/logs endpoints if available');
        
    } catch (error) {
        console.error('❌ Error exploring API:', error.message);
    }
}

exploreLiteLLMAPI().catch(console.error);