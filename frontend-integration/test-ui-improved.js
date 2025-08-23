/**
 * Improved Puppeteer UI Test Suite for Flow Actions Subscription Platform
 * More robust version that handles React apps and modern UI patterns
 */

const puppeteer = require('puppeteer');

// Test configuration
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 15000,
    viewport: { width: 1280, height: 720 },
    headless: false,
    slowMo: 300,
};

class ImprovedUITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async setup() {
        console.log('🚀 Starting Improved UI Tests...');
        
        this.browser = await puppeteer.launch({
            headless: CONFIG.headless,
            slowMo: CONFIG.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport(CONFIG.viewport);
        
        // Ignore certain console messages
        this.page.on('console', msg => {
            if (msg.type() === 'error' && !msg.text().includes('WalletConnect') && !msg.text().includes('404')) {
                console.log('❌ Console Error:', msg.text());
            }
        });

        console.log('✅ Browser setup complete');
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async logTest(testName, passed, details = '') {
        const result = { testName, passed, details };
        this.testResults.push(result);
        
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${testName}: ${passed ? 'PASSED' : 'FAILED'} ${details}`);
    }

    async waitForElement(selector, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout, visible: true });
            return true;
        } catch {
            return false;
        }
    }

    async elementExists(selector) {
        try {
            const element = await this.page.$(selector);
            return element !== null;
        } catch {
            return false;
        }
    }

    async getTextContent(selector) {
        try {
            return await this.page.$eval(selector, el => el.textContent.trim());
        } catch {
            return null;
        }
    }

    async takeScreenshot(name) {
        const filename = `test-${name}-${Date.now()}.png`;
        await this.page.screenshot({ 
            path: filename,
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
        return filename;
    }

    // Test 1: Basic page structure
    async testPageStructure() {
        console.log('\n🧪 Test 1: Page Structure and Loading');
        
        try {
            await this.page.goto(CONFIG.baseUrl, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });

            // Wait for React to hydrate
            await this.page.waitForTimeout(2000);

            const title = await this.page.title();
            await this.logTest('Page loads with title', title.length > 0, `"${title}"`);

            // Check for any visible content
            const hasBody = await this.elementExists('body');
            await this.logTest('Body element exists', hasBody);

            // Look for React root or main app container
            const containers = ['#__next', '#root', '.container', 'main', 'div[id*="app"]'];
            let hasMainContainer = false;
            for (const selector of containers) {
                if (await this.elementExists(selector)) {
                    hasMainContainer = true;
                    break;
                }
            }
            await this.logTest('Main app container found', hasMainContainer);

            // Check for any interactive elements
            const interactiveElements = await this.page.$$('button, input, a, [role="button"]');
            await this.logTest('Interactive elements present', interactiveElements.length > 0, `Found ${interactiveElements.length} elements`);

            await this.takeScreenshot('page-structure');
            return true;

        } catch (error) {
            await this.logTest('Page structure test', false, error.message);
            return false;
        }
    }

    // Test 2: Content detection
    async testContentDetection() {
        console.log('\n🧪 Test 2: Content Detection');
        
        try {
            // Look for Flow/wallet related text
            const flowKeywords = ['Flow', 'FLOW', 'wallet', 'connect', 'subscription', 'LiteLLM'];
            let flowContentFound = false;
            
            for (const keyword of flowKeywords) {
                const hasKeyword = await this.page.evaluate((word) => {
                    return document.body.textContent.toLowerCase().includes(word.toLowerCase());
                }, keyword);
                
                if (hasKeyword) {
                    flowContentFound = true;
                    await this.logTest(`Content contains "${keyword}"`, true);
                    break;
                }
            }
            
            if (!flowContentFound) {
                await this.logTest('Flow-related content found', false, 'No Flow keywords detected');
            }

            // Check for buttons by text content
            const buttonTexts = ['Connect', 'Login', 'Sign In', 'Create', 'Subscribe'];
            const buttons = await this.page.$$('button');
            let foundButtons = [];
            
            for (const button of buttons) {
                const text = await this.page.evaluate(el => el.textContent.trim(), button);
                if (buttonTexts.some(btnText => text.toLowerCase().includes(btnText.toLowerCase()))) {
                    foundButtons.push(text);
                }
            }
            
            await this.logTest('Action buttons found', foundButtons.length > 0, foundButtons.join(', '));

            // Check for form inputs
            const inputs = await this.page.$$('input');
            await this.logTest('Form inputs present', inputs.length > 0, `Found ${inputs.length} inputs`);

            return true;

        } catch (error) {
            await this.logTest('Content detection', false, error.message);
            return false;
        }
    }

    // Test 3: User interactions
    async testUserInteractions() {
        console.log('\n🧪 Test 3: User Interactions');
        
        try {
            // Try to find and click the first button
            const buttons = await this.page.$$('button:not([disabled])');
            if (buttons.length > 0) {
                const firstButton = buttons[0];
                const buttonText = await this.page.evaluate(el => el.textContent.trim(), firstButton);
                
                try {
                    await firstButton.click();
                    await this.page.waitForTimeout(1000);
                    await this.logTest('Button click interaction', true, `Clicked: "${buttonText}"`);
                } catch {
                    await this.logTest('Button click interaction', false, `Failed to click: "${buttonText}"`);
                }
            } else {
                await this.logTest('Button click interaction', false, 'No clickable buttons found');
            }

            // Try to interact with form inputs
            const textInputs = await this.page.$$('input[type="text"], input[type="number"], input:not([type])');
            if (textInputs.length > 0) {
                try {
                    await textInputs[0].click();
                    await textInputs[0].type('test');
                    await this.logTest('Input field interaction', true, 'Successfully typed in input');
                } catch {
                    await this.logTest('Input field interaction', false, 'Failed to type in input');
                }
            } else {
                await this.logTest('Input field interaction', false, 'No text inputs found');
            }

            await this.takeScreenshot('user-interactions');
            return true;

        } catch (error) {
            await this.logTest('User interactions', false, error.message);
            return false;
        }
    }

    // Test 4: Navigation and routing
    async testNavigation() {
        console.log('\n🧪 Test 4: Navigation and Routing');
        
        try {
            // Try to navigate to debug page
            const debugUrl = `${CONFIG.baseUrl}/debug-litellm`;
            await this.page.goto(debugUrl, { waitUntil: 'networkidle0', timeout: 15000 });
            
            const debugPageContent = await this.page.evaluate(() => {
                return document.body.textContent.toLowerCase().includes('debug');
            });
            
            await this.logTest('Debug page navigation', debugPageContent, 'Found debug content');

            // Try wallet debug page
            const walletDebugUrl = `${CONFIG.baseUrl}/wallet-debug`;
            await this.page.goto(walletDebugUrl, { waitUntil: 'networkidle0', timeout: 15000 });
            
            const walletDebugContent = await this.page.evaluate(() => {
                return document.body.textContent.toLowerCase().includes('wallet') || 
                       document.body.textContent.toLowerCase().includes('debug');
            });
            
            await this.logTest('Wallet debug page navigation', walletDebugContent, 'Found wallet debug content');

            // Return to main page
            await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0', timeout: 15000 });
            await this.takeScreenshot('navigation-test');
            
            return true;

        } catch (error) {
            await this.logTest('Navigation test', false, error.message);
            return false;
        }
    }

    // Test 5: Performance and loading
    async testPerformance() {
        console.log('\n🧪 Test 5: Performance and Loading');
        
        try {
            const startTime = Date.now();
            await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });
            const loadTime = Date.now() - startTime;
            
            await this.logTest('Page load time reasonable', loadTime < 10000, `${loadTime}ms`);

            // Check for loading states
            const hasLoadingElements = await this.page.evaluate(() => {
                const loadingKeywords = ['loading', 'spinner', 'pending'];
                const allText = document.body.textContent.toLowerCase();
                return loadingKeywords.some(keyword => allText.includes(keyword));
            });
            
            await this.logTest('Loading states detected', hasLoadingElements, 'Found loading indicators');

            // Check for error states
            const hasErrorElements = await this.page.evaluate(() => {
                const errorKeywords = ['error', 'failed', 'problem'];
                const allText = document.body.textContent.toLowerCase();
                return errorKeywords.some(keyword => allText.includes(keyword));
            });
            
            await this.logTest('Error handling visible', hasErrorElements, 'Found error handling');

            return true;

        } catch (error) {
            await this.logTest('Performance test', false, error.message);
            return false;
        }
    }

    async runAllTests() {
        try {
            await this.setup();

            await this.testPageStructure();
            await this.testContentDetection();
            await this.testUserInteractions();
            await this.testNavigation();
            await this.testPerformance();

            this.printSummary();

        } catch (error) {
            console.error('❌ Test suite error:', error);
        } finally {
            await this.teardown();
        }
    }

    printSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        
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
            .forEach(t => console.log(`  - ${t.testName}: ${t.details}`));

        console.log('\n💡 Next Steps:');
        console.log('  - Check screenshots for visual verification');
        console.log('  - Add data-testid attributes for more reliable testing');
        console.log('  - Implement wallet connection mocking for full flow testing');
    }
}

// Run the tests
async function main() {
    const tester = new ImprovedUITester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ImprovedUITester;