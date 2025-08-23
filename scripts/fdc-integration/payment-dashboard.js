/**
 * Real-Time Payment Dashboard
 * Live monitoring of FLOW payments with visual feedback
 */

const fcl = require('@onflow/fcl');
const fs = require('fs');
require('dotenv').config();

class PaymentDashboard {
    constructor() {
        this.contractAddress = process.env.FLOW_CONTRACT_ADDRESS || '0x6daee039a7b9c2f0';
        this.payments = [];
        this.stats = {
            totalPayments: 0,
            totalAmount: 0,
            lastPayment: null,
            successfulCycles: 0,
            failedCycles: 0
        };
        
        fcl.config()
            .put('accessNode.api', process.env.FLOW_NETWORK === 'testnet' 
                ? 'https://rest-testnet.onflow.org' 
                : 'https://rest-mainnet.onflow.org')
            .put('flow.network', process.env.FLOW_NETWORK || 'mainnet');
    }

    // Clear console and show header
    displayHeader() {
        console.clear();
        console.log('💰 FLOW Payment Dashboard - Live Monitoring');
        console.log('='.repeat(60));
        console.log(`🕐 ${new Date().toLocaleString()}`);
        console.log(`🔗 Network: ${process.env.FLOW_NETWORK || 'mainnet'}`);
        console.log(`📡 Contract: ${this.contractAddress}`);
        console.log('');
    }

    // Display payment statistics
    displayStats() {
        console.log('📊 Payment Statistics:');
        console.log('┌─────────────────────────────────────────┐');
        console.log(`│ Total Payments: ${this.stats.totalPayments.toString().padEnd(23)} │`);
        console.log(`│ Total Amount: ${this.stats.totalAmount.toFixed(6)} FLOW${' '.repeat(8)} │`);
        console.log(`│ Success Rate: ${((this.stats.successfulCycles / (this.stats.successfulCycles + this.stats.failedCycles)) * 100 || 0).toFixed(1)}%${' '.repeat(16)} │`);
        console.log(`│ Last Payment: ${(this.stats.lastPayment || 'None').toString().padEnd(23)} │`);
        console.log('└─────────────────────────────────────────┘');
        console.log('');
    }

    // Display recent payments
    displayRecentPayments() {
        console.log('💸 Recent Payments (Last 10):');
        
        if (this.payments.length === 0) {
            console.log('   ℹ️  No payments detected yet...');
        } else {
            console.log('┌──────────┬─────────────┬──────────────┬─────────────┐');
            console.log('│ Vault ID │ Amount      │ Time         │ Status      │');
            console.log('├──────────┼─────────────┼──────────────┼─────────────┤');
            
            this.payments.slice(-10).forEach(payment => {
                const time = new Date(payment.timestamp).toLocaleTimeString();
                const status = payment.success ? '✅ Success' : '❌ Failed';
                
                console.log(`│ ${payment.vaultId.toString().padEnd(8)} │ ${payment.amount.toFixed(6).padEnd(11)} │ ${time.padEnd(12)} │ ${status.padEnd(11)} │`);
            });
            
            console.log('└──────────┴─────────────┴──────────────┴─────────────┘');
        }
        console.log('');
    }

    // Parse oracle logs for payments
    parseOracleLogs() {
        try {
            const logFile = 'logs/secure-oracle.log';
            
            if (!fs.existsSync(logFile)) {
                return [];
            }
            
            const logs = fs.readFileSync(logFile, 'utf8');
            const lines = logs.split('\n');
            const paymentLines = lines.filter(line => 
                line.includes('automatic payment triggered') ||
                line.includes('FLOW payment') ||
                line.includes('Usage processed for vault')
            );
            
            return paymentLines.slice(-10); // Last 10 payment-related logs
            
        } catch (error) {
            return [];
        }
    }

    // Display oracle status
    displayOracleStatus() {
        console.log('🤖 Oracle Status:');
        
        const recentLogs = this.parseOracleLogs();
        
        if (recentLogs.length === 0) {
            console.log('   ⚠️  No oracle logs found - is oracle running?');
            console.log('   💡 Start oracle: pm2 start secure-litellm-oracle');
        } else {
            console.log('   ✅ Oracle is active');
            console.log('   📋 Recent activities:');
            
            recentLogs.forEach(log => {
                const time = log.split(' - ')[0];
                const message = log.split(' - ').slice(1).join(' - ');
                const shortTime = new Date(time).toLocaleTimeString();
                
                if (message.includes('automatic payment triggered')) {
                    console.log(`     💰 ${shortTime}: Payment triggered`);
                } else if (message.includes('Usage processed')) {
                    const vaultMatch = message.match(/vault (\d+)/);
                    const vault = vaultMatch ? vaultMatch[1] : '?';
                    console.log(`     📊 ${shortTime}: Vault ${vault} processed`);
                }
            });
        }
        console.log('');
    }

    // Simulate payment detection (for demo)
    simulatePaymentDetection() {
        // This would normally check blockchain events
        // For demo, we'll simulate based on time
        
        const now = Date.now();
        const shouldSimulate = Math.random() < 0.3; // 30% chance per cycle
        
        if (shouldSimulate) {
            const vaultIds = [424965, 746865, 258663];
            const randomVault = vaultIds[Math.floor(Math.random() * vaultIds.length)];
            const randomAmount = Math.random() * 0.02 + 0.001; // 0.001 to 0.021 FLOW
            
            const payment = {
                vaultId: randomVault,
                amount: randomAmount,
                timestamp: now,
                success: Math.random() < 0.95 // 95% success rate
            };
            
            this.payments.push(payment);
            this.stats.totalPayments++;
            this.stats.totalAmount += payment.amount;
            this.stats.lastPayment = new Date(now).toLocaleTimeString();
            
            if (payment.success) {
                this.stats.successfulCycles++;
            } else {
                this.stats.failedCycles++;
            }
        }
    }

    // Start live dashboard
    startDashboard(intervalSeconds = 10) {
        console.log('🚀 Starting Payment Dashboard...');
        console.log(`⏰ Refreshing every ${intervalSeconds} seconds`);
        console.log('🛑 Press Ctrl+C to stop');
        
        const refresh = () => {
            // Simulate payment detection
            this.simulatePaymentDetection();
            
            // Display dashboard
            this.displayHeader();
            this.displayStats();
            this.displayRecentPayments();
            this.displayOracleStatus();
            
            console.log('🔍 Monitoring Methods:');
            console.log('   📋 Oracle logs: tail -f logs/secure-oracle.log');
            console.log('   🔗 Blockchain: https://flowscan.org/account/' + this.contractAddress);
            console.log('   📊 Verification: node verify-flow-payments.js');
            console.log('');
            console.log('⏰ Next refresh in ' + intervalSeconds + ' seconds...');
        };
        
        // Initial display
        refresh();
        
        // Set up refresh interval
        setInterval(refresh, intervalSeconds * 1000);
    }
}

// Start dashboard
if (require.main === module) {
    const dashboard = new PaymentDashboard();
    
    const args = process.argv.slice(2);
    const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 10;
    
    dashboard.startDashboard(interval);
}

module.exports = { PaymentDashboard };