/**
 * Quick UI Test - assumes server is already running
 * Run this while your dev server is active
 */

const puppeteer = require('puppeteer');

async function quickTest() {
    console.log('🧪 Running Quick UI Test (assumes server running on localhost:3000)');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    try {
        // Test 1: Page loads
        console.log('📄 Loading main page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const title = await page.title();
        console.log(`✅ Page loaded: "${title}"`);
        
        // Take screenshot
        await page.screenshot({ path: 'test-main-page.png', fullPage: true });
        console.log('📸 Screenshot saved: test-main-page.png');
        
        // Test 2: Look for key elements
        console.log('🔍 Looking for UI elements...');
        
        // Check for buttons
        const buttons = await page.$$('button');
        console.log(`✅ Found ${buttons.length} buttons`);
        
        if (buttons.length > 0) {
            for (let i = 0; i < Math.min(3, buttons.length); i++) {
                const text = await page.evaluate(el => el.textContent.trim(), buttons[i]);
                console.log(`   Button ${i + 1}: "${text}"`);
            }
        }
        
        // Check for inputs
        const inputs = await page.$$('input');
        console.log(`✅ Found ${inputs.length} input fields`);
        
        // Check for content keywords
        const content = await page.evaluate(() => document.body.textContent.toLowerCase());
        const keywords = ['flow', 'subscription', 'wallet', 'connect', 'litellm'];
        const foundKeywords = keywords.filter(keyword => content.includes(keyword));
        console.log(`✅ Found keywords: ${foundKeywords.join(', ')}`);
        
        // Test 3: Try navigation
        console.log('🧭 Testing navigation...');
        
        try {
            await page.goto('http://localhost:3000/debug-litellm', { waitUntil: 'networkidle2', timeout: 10000 });
            console.log('✅ Debug page loaded');
            await page.screenshot({ path: 'test-debug-page.png', fullPage: true });
            console.log('📸 Screenshot saved: test-debug-page.png');
        } catch (error) {
            console.log('❌ Debug page failed to load:', error.message);
        }
        
        try {
            await page.goto('http://localhost:3000/wallet-debug', { waitUntil: 'networkidle2', timeout: 10000 });
            console.log('✅ Wallet debug page loaded');
            await page.screenshot({ path: 'test-wallet-debug.png', fullPage: true });
            console.log('📸 Screenshot saved: test-wallet-debug.png');
        } catch (error) {
            console.log('❌ Wallet debug page failed to load:', error.message);
        }
        
        // Test 4: Interaction test
        console.log('🖱️ Testing interactions...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        if (buttons.length > 0) {
            try {
                const firstButton = buttons[0];
                const buttonText = await page.evaluate(el => el.textContent.trim(), firstButton);
                console.log(`🖱️ Clicking button: "${buttonText}"`);
                
                await firstButton.click();
                await page.waitForTimeout(2000);
                
                console.log('✅ Button click completed');
                await page.screenshot({ path: 'test-after-click.png', fullPage: true });
                console.log('📸 Screenshot saved: test-after-click.png');
            } catch (error) {
                console.log('❌ Button interaction failed:', error.message);
            }
        }
        
        console.log('\n🎉 Quick test completed successfully!');
        console.log('\n📊 SUMMARY:');
        console.log(`   - Page loads: ✅`);
        console.log(`   - Buttons found: ${buttons.length}`);
        console.log(`   - Inputs found: ${inputs.length}`);
        console.log(`   - Keywords found: ${foundKeywords.length}`);
        console.log(`   - Screenshots taken: 3-4 files`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('🧹 Browser closed');
    }
}

// Run if called directly
if (require.main === module) {
    quickTest().catch(console.error);
}

module.exports = quickTest;