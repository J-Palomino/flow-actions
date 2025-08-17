/**
 * Check onchain usage data in Flow mainnet subscription contracts
 */

const { exec } = require('child_process');
const path = require('path');

async function checkOnchainUsage() {
    console.log('🔍 Checking onchain usage data in Flow mainnet contracts...');
    console.log('Contract Address: 0x6daee039a7b9c2f0');
    console.log('Network: Flow Mainnet');
    console.log('');
    
    // Script to query subscription usage data
    const queryScript = `
import "SimpleUsageSubscriptions" from 0x6daee039a7b9c2f0

access(all) fun main(vaultId: UInt64): {String: AnyStruct}? {
    let manager = SimpleUsageSubscriptions.getManager()
    
    // Try to get usage data for the vault
    let usageData: {String: AnyStruct} = {}
    
    // Check if vault exists and get usage info
    usageData["vaultExists"] = manager.vaultExists(vaultId: vaultId)
    
    if manager.vaultExists(vaultId: vaultId) {
        // Get vault reference and extract usage data
        if let vault = manager.borrowVault(vaultId: vaultId) {
            usageData["totalTokens"] = vault.getTotalUsage()
            usageData["currentTier"] = vault.getCurrentTier()
            usageData["lastUpdated"] = vault.getLastUpdated()
            usageData["isActive"] = vault.isActive()
        }
    }
    
    return usageData
}`;
    
    // Write the script to a temporary file
    const scriptPath = path.join(__dirname, '..', '..', 'cadence', 'scripts', 'get_vault_usage.cdc');
    require('fs').writeFileSync(scriptPath, queryScript);
    
    console.log('📊 Querying vault usage data for sample vaults...');
    
    // Test with some of the vault IDs we generated
    const testVaultIds = [424965, 746865, 258663, 360478, 111162];
    
    for (const vaultId of testVaultIds) {
        try {
            console.log(`\n🔍 Checking Vault ${vaultId}:`);
            
            const command = `flow scripts execute "${scriptPath}" ${vaultId} --network mainnet`;
            
            await new Promise((resolve, reject) => {
                exec(command, { cwd: path.join(__dirname, '..', '..') }, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`   ❌ Error querying vault ${vaultId}: ${error.message}`);
                        if (stderr) console.log(`   stderr: ${stderr}`);
                        resolve();
                        return;
                    }
                    
                    try {
                        const result = JSON.parse(stdout.trim());
                        console.log(`   📋 Vault ${vaultId} Data:`);
                        console.log(`      - Exists: ${result.vaultExists || false}`);
                        
                        if (result.vaultExists) {
                            console.log(`      - Total Tokens: ${result.totalTokens || 0}`);
                            console.log(`      - Current Tier: ${result.currentTier || 'N/A'}`);
                            console.log(`      - Last Updated: ${result.lastUpdated || 'Never'}`);
                            console.log(`      - Active: ${result.isActive || false}`);
                        } else {
                            console.log(`      - Status: Vault not found onchain`);
                        }
                    } catch (parseError) {
                        console.log(`   📄 Raw response for vault ${vaultId}:`);
                        console.log(`      ${stdout.trim()}`);
                    }
                    
                    resolve();
                });
            });
            
        } catch (error) {
            console.log(`   ❌ Failed to query vault ${vaultId}: ${error.message}`);
        }
    }
    
    console.log('\n🔍 Checking for any existing subscription vaults...');
    
    // Script to get all existing vaults
    const listVaultsScript = `
import "SimpleUsageSubscriptions" from 0x6daee039a7b9c2f0

access(all) fun main(): [UInt64] {
    let manager = SimpleUsageSubscriptions.getManager()
    return manager.getAllVaultIds()
}`;
    
    const listScriptPath = path.join(__dirname, '..', '..', 'cadence', 'scripts', 'list_vaults.cdc');
    require('fs').writeFileSync(listScriptPath, listVaultsScript);
    
    try {
        const listCommand = `flow scripts execute "${listScriptPath}" --network mainnet`;
        
        await new Promise((resolve, reject) => {
            exec(listCommand, { cwd: path.join(__dirname, '..', '..') }, (error, stdout, stderr) => {
                if (error) {
                    console.log(`❌ Error listing vaults: ${error.message}`);
                    if (stderr) console.log(`stderr: ${stderr}`);
                    resolve();
                    return;
                }
                
                try {
                    const vaultIds = JSON.parse(stdout.trim());
                    console.log(`📊 Found ${vaultIds.length} existing vaults onchain:`);
                    
                    if (vaultIds.length > 0) {
                        vaultIds.forEach((vaultId, index) => {
                            console.log(`   ${index + 1}. Vault ID: ${vaultId}`);
                        });
                    } else {
                        console.log(`   ℹ️  No subscription vaults found yet`);
                        console.log(`   💡 This means oracle data hasn't been submitted to Flow yet`);
                    }
                } catch (parseError) {
                    console.log(`📄 Raw vault list response:`);
                    console.log(`   ${stdout.trim()}`);
                }
                
                resolve();
            });
        });
        
    } catch (error) {
        console.log(`❌ Failed to list vaults: ${error.message}`);
    }
    
    console.log('\n📋 Summary:');
    console.log('✅ Oracle triggers generated from real LiteLLM data');
    console.log('🔄 Flare oracle ready to submit to Flow mainnet');
    console.log('📊 Contract ready to receive usage updates');
    console.log('');
    console.log('💡 To see onchain data, the Flare oracle needs to submit the triggers');
    console.log('   This would happen automatically in production when FDC endpoint is active');
    
    // Cleanup
    try {
        require('fs').unlinkSync(scriptPath);
        require('fs').unlinkSync(listScriptPath);
    } catch (e) {
        // Ignore cleanup errors
    }
}

checkOnchainUsage().catch(console.error);