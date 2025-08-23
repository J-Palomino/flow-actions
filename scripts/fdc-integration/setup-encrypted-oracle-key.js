/**
 * Setup Encrypted Oracle Key
 * Stores LiteLLM API key encrypted in Flow blockchain storage
 * 
 * Usage: LITELLM_API_KEY=sk-your-key ENCRYPT_PASSWORD=your-password node setup-encrypted-oracle-key.js
 */

const crypto = require('crypto');
const fcl = require('@onflow/fcl');
const path = require('path');

// Load .env from root directory (two levels up)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class EncryptedKeySetup {
    constructor() {
        this.contractAddress = process.env.FLOW_CONTRACT_ADDRESS || '0x6daee039a7b9c2f0';
        
        fcl.config()
            .put('accessNode.api', process.env.FLOW_NETWORK === 'testnet' 
                ? 'https://rest-testnet.onflow.org' 
                : 'https://rest-mainnet.onflow.org')
            .put('flow.network', process.env.FLOW_NETWORK || 'mainnet');
    }

    // Encrypt API key using same method as production oracle
    encryptApiKey(apiKey, password) {
        console.log('🔐 Encrypting API key...');
        
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(password, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Prepend IV for decryption
        return iv.toString('hex') + ':' + encrypted;
    }

    // Test decryption to ensure it works
    testDecryption(encryptedKey, password) {
        console.log('🧪 Testing decryption...');
        
        try {
            const parts = encryptedKey.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedData = parts[1];
            const key = crypto.scryptSync(password, 'salt', 32);
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            console.log('✅ Decryption test successful');
            return true;
            
        } catch (error) {
            console.error('❌ Decryption test failed:', error.message);
            return false;
        }
    }

    async storeEncryptedKey(encryptedKey) {
        console.log('📦 Storing encrypted key in Flow blockchain...');
        
        const transaction = `
            transaction(encryptedKey: String) {
                prepare(signer: auth(Storage) &Account) {
                    // Store encrypted API key in secure storage path
                    signer.storage.save(encryptedKey, to: /storage/LiteLLMOracleKey)
                    
                    log("🔒 Encrypted LiteLLM API key stored securely")
                    log("Key length: ".concat(encryptedKey.length.toString()))
                }
            }
        `;

        try {
            const txId = await fcl.mutate({
                cadence: transaction,
                args: (arg, t) => [
                    arg(encryptedKey, t.String)
                ],
                payer: fcl.authz,
                proposer: fcl.authz,
                authorizations: [fcl.authz],
                limit: 1000
            });

            console.log(`📡 Transaction submitted: ${txId}`);
            
            const result = await fcl.tx(txId).onceSealed();
            console.log('✅ Encrypted API key stored successfully in Flow blockchain');
            
            return result;
            
        } catch (error) {
            console.error('❌ Failed to store encrypted key:', error.message);
            throw error;
        }
    }

    // Verify stored key can be retrieved
    async verifyStoredKey() {
        console.log('🔍 Verifying stored key can be retrieved...');
        
        const script = `
            access(all) fun main(): String? {
                let account = getAccount(${this.contractAddress})
                if let storage = account.storage.borrow<&String>(from: /storage/LiteLLMOracleKey) {
                    return storage
                } else {
                    return nil
                }
            }
        `;
        
        try {
            const retrievedKey = await fcl.query({ cadence: script });
            
            if (retrievedKey) {
                console.log(`✅ Key retrieved successfully (length: ${retrievedKey.length})`);
                return retrievedKey;
            } else {
                console.error('❌ No key found in storage');
                return null;
            }
            
        } catch (error) {
            console.error('❌ Failed to retrieve key:', error.message);
            return null;
        }
    }

    async setup() {
        console.log('🔒 Setting up Encrypted Oracle API Key');
        console.log('='.repeat(50));
        
        // Validate environment
        const apiKey = process.env.LITELLM_API_KEY;
        const password = process.env.ENCRYPT_PASSWORD;
        
        if (!apiKey) {
            console.error('❌ LITELLM_API_KEY environment variable required');
            process.exit(1);
        }
        
        if (!password) {
            console.error('❌ ENCRYPT_PASSWORD environment variable required');
            process.exit(1);
        }
        
        if (apiKey.length < 10) {
            console.error('❌ API key seems too short - please verify');
            process.exit(1);
        }
        
        console.log(`🔑 API Key: ${apiKey.substring(0, 8)}... (${apiKey.length} chars)`);
        console.log(`🔐 Using encryption password: ${password.substring(0, 3)}... (${password.length} chars)`);
        console.log(`📡 Target contract: ${this.contractAddress}`);
        console.log('');
        
        try {
            // 1. Encrypt the API key
            const encryptedKey = this.encryptApiKey(apiKey, password);
            console.log(`🔒 Encrypted key: ${encryptedKey.substring(0, 20)}... (${encryptedKey.length} chars)`);
            
            // 2. Test decryption
            if (!this.testDecryption(encryptedKey, password)) {
                throw new Error('Encryption test failed');
            }
            
            // 3. Store in Flow blockchain
            await this.storeEncryptedKey(encryptedKey);
            
            // 4. Verify retrieval
            const retrievedKey = await this.verifyStoredKey();
            if (!retrievedKey) {
                throw new Error('Failed to verify stored key');
            }
            
            // 5. Test full roundtrip
            if (!this.testDecryption(retrievedKey, password)) {
                throw new Error('Roundtrip test failed');
            }
            
            console.log('');
            console.log('🎉 Setup Complete!');
            console.log('✅ API key encrypted and stored securely in Flow blockchain');
            console.log('✅ Key can be retrieved and decrypted by oracle');
            console.log('');
            console.log('🚀 Next Steps:');
            console.log(`   1. Start oracle: ORACLE_DECRYPT_KEY="${password}" node secure-litellm-oracle-production.js`);
            console.log('   2. Monitor logs: tail -f logs/secure-oracle.log');
            console.log('   3. Check status: curl http://localhost:3000/health');
            console.log('');
            console.log('🔒 Security Notes:');
            console.log('   ✅ API key is encrypted with AES-256-CBC');
            console.log('   ✅ Only encrypted version stored on blockchain');
            console.log('   ✅ Decryption password never touches blockchain');
            console.log('   ✅ Oracle decrypts off-chain only');
            
        } catch (error) {
            console.error('💥 Setup failed:', error.message);
            process.exit(1);
        }
    }
}

// Run setup
if (require.main === module) {
    const setup = new EncryptedKeySetup();
    setup.setup();
}

module.exports = { EncryptedKeySetup };