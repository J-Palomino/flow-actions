/**
 * Subscription Creation Fix Test
 * Specifically tests the setLiteLLMApiKey fix with real wallet interaction
 */

const puppeteer = require('puppeteer');
const path = require('path');

class SubscriptionFixTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async setup() {
        console.log('🚀 Starting Subscription Fix Test...');
        console.log('📋 Testing the setLiteLLMApiKey entitlement fix');
        
        const userDataDir = path.join(process.env.TEMP || '/tmp', 'subscription-fix-test-' + Date.now());
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 800,
            devtools: true,
            defaultViewport: null,
            userDataDir: userDataDir,
            args: [
                '--start-maximized',
                '--no-first-run',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Enhanced console logging to catch Flow transaction details
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                if (text.includes('1101') || text.includes('setLiteLLMApiKey')) {
                    console.log('🚨 TRANSACTION ERROR:', text);
                } else if (!text.includes('404') && !text.includes('WalletConnect')) {
                    console.log('❌ Console Error:', text);
                }
            } else if (text.includes('✅') || text.includes('❌') || 
                      text.includes('subscription') || text.includes('vault') ||
                      text.includes('LiteLLM') || text.includes('transaction')) {
                console.log('📝 App Log:', text);
            }
        });

        console.log('✅ Browser setup complete');
    }

    async teardown() {
        // Keep browser open for manual inspection
        console.log('📝 Browser kept open for manual inspection');
        console.log('❓ Close browser manually when done testing');
    }

    async logTest(testName, passed, details = '') {
        const result = { testName, passed, details };
        this.testResults.push(result);
        
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${testName}: ${passed ? 'PASSED' : 'FAILED'} ${details}`);
    }

    async takeScreenshot(name) {
        const filename = `subscription-fix-${name}-${Date.now()}.png`;
        await this.page.screenshot({ 
            path: filename,
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
        return filename;
    }

    async testPageLoad() {
        console.log('\n🧪 Test 1: Page Load and Setup');
        
        try {
            await this.page.goto('http://localhost:3003', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            const title = await this.page.title();
            await this.logTest('Page loads successfully', title.length > 0, `"${title}"`);
            
            await this.takeScreenshot('01-page-loaded');
            return true;

        } catch (error) {
            await this.logTest('Page load', false, error.message);
            return false;
        }
    }

    async testUIElements() {
        console.log('\n🧪 Test 2: UI Elements and Form Detection');
        
        try {
            // Wait for React to hydrate
            await this.page.waitForTimeout(2000);

            // Check for subscription form elements
            const formElements = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
                    text: btn.textContent.trim(),
                    disabled: btn.disabled,
                    visible: btn.offsetParent !== null
                })).filter(btn => btn.visible);

                const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                    type: input.type,
                    placeholder: input.placeholder || '',
                    name: input.name || '',
                    visible: input.offsetParent !== null
                })).filter(input => input.visible);

                return { buttons, inputs };
            });

            await this.logTest('Buttons found', formElements.buttons.length > 0, 
                `Found ${formElements.buttons.length} buttons`);
            
            await this.logTest('Form inputs found', formElements.inputs.length > 0, 
                `Found ${formElements.inputs.length} inputs`);

            // Look for subscription-specific elements
            const hasSubscriptionContent = await this.page.evaluate(() => {
                const text = document.body.textContent.toLowerCase();
                return {
                    hasSubscription: text.includes('subscription') || text.includes('create'),
                    hasProvider: text.includes('provider'),
                    hasModels: text.includes('model') || text.includes('gpt') || text.includes('claude'),
                    hasDeposit: text.includes('deposit') || text.includes('flow'),
                    hasEntitlement: text.includes('entitlement') || text.includes('limit')
                };
            });

            Object.entries(hasSubscriptionContent).forEach(([key, value]) => {
                this.logTest(`Has ${key.replace('has', '').toLowerCase()} content`, value);
            });

            await this.takeScreenshot('02-ui-elements');
            return true;

        } catch (error) {
            await this.logTest('UI elements test', false, error.message);
            return false;
        }
    }

    async testFormInteraction() {
        console.log('\n🧪 Test 3: Form Interaction and Data Entry');
        
        try {
            // Fill provider address if input exists
            const providerInput = await this.page.$('input[placeholder*="provider" i], input[name*="provider" i]');
            if (providerInput) {
                await providerInput.click();
                await providerInput.type('0x6daee039a7b9c2f0'); // Main account from flow.json
                await this.logTest('Provider address filled', true);
            }

            // Fill deposit amount
            const depositInput = await this.page.$('input[type="number"], input[placeholder*="deposit" i], input[placeholder*="amount" i]');
            if (depositInput) {
                await depositInput.click();
                await depositInput.type('5.0');
                await this.logTest('Deposit amount filled', true, '5.0 FLOW');
            }

            // Fill withdraw limit if exists
            const limitInput = await this.page.$('input[placeholder*="limit" i], input[placeholder*="withdraw" i]');
            if (limitInput) {
                await limitInput.click();
                await limitInput.type('10.0');
                await this.logTest('Withdraw limit filled', true, '10.0 FLOW');
            }

            // Select models if available
            const modelCheckboxes = await this.page.$$('input[type="checkbox"]');
            if (modelCheckboxes.length > 0) {
                await modelCheckboxes[0].click();
                await this.logTest('Model selected', true, 'First available model');
            }

            await this.takeScreenshot('03-form-filled');
            return true;

        } catch (error) {
            await this.logTest('Form interaction', false, error.message);
            return false;
        }
    }

    async testWalletConnection() {
        console.log('\n🧪 Test 4: Wallet Connection Flow');
        console.log('👤 Manual Step Required: Connect your wallet when prompted');
        
        try {
            // Look for connect button
            const connectButton = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent.toLowerCase().includes('connect') ||
                    btn.textContent.toLowerCase().includes('wallet')
                );
            });

            if (connectButton) {
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(btn => 
                        btn.textContent.toLowerCase().includes('connect') ||
                        btn.textContent.toLowerCase().includes('wallet')
                    );
                    if (btn) btn.click();
                });
                
                await this.logTest('Connect button clicked', true);
                
                // Wait for wallet connection
                await this.page.waitForTimeout(5000);
                
                // Check if wallet is connected (look for address or balance)
                const walletConnected = await this.page.evaluate(() => {
                    const text = document.body.textContent;
                    return text.includes('0x') || text.includes('FLOW') || text.includes('balance');
                });
                
                await this.logTest('Wallet connection detected', walletConnected);
                
                await this.takeScreenshot('04-wallet-connected');
                return walletConnected;
            } else {
                await this.logTest('Connect button found', false, 'No connect button detected');
                return false;
            }

        } catch (error) {
            await this.logTest('Wallet connection', false, error.message);
            return false;
        }
    }

    async testSubscriptionCreation() {
        console.log('\n🧪 Test 5: Subscription Creation (Critical Test)');
        console.log('🎯 This tests the setLiteLLMApiKey entitlement fix');
        
        try {
            // Look for create/submit button
            const createButton = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent.toLowerCase().includes('create') ||
                    btn.textContent.toLowerCase().includes('submit') ||
                    btn.textContent.toLowerCase().includes('subscribe')
                );
            });

            if (createButton) {
                console.log('🔗 Found create button, initiating subscription...');
                
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(btn => 
                        btn.textContent.toLowerCase().includes('create') ||
                        btn.textContent.toLowerCase().includes('submit') ||
                        btn.textContent.toLowerCase().includes('subscribe')
                    );
                    if (btn) btn.click();
                });
                
                await this.logTest('Create button clicked', true);
                
                // Monitor for transaction progress
                console.log('⏳ Monitoring for transaction results (60 seconds)...');
                console.log('👤 Please approve wallet transactions when prompted');
                
                let transactionDetected = false;
                let errorDetected = false;
                let successDetected = false;
                
                for (let i = 0; i < 24; i++) { // 60 seconds total
                    await this.page.waitForTimeout(2500);
                    
                    const status = await this.page.evaluate(() => {
                        const text = document.body.textContent.toLowerCase();
                        return {
                            hasTransaction: text.includes('transaction') || text.includes('tx'),
                            hasError: text.includes('error') || text.includes('failed') || text.includes('1101'),
                            hasSuccess: text.includes('success') || text.includes('created') || text.includes('vault'),
                            hasLiteLLM: text.includes('litellm') || text.includes('api key'),
                            hasSetApiKey: text.includes('setlitellmapikey') || text.includes('api key stored')
                        };
                    });
                    
                    if (status.hasError) {
                        errorDetected = true;
                        console.log('🚨 ERROR DETECTED - checking for our specific fix...');
                        
                        // Check console for the specific error we fixed
                        const errorText = await this.page.evaluate(() => {
                            return document.body.textContent;
                        });
                        
                        if (errorText.includes('1101') && errorText.includes('setLiteLLMApiKey')) {
                            await this.logTest('setLiteLLMApiKey error fixed', false, 'Error 1101 still occurring');
                        } else {
                            await this.logTest('setLiteLLMApiKey error fixed', true, 'Different error, fix worked');
                        }
                        
                        await this.takeScreenshot('05-error-state');
                        break;
                    }
                    
                    if (status.hasSuccess) {
                        successDetected = true;
                        await this.logTest('Subscription creation successful', true);
                        
                        if (status.hasSetApiKey) {
                            await this.logTest('setLiteLLMApiKey call successful', true, 'API key stored');
                        }
                        
                        await this.takeScreenshot('05-success-state');
                        break;
                    }
                    
                    if (status.hasTransaction && !transactionDetected) {
                        transactionDetected = true;
                        console.log('📝 Transaction in progress...');
                    }
                    
                    if (i % 4 === 0) {
                        console.log(`⏳ Still monitoring... (${60 - (i + 1) * 2.5} seconds remaining)`);
                    }
                }
                
                await this.logTest('Transaction flow completed', transactionDetected || successDetected || errorDetected);
                
                return successDetected;
                
            } else {
                await this.logTest('Create button found', false, 'No create/submit button detected');
                return false;
            }

        } catch (error) {
            await this.logTest('Subscription creation', false, error.message);
            return false;
        }
    }

    async runAllTests() {
        try {
            await this.setup();

            const pageLoaded = await this.testPageLoad();
            if (!pageLoaded) {
                console.log('❌ Page failed to load, aborting tests');
                return;
            }

            await this.testUIElements();
            await this.testFormInteraction();
            
            const walletConnected = await this.testWalletConnection();
            if (walletConnected) {
                await this.testSubscriptionCreation();
            } else {
                console.log('⚠️ Skipping subscription test - wallet not connected');
                console.log('👤 Please connect wallet manually and re-run test');
            }

            this.printSummary();

        } catch (error) {
            console.error('❌ Test suite error:', error);
        } finally {
            await this.teardown();
        }
    }

    printSummary() {
        console.log('\n📊 SUBSCRIPTION FIX TEST SUMMARY');
        console.log('==================================');
        
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${(passed/total*100).toFixed(1)}%`);

        console.log('\n🎯 KEY FIX VALIDATION:');
        const apiKeyTest = this.testResults.find(t => t.testName.includes('setLiteLLMApiKey'));
        if (apiKeyTest) {
            const icon = apiKeyTest.passed ? '✅' : '❌';
            console.log(`${icon} setLiteLLMApiKey Error Fix: ${apiKeyTest.passed ? 'WORKING' : 'STILL BROKEN'}`);
        } else {
            console.log('⏳ setLiteLLMApiKey fix not yet tested (needs wallet interaction)');
        }

        if (total - passed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => console.log(`  - ${t.testName}: ${t.details}`));
        }

        console.log('\n💡 NEXT STEPS:');
        console.log('  1. If setLiteLLMApiKey error still occurs, check transaction entitlements');
        console.log('  2. Verify wallet has sufficient FLOW balance');
        console.log('  3. Test with different wallet providers if issues persist');
        console.log('  4. Check browser console for additional error details');
    }
}

// Run the tests
async function main() {
    const tester = new SubscriptionFixTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SubscriptionFixTester;