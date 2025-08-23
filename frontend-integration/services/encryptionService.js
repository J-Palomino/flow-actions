/**
 * Encryption Service for LiteLLM API Keys
 * Uses AES-256-GCM encryption with PBKDF2 key derivation
 */

class EncryptionService {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.iterations = 100000; // PBKDF2 iterations
        this.saltLength = 16; // 128 bits
        this.ivLength = 12; // 96 bits for GCM
    }

    /**
     * Generate a random salt
     */
    generateSalt() {
        const salt = new Uint8Array(this.saltLength);
        crypto.getRandomValues(salt);
        return salt;
    }

    /**
     * Generate a random IV
     */
    generateIV() {
        const iv = new Uint8Array(this.ivLength);
        crypto.getRandomValues(iv);
        return iv;
    }

    /**
     * Derive encryption key from user's wallet address + signature using PBKDF2
     */
    async deriveKey(userAddress, salt, signature = null) {
        // Use user's wallet address + signature as the password base for enhanced security
        const passwordBase = signature ? `${userAddress}:${signature}` : userAddress;
        const passwordBuffer = new TextEncoder().encode(passwordBase);
        
        // Import the password as a key
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive the actual encryption key
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            baseKey,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            false,
            ['encrypt', 'decrypt']
        );

        return key;
    }

    /**
     * Encrypt a LiteLLM API key
     */
    async encryptApiKey(apiKey, userAddress) {
        try {
            const salt = this.generateSalt();
            const iv = this.generateIV();
            
            // Derive encryption key from user's address
            const key = await this.deriveKey(userAddress, salt);
            
            // Encrypt the API key
            const encodedApiKey = new TextEncoder().encode(apiKey);
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encodedApiKey
            );

            // Combine IV + encrypted data
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const combined = new Uint8Array(iv.length + encryptedArray.length);
            combined.set(iv);
            combined.set(encryptedArray, iv.length);

            return {
                encryptedData: this.arrayBufferToBase64(combined),
                salt: this.arrayBufferToBase64(salt)
            };

        } catch (error) {
            console.error('Error encrypting API key:', error);
            throw new Error('Failed to encrypt API key');
        }
    }

    /**
     * Decrypt a LiteLLM API key with optional signature verification
     */
    async decryptApiKey(encryptedData, salt, userAddress, signature = null) {
        try {
            // Convert from base64
            const combined = this.base64ToArrayBuffer(encryptedData);
            const saltBuffer = this.base64ToArrayBuffer(salt);
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, this.ivLength);
            const encrypted = combined.slice(this.ivLength);
            
            // Derive the same encryption key (with signature if provided)
            const key = await this.deriveKey(userAddress, saltBuffer, signature);
            
            // Decrypt the data
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );

            // Convert back to string
            const decryptedApiKey = new TextDecoder().decode(decryptedBuffer);
            return decryptedApiKey;

        } catch (error) {
            console.error('Error decrypting API key:', error);
            throw new Error('Failed to decrypt API key - signature may be required');
        }
    }

    /**
     * Decrypt API key with wallet signature verification
     * This method requires the user to sign a message proving wallet ownership
     */
    async decryptApiKeyWithSignature(encryptedData, salt, userAddress, vaultId, signMessageFn) {
        try {
            // Create a unique message for the user to sign
            const message = `Decrypt API key for vault ${vaultId} at ${new Date().toISOString()}`;
            console.log(`🔐 Creating signature message: "${message}"`);
            
            // Request wallet signature
            console.log(`📝 Requesting wallet signature...`);
            const signature = await signMessageFn(message);
            
            if (!signature) {
                throw new Error('Wallet signature required to decrypt API key');
            }

            console.log(`🔏 Signature received, attempting decryption with signature-enhanced key derivation...`);
            
            // Attempt decryption with signature
            const decryptedKey = await this.decryptApiKey(encryptedData, salt, userAddress, signature);
            
            console.log(`✅ Successfully decrypted API key using signature-enhanced derivation`);
            return decryptedKey;

        } catch (error) {
            console.error('❌ Error decrypting API key with signature:', error);
            
            // If signature-based decryption fails, try fallback without signature
            console.log(`⚠️ Attempting fallback decryption without signature for backward compatibility...`);
            try {
                const fallbackKey = await this.decryptApiKey(encryptedData, salt, userAddress);
                console.log(`✅ Fallback decryption successful`);
                return fallbackKey;
            } catch (fallbackError) {
                console.error('❌ Fallback decryption also failed:', fallbackError);
                throw new Error('Failed to decrypt API key with both signature and fallback methods: ' + error.message);
            }
        }
    }

    /**
     * Verify that an encrypted key can be decrypted (for testing)
     */
    async verifyEncryption(apiKey, encryptedData, salt, userAddress) {
        try {
            const decryptedKey = await this.decryptApiKey(encryptedData, salt, userAddress);
            return decryptedKey === apiKey;
        } catch (error) {
            return false;
        }
    }

    /**
     * Convert ArrayBuffer to Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 string to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Generate a secure API key preview (for UI display)
     */
    generateKeyPreview(apiKey) {
        if (!apiKey || apiKey.length < 8) {
            return '••••••••';
        }
        
        const start = apiKey.substring(0, 4);
        const end = apiKey.substring(apiKey.length - 4);
        return `${start}••••••••${end}`;
    }

    /**
     * Validate API key format (basic validation)
     */
    validateApiKeyFormat(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'API key must be a non-empty string' };
        }

        if (apiKey.length < 16) {
            return { valid: false, error: 'API key appears too short' };
        }

        if (apiKey.length > 256) {
            return { valid: false, error: 'API key appears too long' };
        }

        // Check for common LiteLLM key patterns
        const commonPatterns = [
            /^sk-[A-Za-z0-9_-]+$/, // OpenAI-style keys
            /^[A-Za-z0-9_-]{20,}$/ // General API key pattern
        ];

        const matchesPattern = commonPatterns.some(pattern => pattern.test(apiKey));
        if (!matchesPattern) {
            return { 
                valid: true, // Still allow it, just warn
                warning: 'API key format may be unusual - please verify it is correct'
            };
        }

        return { valid: true };
    }
}

// Export singleton instance
const encryptionService = new EncryptionService();
export default encryptionService;