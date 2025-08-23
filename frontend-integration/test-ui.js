/**
 * Puppeteer UI Test Suite for Flow Actions Subscription Platform
 * Tests the complete user journey from wallet connection to subscription management
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    viewport: { width: 1280, height: 720 },
    headless: false, // Set to true for CI/automated testing
    slowMo: 100, // Slow down actions for better visibility
};

// Test utilities
class UITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async setup() {
        console.log('🚀 Starting Puppeteer UI Tests...');
        
        this.browser = await puppeteer.launch({
            headless: CONFIG.headless,
            slowMo: CONFIG.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport(CONFIG.viewport);
        
        // Set up console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Browser Console Error:', msg.text());
            }
        });

        // Set up error handling
        this.page.on('pageerror', error => {
            console.log('❌ Page Error:', error.message);
        });

        console.log('✅ Browser setup complete');
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
        console.log('🧹 Browser closed');
    }

    async logTest(testName, passed, details = '') {
        const result = { testName, passed, details, timestamp: new Date().toISOString() };
        this.testResults.push(result);
        
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${testName}: ${passed ? 'PASSED' : 'FAILED'} ${details}`);
    }

    async waitForSelector(selector, timeout = CONFIG.timeout) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            console.log(`⚠️ Selector not found: ${selector}`);
            return false;
        }
    }

    async clickButton(selector, description) {
        try {
            await this.page.waitForSelector(selector, { timeout: CONFIG.timeout });
            await this.page.click(selector);
            await this.page.waitForTimeout(1000); // Wait for UI to respond
            return true;
        } catch (error) {
            console.log(`❌ Failed to click ${description}: ${error.message}`);
            return false;
        }
    }

    async typeText(selector, text, description) {
        try {
            await this.page.waitForSelector(selector);
            await this.page.click(selector);
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type(selector, text);
            return true;
        } catch (error) {
            console.log(`❌ Failed to type in ${description}: ${error.message}`);
            return false;
        }
    }

    async takeScreenshot(name) {
        const filename = `test-screenshot-${name}-${Date.now()}.png`;
        await this.page.screenshot({ 
            path: filename,
            fullPage: true 
        });
        console.log(`📸 Screenshot saved: ${filename}`);
        return filename;
    }

    // Test 1: Basic page load and UI elements
    async testPageLoad() {
        console.log('\n🧪 Test 1: Page Load and Basic UI Elements');
        
        try {
            await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle2' });
            
            // Check if page loaded
            const title = await this.page.title();
            const hasTitle = title.length > 0;
            await this.logTest('Page loads with title', hasTitle, `Title: "${title}"`);

            // Check for main navigation/header
            const hasHeader = await this.waitForSelector('nav, header, [data-testid="header"]');
            await this.logTest('Header/navigation present', hasHeader);

            // Check for main content area
            const hasMainContent = await this.waitForSelector('main, [data-testid="main"], .container');
            await this.logTest('Main content area present', hasMainContent);

            // Look for Flow-related elements
            const hasFlowElements = await this.waitForSelector('[data-testid*="flow"], [class*="flow"], button:contains("Connect"), button:contains("Login")');
            await this.logTest('Flow/wallet UI elements present', hasFlowElements);

            await this.takeScreenshot('page-load');
            return true;

        } catch (error) {
            await this.logTest('Page load', false, error.message);
            return false;
        }
    }

    // Test 2: Wallet connection simulation
    async testWalletConnection() {
        console.log('\n🧪 Test 2: Wallet Connection Flow');
        
        try {
            // Look for connect wallet button with various possible selectors
            const connectSelectors = [
                'button:contains("Connect")',
                'button:contains("Login")', 
                'button:contains("Sign In")',
                '[data-testid="connect-wallet"]',
                '.connect-wallet',
                'button[class*="connect"]'
            ];

            let connectButton = null;
            for (const selector of connectSelectors) {
                if (await this.waitForSelector(selector, 2000)) {
                    connectButton = selector;
                    break;
                }
            }

            if (connectButton) {
                await this.logTest('Connect wallet button found', true, `Selector: ${connectButton}`);
                
                // Click connect button
                const clicked = await this.clickButton(connectButton, 'connect wallet button');
                await this.logTest('Connect wallet button clickable', clicked);

                // Wait for potential wallet popup or connection flow
                await this.page.waitForTimeout(3000);

                // Check if connection state changed
                const hasUserInfo = await this.waitForSelector('[data-testid*="user"], [class*="user"], .address, .balance', 5000);
                await this.logTest('User info appears after connection attempt', hasUserInfo);

                await this.takeScreenshot('wallet-connection');
            } else {
                await this.logTest('Connect wallet button found', false, 'No connect button found');
            }

            return true;

        } catch (error) {
            await this.logTest('Wallet connection flow', false, error.message);
            return false;
        }
    }

    // Test 3: Subscription form interaction
    async testSubscriptionForm() {
        console.log('\n🧪 Test 3: Subscription Form Interaction');
        
        try {
            // Look for subscription form elements
            const formSelectors = [
                'form',
                '[data-testid*="subscription"]',
                '[class*="subscription"]',
                'input[placeholder*="amount"]',
                'input[type="number"]'
            ];

            let hasForm = false;
            for (const selector of formSelectors) {
                if (await this.waitForSelector(selector, 2000)) {
                    hasForm = true;
                    break;
                }
            }

            await this.logTest('Subscription form elements present', hasForm);

            if (hasForm) {
                // Test amount input
                const amountInputs = [
                    'input[placeholder*="amount"]',
                    'input[placeholder*="deposit"]', 
                    'input[type="number"]',
                    '[data-testid*="amount"]'
                ];

                for (const selector of amountInputs) {
                    if (await this.waitForSelector(selector, 1000)) {
                        const typed = await this.typeText(selector, '5.0', 'amount input');
                        await this.logTest('Amount input functional', typed);
                        break;
                    }
                }

                // Look for model selection
                const hasModelSelection = await this.waitForSelector('[data-testid*="model"], [class*="model"], input[type="checkbox"]', 2000);
                await this.logTest('Model selection UI present', hasModelSelection);

                // Look for create/submit button
                const submitSelectors = [
                    'button:contains("Create")',
                    'button:contains("Submit")',
                    'button[type="submit"]',
                    '[data-testid*="create"]',
                    '[data-testid*="submit"]'
                ];

                let hasSubmitButton = false;
                for (const selector of submitSelectors) {
                    if (await this.waitForSelector(selector, 1000)) {
                        hasSubmitButton = true;
                        break;
                    }
                }

                await this.logTest('Submit/Create button present', hasSubmitButton);
                await this.takeScreenshot('subscription-form');
            }

            return true;

        } catch (error) {
            await this.logTest('Subscription form interaction', false, error.message);
            return false;
        }
    }

    // Test 4: Usage data display
    async testUsageDataDisplay() {
        console.log('\n🧪 Test 4: Usage Data Display');
        
        try {
            // Look for usage-related elements
            const usageSelectors = [
                '[data-testid*="usage"]',
                '[class*="usage"]',
                '[data-testid*="subscription"]',
                '.subscription-tile',
                '.usage-data',
                'div:contains("FLOW")',
                'div:contains("tokens")',
                'div:contains("requests")'
            ];

            let hasUsageElements = false;
            for (const selector of usageSelectors) {
                if (await this.waitForSelector(selector, 2000)) {
                    hasUsageElements = true;
                    break;
                }
            }

            await this.logTest('Usage data elements present', hasUsageElements);

            // Check for LiteLLM specific elements
            const hasLiteLLMElements = await this.waitForSelector('[data-testid*="litellm"], [class*="litellm"], div:contains("API"), div:contains("key")', 2000);
            await this.logTest('LiteLLM related elements present', hasLiteLLMElements);

            // Check for loading states
            const hasLoadingStates = await this.waitForSelector('[data-testid*="loading"], .loading, .spinner', 2000);
            await this.logTest('Loading state UI present', hasLoadingStates);

            // Check for error handling UI
            const hasErrorHandling = await this.waitForSelector('[data-testid*="error"], .error, .alert', 2000);
            await this.logTest('Error handling UI present', hasErrorHandling);

            await this.takeScreenshot('usage-data-display');
            return true;

        } catch (error) {
            await this.logTest('Usage data display', false, error.message);
            return false;
        }
    }

    // Test 5: Debug page functionality
    async testDebugPage() {
        console.log('\n🧪 Test 5: Debug Page Functionality');
        
        try {
            // Try to navigate to debug page
            await this.page.goto(`${CONFIG.baseUrl}/debug-litellm`, { waitUntil: 'networkidle2' });
            
            const hasDebugContent = await this.waitForSelector('h1:contains("Debug"), [data-testid*="debug"]', 5000);
            await this.logTest('Debug page loads', hasDebugContent);

            if (hasDebugContent) {
                // Look for test buttons
                const hasTestButton = await this.waitForSelector('button:contains("Test"), [data-testid*="test"]');
                await this.logTest('Debug test buttons present', hasTestButton);

                // Look for configuration info
                const hasConfigInfo = await this.waitForSelector('div:contains("URL"), div:contains("Key"), div:contains("Status")');
                await this.logTest('Configuration info displayed', hasConfigInfo);

                await this.takeScreenshot('debug-page');
            }

            return true;

        } catch (error) {
            await this.logTest('Debug page functionality', false, error.message);
            return false;
        }
    }

    // Test 6: Responsive design
    async testResponsiveDesign() {
        console.log('\n🧪 Test 6: Responsive Design');
        
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await this.page.reload({ waitUntil: 'networkidle2' });
            
            const mobileLayoutGood = await this.waitForSelector('body', 2000);
            await this.logTest('Mobile viewport renders', mobileLayoutGood);
            await this.takeScreenshot('mobile-view');

            // Test tablet viewport  
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.page.reload({ waitUntil: 'networkidle2' });
            
            const tabletLayoutGood = await this.waitForSelector('body', 2000);
            await this.logTest('Tablet viewport renders', tabletLayoutGood);
            await this.takeScreenshot('tablet-view');

            // Restore desktop viewport
            await this.page.setViewport(CONFIG.viewport);
            await this.page.reload({ waitUntil: 'networkidle2' });

            return true;

        } catch (error) {
            await this.logTest('Responsive design', false, error.message);
            return false;
        }
    }

    // Run all tests
    async runAllTests() {
        try {
            await this.setup();

            // Run test suite
            await this.testPageLoad();
            await this.testWalletConnection();
            await this.testSubscriptionForm();
            await this.testUsageDataDisplay();
            await this.testDebugPage();
            await this.testResponsiveDesign();

            // Print summary
            this.printTestSummary();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            await this.teardown();
        }
    }

    printTestSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        const failureRate = ((total - passed) / total * 100).toFixed(1);
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${(passed/total*100).toFixed(1)}%`);
        
        if (total - passed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => console.log(`  - ${t.testName}: ${t.details}`));
        }

        console.log('\n✅ PASSED TESTS:');
        this.testResults
            .filter(t => t.passed)
            .forEach(t => console.log(`  - ${t.testName}`));
    }
}

// Run the tests
async function main() {
    const tester = new UITester();
    await tester.runAllTests();
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UITester;