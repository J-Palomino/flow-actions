/**
 * Test spend/logs endpoint specifically
 */

const axios = require('axios');
require('dotenv').config();

async function testSpendLogs() {
    const baseUrl = process.env.LITELLM_API_URL;
    const apiKey = process.env.LITELLM_API_KEY;
    
    console.log('🧪 Testing spend/logs endpoint...');
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET'}`);
    console.log('');
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Test spend/logs with no parameters first
        console.log('🔍 Testing /spend/logs (no params)...');
        const response1 = await axios.get(`${baseUrl}/spend/logs`, {
            headers,
            timeout: 10000
        });
        
        console.log(`✅ spend/logs: ${response1.status}`);
        console.log('Sample data:', JSON.stringify(response1.data, null, 2));
        
    } catch (error) {
        console.log(`❌ spend/logs (no params): ${error.response?.status} - ${error.message}`);
        if (error.response?.data) {
            console.log('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
    
    console.log('');
    
    try {
        // Test with date parameters
        console.log('🔍 Testing /spend/logs (with date params)...');
        const response2 = await axios.get(`${baseUrl}/spend/logs`, {
            headers,
            params: {
                start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
                end_date: new Date().toISOString()
            },
            timeout: 10000
        });
        
        console.log(`✅ spend/logs (with dates): ${response2.status}`);
        console.log('Data count:', Array.isArray(response2.data) ? response2.data.length : 'Not array');
        if (Array.isArray(response2.data) && response2.data.length > 0) {
            console.log('First record:', JSON.stringify(response2.data[0], null, 2));
        }
        
    } catch (error) {
        console.log(`❌ spend/logs (with dates): ${error.response?.status} - ${error.message}`);
        if (error.response?.data) {
            console.log('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
    
    console.log('');
    
    try {
        // Test global spend logs
        console.log('🔍 Testing /global/spend/logs...');
        const response3 = await axios.get(`${baseUrl}/global/spend/logs`, {
            headers,
            timeout: 10000
        });
        
        console.log(`✅ global/spend/logs: ${response3.status}`);
        console.log('Global data:', JSON.stringify(response3.data, null, 2));
        
    } catch (error) {
        console.log(`❌ global/spend/logs: ${error.response?.status} - ${error.message}`);
        if (error.response?.data) {
            console.log('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testSpendLogs().catch(console.error);