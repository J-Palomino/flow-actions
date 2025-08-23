/**
 * Environment Setup Helper
 * Validates and guides you through setting up the required environment variables
 */

const crypto = require('crypto');
const path = require('path');

// Load .env from root directory (two levels up)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class EnvironmentSetup {
    constructor() {
        this.requiredVars = {
            'LITELLM_API_KEY': {
                description: 'Your LiteLLM API key',
                example: 'sk-1234567890abcdef...',
                validation: (val) => val && val.startsWith('sk-') && val.length > 20,
                errorMsg: 'Must start with "sk-" and be at least 20 characters'
            },
            'LITELLM_API_URL': {
                description: 'Your LiteLLM instance URL',
                example: 'https://your-litellm-instance.com',
                validation: (val) => val && (val.startsWith('http://') || val.startsWith('https://')),
                errorMsg: 'Must be a valid HTTP/HTTPS URL'
            },
            'ENCRYPT_PASSWORD': {
                description: 'Password for encrypting API key (min 12 chars, mix of letters/numbers/symbols)',
                example: 'MySecure$Oracle2025!',
                validation: (val) => this.validatePassword(val),
                errorMsg: 'Must be at least 12 characters with letters, numbers, and symbols'
            }
        };

        this.optionalVars = {
            'FLOW_NETWORK': {
                description: 'Flow network (mainnet or testnet)',
                default: 'mainnet',
                example: 'mainnet'
            },
            'FLOW_CONTRACT_ADDRESS': {
                description: 'Your Flow contract address',
                default: '0x6daee039a7b9c2f0',
                example: '0x6daee039a7b9c2f0'
            },
            'MONITOR_VAULT_IDS': {
                description: 'Vault IDs to monitor (comma-separated)',
                default: '424965,746865,258663',
                example: '424965,746865,258663'
            },
            'MONITOR_INTERVAL': {
                description: 'Check interval in milliseconds (5 minutes = 300000)',
                default: '300000',
                example: '300000'
            }
        };
    }

    validatePassword(password) {
        if (!password || password.length < 12) return false;
        
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[^a-zA-Z\d]/.test(password);
        
        return hasLetter && hasNumber && hasSymbol;
    }

    checkCurrentEnvironment() {
        console.log('🔍 Checking Current Environment Variables...');
        console.log('='.repeat(50));
        
        const issues = [];
        const warnings = [];
        
        // Check required variables
        Object.entries(this.requiredVars).forEach(([key, config]) => {
            const value = process.env[key];
            
            if (!value) {
                issues.push(`❌ ${key}: Missing (${config.description})`);
            } else if (!config.validation(value)) {
                issues.push(`❌ ${key}: Invalid - ${config.errorMsg}`);
            } else {
                const displayValue = key === 'LITELLM_API_KEY' ? 
                    value.substring(0, 8) + '...' : 
                    key === 'ENCRYPT_PASSWORD' ?
                    '*'.repeat(value.length) :
                    value;
                console.log(`✅ ${key}: ${displayValue}`);
            }
        });

        // Check optional variables
        console.log('\n📋 Optional Settings:');
        Object.entries(this.optionalVars).forEach(([key, config]) => {
            const value = process.env[key] || config.default;
            console.log(`ℹ️  ${key}: ${value}`);
        });

        // Report issues
        if (issues.length > 0) {
            console.log('\n🚨 Issues Found:');
            issues.forEach(issue => console.log('   ' + issue));
            return false;
        }

        if (warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            warnings.forEach(warning => console.log('   ' + warning));
        }

        console.log('\n✅ Environment validation passed!');
        return true;
    }

    generateExampleEnv() {
        console.log('\n📝 Example .env file:');
        console.log('='.repeat(30));
        console.log('# Secure Oracle Environment Variables');
        console.log('# Copy these lines to a .env file and fill in your values\n');

        Object.entries(this.requiredVars).forEach(([key, config]) => {
            console.log(`# ${config.description}`);
            console.log(`${key}=${config.example}\n`);
        });

        console.log('# Optional settings (with defaults)');
        Object.entries(this.optionalVars).forEach(([key, config]) => {
            console.log(`# ${config.description}`);
            console.log(`${key}=${config.default || config.example}\n`);
        });
    }

    generateSetupCommands() {
        console.log('🚀 Setup Commands:');
        console.log('='.repeat(20));
        console.log('# Method 1: Export directly');
        Object.entries(this.requiredVars).forEach(([key, config]) => {
            console.log(`export ${key}="${config.example}"`);
        });
        
        console.log('\n# Method 2: Create .env file');
        console.log('cp .env.example .env');
        console.log('# Then edit .env with your values');
        
        console.log('\n# Method 3: One-liner setup');
        console.log('echo "LITELLM_API_KEY=sk-your-key" > .env');
        console.log('echo "LITELLM_API_URL=https://your-url.com" >> .env');
        console.log('echo "ENCRYPT_PASSWORD=YourSecure\\$Password2025!" >> .env');
    }

    run() {
        console.log('🔧 Secure Oracle Environment Setup');
        console.log('='.repeat(40));
        
        const isValid = this.checkCurrentEnvironment();
        
        if (!isValid) {
            this.generateExampleEnv();
            this.generateSetupCommands();
            
            console.log('\n🎯 Next Steps:');
            console.log('1. Set the required environment variables above');
            console.log('2. Run: node setup-env.js (to validate)');
            console.log('3. Run: ./deploy-secure-oracle.sh (to deploy)');
            
            return false;
        } else {
            console.log('\n🎉 Environment is ready!');
            console.log('\n🚀 You can now deploy:');
            console.log('   ./deploy-secure-oracle.sh');
            console.log('\nOr test setup:');
            console.log('   node setup-encrypted-oracle-key.js');
            
            return true;
        }
    }
}

if (require.main === module) {
    const setup = new EnvironmentSetup();
    const success = setup.run();
    process.exit(success ? 0 : 1);
}

module.exports = { EnvironmentSetup };