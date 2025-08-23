/**
 * Simple Native Browser Subscription Test
 * More reliable version with better element detection
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testSubscriptionFlow() {
    console.log('🚀 Starting Simple Subscription Test...');
    console.log('📋 This will use your native browser for real wallet testing');
    
    const userDataDir = path.join(process.env.TEMP || '/tmp', 'puppet-test-' + Date.now());
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 1500,
        devtools: true,
        defaultViewport: null,
        userDataDir: userDataDir,
        args: [
            '--start-maximized',
            '--no-first-run',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Enhanced console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error' && !text.includes('404') && !text.includes('WalletConnect')) {
                console.log('❌ Error:', text);
            } else if (text.includes('✅') || text.includes('❌') || text.includes('subscription')) {
                console.log('📝 App:', text);
            }
        });

        console.log('\n📄 Step 1: Loading application...');
        await page.goto('http://localhost:3006', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const title = await page.title();
        console.log(`✅ Page loaded: "${title}"`);
        
        await page.screenshot({ path: 'test-01-loaded.png', fullPage: true });
        console.log('📸 Screenshot: test-01-loaded.png');

        console.log('\n🔍 Step 2: Looking for interactive elements...');
        
        // Get all buttons and their text
        const buttons = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button'));
            return allButtons.map((btn, index) => ({
                index,
                text: btn.textContent.trim(),
                disabled: btn.disabled,
                visible: btn.offsetParent !== null
            })).filter(btn => btn.visible);
        });

        console.log(`✅ Found ${buttons.length} visible buttons:`);
        buttons.forEach(btn => {
            console.log(`   ${btn.index}: "${btn.text}" ${btn.disabled ? '(disabled)' : '(enabled)'}`);
        });

        // Get all inputs
        const inputs = await page.evaluate(() => {
            const allInputs = Array.from(document.querySelectorAll('input'));
            return allInputs.map((input, index) => ({
                index,
                type: input.type,
                placeholder: input.placeholder,
                name: input.name,
                id: input.id,
                visible: input.offsetParent !== null
            })).filter(input => input.visible);
        });

        console.log(`✅ Found ${inputs.length} visible inputs:`);
        inputs.forEach(input => {
            console.log(`   ${input.index}: type="${input.type}" placeholder="${input.placeholder}"`);
        });

        console.log('\n🖱️ Step 3: Attempting button interactions...');
        
        // Try to click the first enabled button
        const enabledButtons = buttons.filter(btn => !btn.disabled);
        if (enabledButtons.length > 0) {
            const firstButton = enabledButtons[0];
            console.log(`🔗 Clicking first enabled button: "${firstButton.text}"`);
            
            try {
                await page.click(`button:nth-of-type(${firstButton.index + 1})`);
                await page.waitForTimeout(3000);
                console.log('✅ Button clicked successfully');
                
                await page.screenshot({ path: 'test-02-after-click.png', fullPage: true });
                console.log('📸 Screenshot: test-02-after-click.png');
            } catch (error) {
                console.log('❌ Button click failed:', error.message);
            }
        }

        console.log('\n✏️ Step 4: Testing form inputs...');
        
        // Try to fill text/number inputs
        for (const input of inputs) {
            if (input.type === 'text' || input.type === 'number' || input.type === '') {
                try {
                    const selector = input.id ? `#${input.id}` : 
                                   input.name ? `input[name="${input.name}"]` : 
                                   `input:nth-of-type(${input.index + 1})`;
                    
                    console.log(`✏️ Filling input: ${input.placeholder || input.type || 'unnamed'}`);
                    
                    await page.click(selector);
                    await page.keyboard.down('Control');
                    await page.keyboard.press('a');
                    await page.keyboard.up('Control');
                    
                    const testValue = input.type === 'number' ? '5.0' : 'test value';
                    await page.type(selector, testValue);
                    
                    console.log(`✅ Filled with: "${testValue}"`);
                    await page.waitForTimeout(1000);
                    
                } catch (error) {
                    console.log(`❌ Failed to fill input: ${error.message}`);
                }
            }
        }

        await page.screenshot({ path: 'test-03-form-filled.png', fullPage: true });
        console.log('📸 Screenshot: test-03-form-filled.png');

        console.log('\n🔍 Step 5: Looking for wallet connection...');
        
        // Check for wallet-related content
        const walletStatus = await page.evaluate(() => {
            const text = document.body.textContent.toLowerCase();
            return {
                hasConnectButton: text.includes('connect'),
                hasWalletInfo: text.includes('0x') || text.includes('address'),
                hasBalance: text.includes('balance') || text.includes('flow'),
                hasError: text.includes('error')
            };
        });

        console.log('📊 Wallet Status:');
        console.log(`   Connect button text: ${walletStatus.hasConnectButton ? '✅' : '❌'}`);
        console.log(`   Wallet info visible: ${walletStatus.hasWalletInfo ? '✅' : '❌'}`);
        console.log(`   Balance info: ${walletStatus.hasBalance ? '✅' : '❌'}`);
        console.log(`   Error state: ${walletStatus.hasError ? '❌' : '✅'}`);

        console.log('\n⏳ Step 6: Waiting for manual interaction...');
        console.log('👤 Please manually:');
        console.log('   1. Connect your wallet if needed');
        console.log('   2. Fill any remaining form fields');
        console.log('   3. Submit the subscription');
        console.log('   4. This script will monitor for 60 seconds...');

        // Monitor for changes over 60 seconds
        for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(5000);
            
            const currentStatus = await page.evaluate(() => {
                const text = document.body.textContent.toLowerCase();
                return {
                    hasSuccess: text.includes('success') || text.includes('created') || text.includes('vault'),
                    hasError: text.includes('error') || text.includes('failed'),
                    hasTransaction: text.includes('transaction') || text.includes('tx'),
                    hasLiteLLM: text.includes('litellm') || text.includes('api key')
                };
            });

            if (currentStatus.hasSuccess || currentStatus.hasError || currentStatus.hasTransaction) {
                console.log(`\n🔔 Status change detected after ${(i + 1) * 5} seconds:`);
                console.log(`   Success: ${currentStatus.hasSuccess ? '✅' : '❌'}`);
                console.log(`   Error: ${currentStatus.hasError ? '❌' : '✅'}`);
                console.log(`   Transaction: ${currentStatus.hasTransaction ? '✅' : '❌'}`);
                console.log(`   LiteLLM: ${currentStatus.hasLiteLLM ? '✅' : '❌'}`);
                
                await page.screenshot({ path: `test-04-result-${i}.png`, fullPage: true });
                console.log(`📸 Screenshot: test-04-result-${i}.png`);
                break;
            }
            
            if (i % 3 === 0) {
                console.log(`⏳ Still monitoring... (${60 - (i + 1) * 5} seconds remaining)`);
            }
        }

        console.log('\n📊 FINAL TEST SUMMARY');
        console.log('=====================');
        console.log(`✅ Page loaded successfully`);
        console.log(`✅ Found ${buttons.length} buttons and ${inputs.length} inputs`);
        console.log(`✅ Browser interactions tested`);
        console.log(`📸 Screenshots saved for manual review`);
        
        console.log('\n💡 Manual Review Steps:');
        console.log('1. Check the browser window for current state');
        console.log('2. Review screenshots for UI issues');
        console.log('3. Test wallet connection manually');
        console.log('4. Verify subscription creation flow');
        
        console.log('\n🔧 Browser will remain open for manual testing...');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await browser.close();
    }
    
    // Don't close browser - let user inspect manually
    console.log('📝 Close browser manually when done');
}

// Run the test
if (require.main === module) {
    testSubscriptionFlow().catch(console.error);
}

module.exports = testSubscriptionFlow;