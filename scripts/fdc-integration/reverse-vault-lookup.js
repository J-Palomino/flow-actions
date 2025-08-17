/**
 * Reverse lookup to find which user/session corresponds to vault 424965
 */

const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

async function findUserForVault424965() {
    console.log('🔍 Finding which user corresponds to vault #424965...');
    console.log('');
    
    try {
        // Get recent usage data from LiteLLM
        const response = await axios.get(`${process.env.LITELLM_API_URL}/spend/logs`, {
            headers: {
                'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
            },
            params: {
                start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date().toISOString()
            }
        });

        const records = response.data.data || response.data || [];
        console.log(`📊 Retrieved ${records.length} usage records`);
        
        // Process first 20 records (same as our original processing)
        const recentRecords = records.slice(0, 20);
        
        for (let i = 0; i < recentRecords.length; i++) {
            const record = recentRecords[i];
            const userId = record.session_id || record.user || record.api_key_alias || `api_user_${i}`;
            
            // Generate vault ID using same algorithm
            const vaultId = crypto.createHash('md5')
                .update(userId)
                .digest('hex')
                .substring(0, 8);
            const key = parseInt(vaultId, 16) % 1000000;
            
            if (key === 424965) {
                console.log('🎯 FOUND MATCH!');
                console.log(`   User/Session: "${userId}"`);
                console.log(`   → Vault ID: ${key}`);
                console.log('');
                console.log('📋 LiteLLM Record Details:');
                console.log(`   Request ID: ${record.request_id || 'N/A'}`);
                console.log(`   Model: ${record.model || 'unknown'}`);
                console.log(`   Tokens: ${record.total_tokens || 0}`);
                console.log(`   Cost: $${record.spend || 0}`);
                console.log(`   Timestamp: ${record.startTime || record.timestamp || 'N/A'}`);
                console.log(`   Status: ${record.status || 'completed'}`);
                console.log('');
                console.log('✅ This is the user data shown in vault #424965 on the frontend!');
                return {
                    userId,
                    vaultId: key,
                    record
                };
            }
        }
        
        console.log('⚠️  Vault #424965 not found in current data batch');
        console.log('   The vault was likely generated from a previous data fetch');
        console.log('');
        
        // Show what vaults WOULD be generated from current data
        console.log('📊 Current data would generate these vaults:');
        for (let i = 0; i < Math.min(5, recentRecords.length); i++) {
            const record = recentRecords[i];
            const userId = record.session_id || record.user || record.api_key_alias || `api_user_${i}`;
            const vaultId = crypto.createHash('md5')
                .update(userId)
                .digest('hex')
                .substring(0, 8);
            const key = parseInt(vaultId, 16) % 1000000;
            
            console.log(`   User "${userId}" → Vault ${key}`);
        }
        
    } catch (error) {
        console.error('❌ Error fetching LiteLLM data:', error.message);
        
        // Manual demonstration of the vault generation
        console.log('');
        console.log('🔧 Manual vault generation demonstration:');
        console.log('   The vault ID is generated using this algorithm:');
        console.log('   1. Take user/session ID from LiteLLM record');
        console.log('   2. Create MD5 hash of the user ID');
        console.log('   3. Take first 8 characters of hex hash');
        console.log('   4. Convert to integer and mod 1000000');
        console.log('');
        
        // Test some common user ID patterns
        const testIds = [
            'api_user', 'api_user_0', 'api_user_1', 'user_123', 
            'session_abc', 'litellm_user', 'chatgpt_user',
            // Add the actual session IDs that might exist
            '1234567890', 'anon_user', 'default_user'
        ];
        
        console.log('🧪 Testing common user ID patterns:');
        for (const testId of testIds) {
            const vaultId = crypto.createHash('md5')
                .update(testId)
                .digest('hex')
                .substring(0, 8);
            const key = parseInt(vaultId, 16) % 1000000;
            
            if (key === 424965) {
                console.log(`🎯 MATCH: "${testId}" → Vault 424965`);
                break;
            } else {
                console.log(`   "${testId}" → Vault ${key}`);
            }
        }
    }
}

// Run the lookup
findUserForVault424965().catch(console.error);