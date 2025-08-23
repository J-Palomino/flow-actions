/**
 * Native Browser Subscription Creation Test
 * Uses your default browser for real wallet interactions and Flow authentication
 */

const puppeteer = require('puppeteer');
const path = require('path');

class NativeBrowserSubscriptionTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testSteps = [];
        this.config = {
            baseUrl: 'http://localhost:3000',
            timeout: 30000,
            slowMo: 1000, // Slow down for better observation
        };
    }

    async setup() {
        console.log('🚀 Starting Native Browser Subscription Test...');
        console.log('📋 This test will use your default browser with existing extensions');
        
        // Get user's default browser data directory
        const userDataDir = path.join(process.env.APPDATA || process.env.HOME, 'puppet-test-profile');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: this.config.slowMo,
            devtools: false,
            defaultViewport: null,
            userDataDir: userDataDir, // Use persistent profile
            args: [
                '--start-maximized',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        const pages = await this.browser.pages();
        this.page = pages[0] || await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            const type = msg.type();
            if (type === 'error') {
                console.log('❌ Browser Error:', msg.text());
            } else if (type === 'log' && msg.text().includes('FCL')) {
                console.log('🔗 FCL:', msg.text());
            }
        });

        console.log('✅ Native browser launched');
    }

    async teardown() {
        if (this.browser) {
            console.log('\n🧹 Keeping browser open for manual inspection...');
            console.log('📝 Close the browser manually when done reviewing');
            // Don't auto-close so user can inspect results
            // await this.browser.close();
        }
    }

    async logStep(stepName, success, details = '') {
        const step = { stepName, success, details, timestamp: new Date().toISOString() };
        this.testSteps.push(step);
        
        const icon = success ? '✅' : '❌';
        console.log(`${icon} ${stepName}: ${success ? 'SUCCESS' : 'FAILED'} ${details}`);
    }

    async waitAndClick(selector, description, timeout = 10000) {
        try {
            console.log(`🔍 Looking for ${description}...`);
            await this.page.waitForSelector(selector, { timeout, visible: true });
            await this.page.click(selector);
            await this.page.waitForTimeout(2000); // Wait for UI response
            return true;
        } catch (error) {
            console.log(`⚠️ Could not find/click ${description}: ${error.message}`);
            return false;
        }
    }

    async waitAndType(selector, text, description, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout, visible: true });
            await this.page.click(selector);
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type(selector, text);
            return true;
        } catch (error) {
            console.log(`⚠️ Could not type in ${description}: ${error.message}`);
            return false;
        }
    }

    async takeScreenshot(name) {
        const filename = `subscription-test-${name}-${Date.now()}.png`;
        await this.page.screenshot({ 
            path: filename,
            fullPage: true 
        });
        console.log(`📸 Screenshot saved: ${filename}`);
        return filename;
    }

    async step1_LoadApplication() {
        console.log('\n📄 Step 1: Load Application');
        
        try {
            await this.page.goto(this.config.baseUrl, { 
                waitUntil: 'networkidle2',
                timeout: this.config.timeout 
            });

            const title = await this.page.title();
            await this.logStep('Application loads', title.length > 0, `Title: "${title}"`);
            
            await this.takeScreenshot('01-app-loaded');
            
            // Wait for React to hydrate
            await this.page.waitForTimeout(3000);
            
            return true;
        } catch (error) {
            await this.logStep('Application loads', false, error.message);
            return false;
        }
    }

    async step2_ConnectWallet() {
        console.log('\n🔗 Step 2: Connect Wallet');
        
        try {
            // Look for connect button with various possible texts
            const connectSelectors = [
                'button:has-text("Connect")',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                'button[data-testid*="connect"]',
                'button[class*="connect"]',
                '.connect-wallet button',
                // More flexible selectors
                'button:contains("Connect")',
                'button:contains("Login")'
            ];

            let connected = false;
            
            // Try different selectors
            for (const selector of connectSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        const text = await this.page.evaluate(el => el.textContent, element);
                        console.log(`🔍 Found button: "${text}"`);
                        
                        await element.click();
                        await this.logStep('Connect button clicked', true, `Clicked: "${text}"`);
                        
                        await this.takeScreenshot('02-connect-clicked');
                        
                        // Wait for wallet popup or FCL authentication
                        console.log('⏳ Waiting for wallet authentication...');
                        await this.page.waitForTimeout(5000);
                        
                        // Look for signs of successful connection
                        const isConnected = await this.page.evaluate(() => {
                            const text = document.body.textContent.toLowerCase();
                            return text.includes('connected') || 
                                   text.includes('address') || 
                                   text.includes('balance') ||
                                   text.includes('0x');
                        });
                        
                        await this.logStep('Wallet connection', isConnected, isConnected ? 'User info visible' : 'No connection signs');
                        connected = isConnected;
                        break;
                    }
                } catch (e) {
                    // Try next selector
                    continue;
                }
            }

            if (!connected) {
                console.log('⚠️ No connect button found or connection failed');
                console.log('👤 Manual wallet connection may be required');
                
                // Wait for manual connection
                console.log('⏳ Waiting 30 seconds for manual wallet connection...');
                await this.page.waitForTimeout(30000);
                
                const manuallyConnected = await this.page.evaluate(() => {
                    const text = document.body.textContent.toLowerCase();
                    return text.includes('connected') || text.includes('0x');
                });
                
                await this.logStep('Manual wallet connection', manuallyConnected);
                connected = manuallyConnected;
            }

            await this.takeScreenshot('02-wallet-status');
            return connected;

        } catch (error) {
            await this.logStep('Wallet connection', false, error.message);
            return false;
        }
    }

    async step3_NavigateToSubscriptionForm() {
        console.log('\n📝 Step 3: Navigate to Subscription Form');
        
        try {
            // Look for subscription-related navigation or forms
            const formSelectors = [
                'form',
                '[data-testid*="subscription"]',
                '[class*="subscription"]',
                'input[placeholder*="amount"]',
                'input[placeholder*="deposit"]',
                'button:has-text("Create")',
                'button:has-text("Subscribe")'
            ];

            let formFound = false;
            for (const selector of formSelectors) {
                const element = await this.page.$(selector);
                if (element) {
                    formFound = true;
                    break;
                }
            }

            await this.logStep('Subscription form found', formFound);
            
            if (!formFound) {
                // Try to navigate to create subscription page if it exists
                try {
                    await this.page.goto(`${this.config.baseUrl}/create-subscription`, { 
                        waitUntil: 'networkidle2',
                        timeout: 10000 
                    });
                    formFound = true;
                    await this.logStep('Navigated to subscription page', true);
                } catch {
                    await this.logStep('Subscription page navigation', false);
                }
            }

            await this.takeScreenshot('03-subscription-form');
            return formFound;

        } catch (error) {
            await this.logStep('Subscription form navigation', false, error.message);
            return false;
        }
    }

    async step4_FillSubscriptionForm() {
        console.log('\n✏️ Step 4: Fill Subscription Form');
        
        try {
            let formFilled = false;

            // Try to fill deposit amount
            const amountSelectors = [
                'input[placeholder*="amount"]',
                'input[placeholder*="deposit"]',
                'input[type="number"]',
                'input[data-testid*="amount"]',
                'input[name*="amount"]'
            ];

            for (const selector of amountSelectors) {
                const filled = await this.waitAndType(selector, '5.0', 'deposit amount');
                if (filled) {
                    await this.logStep('Deposit amount filled', true, '5.0 FLOW');
                    formFilled = true;
                    break;
                }
            }

            // Try to select AI models if available
            const modelSelectors = [
                'input[type="checkbox"]',
                '[data-testid*="model"]',
                '[class*="model"]'
            ];

            for (const selector of modelSelectors) {
                try {
                    const checkboxes = await this.page.$$(selector);
                    if (checkboxes.length > 0) {
                        // Click first checkbox
                        await checkboxes[0].click();
                        await this.logStep('AI model selected', true);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Try to fill other form fields
            const providerSelectors = [
                'input[placeholder*="provider"]',
                'input[name*="provider"]'
            ];

            for (const selector of providerSelectors) {
                const filled = await this.waitAndType(selector, '0x6daee039a7b9c2f0', 'provider address');
                if (filled) {
                    await this.logStep('Provider address filled', true);
                    break;
                }
            }

            await this.takeScreenshot('04-form-filled');
            return formFilled;

        } catch (error) {
            await this.logStep('Form filling', false, error.message);
            return false;
        }
    }

    async step5_SubmitSubscription() {
        console.log('\n🚀 Step 5: Submit Subscription');
        
        try {
            // Look for submit/create buttons
            const submitSelectors = [
                'button:has-text("Create")',
                'button:has-text("Submit")',
                'button:has-text("Subscribe")',
                'button[type="submit"]',
                'button[data-testid*="create"]',
                'button[data-testid*="submit"]'
            ];

            let submitted = false;
            for (const selector of submitSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        const isDisabled = await this.page.evaluate(el => el.disabled, element);
                        const text = await this.page.evaluate(el => el.textContent, element);
                        
                        console.log(`🔍 Found submit button: "${text}" (disabled: ${isDisabled})`);
                        
                        if (!isDisabled) {
                            await element.click();
                            await this.logStep('Subscription submitted', true, `Clicked: "${text}"`);
                            submitted = true;
                            break;
                        } else {
                            await this.logStep('Submit button found but disabled', false, `"${text}" is disabled`);
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            if (submitted) {
                console.log('⏳ Waiting for transaction processing...');
                await this.page.waitForTimeout(10000);
                
                // Look for success/error indicators
                const success = await this.page.evaluate(() => {
                    const text = document.body.textContent.toLowerCase();
                    return text.includes('success') || 
                           text.includes('created') || 
                           text.includes('vault id') ||
                           text.includes('transaction');
                });
                
                const error = await this.page.evaluate(() => {
                    const text = document.body.textContent.toLowerCase();
                    return text.includes('error') || 
                           text.includes('failed') || 
                           text.includes('rejected');
                });

                await this.logStep('Transaction result', success && !error, 
                    success ? 'Success indicators found' : 
                    error ? 'Error indicators found' : 
                    'No clear result');
            }

            await this.takeScreenshot('05-submission-result');
            return submitted;

        } catch (error) {
            await this.logStep('Subscription submission', false, error.message);
            return false;
        }
    }

    async step6_VerifyResults() {
        console.log('\n🔍 Step 6: Verify Results');
        
        try {
            // Wait a bit more for any async operations
            await this.page.waitForTimeout(5000);
            
            // Check for subscription-related content
            const hasSubscriptionContent = await this.page.evaluate(() => {
                const text = document.body.textContent.toLowerCase();
                return {
                    hasVaultId: text.includes('vault') && /\d+/.test(text),
                    hasLiteLLM: text.includes('litellm') || text.includes('api key'),
                    hasBalance: text.includes('balance') || text.includes('flow'),
                    hasUsage: text.includes('usage') || text.includes('tokens'),
                    hasError: text.includes('error') || text.includes('failed')
                };
            });

            await this.logStep('Vault ID visible', hasSubscriptionContent.hasVaultId);
            await this.logStep('LiteLLM key references', hasSubscriptionContent.hasLiteLLM);
            await this.logStep('Balance information', hasSubscriptionContent.hasBalance);
            await this.logStep('Usage tracking', hasSubscriptionContent.hasUsage);
            
            if (hasSubscriptionContent.hasError) {
                await this.logStep('Error state detected', false, 'Check for error messages');
            }

            await this.takeScreenshot('06-final-state');
            
            return !hasSubscriptionContent.hasError && 
                   (hasSubscriptionContent.hasVaultId || hasSubscriptionContent.hasLiteLLM);

        } catch (error) {
            await this.logStep('Results verification', false, error.message);
            return false;
        }
    }

    async runFullTest() {
        try {
            await this.setup();

            console.log('\n🧪 STARTING SUBSCRIPTION CREATION TEST');
            console.log('=====================================');

            const step1 = await this.step1_LoadApplication();
            if (!step1) return false;

            const step2 = await this.step2_ConnectWallet();
            if (!step2) {
                console.log('⚠️ Wallet connection failed - manual intervention may be needed');
            }

            const step3 = await this.step3_NavigateToSubscriptionForm();
            const step4 = await this.step4_FillSubscriptionForm();
            const step5 = await this.step5_SubmitSubscription();
            const step6 = await this.step6_VerifyResults();

            this.printTestSummary();

        } catch (error) {
            console.error('❌ Test execution failed:', error);
        } finally {
            await this.teardown();
        }
    }

    printTestSummary() {
        console.log('\n📊 SUBSCRIPTION TEST SUMMARY');
        console.log('===============================');
        
        const passed = this.testSteps.filter(s => s.success).length;
        const total = this.testSteps.length;
        
        console.log(`Total Steps: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${(passed/total*100).toFixed(1)}%`);

        console.log('\n📋 DETAILED RESULTS:');
        this.testSteps.forEach(step => {
            const icon = step.success ? '✅' : '❌';
            console.log(`${icon} ${step.stepName}: ${step.details}`);
        });

        console.log('\n💡 NEXT STEPS:');
        console.log('- Review screenshots for visual verification');
        console.log('- Check browser network tab for failed requests');
        console.log('- Verify Flow transaction in Flow Explorer if submission succeeded');
        console.log('- Test LiteLLM key functionality if subscription was created');
    }
}

// Run the test
async function main() {
    const tester = new NativeBrowserSubscriptionTest();
    await tester.runFullTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NativeBrowserSubscriptionTest;