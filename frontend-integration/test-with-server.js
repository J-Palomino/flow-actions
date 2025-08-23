/**
 * Test runner that starts the dev server and runs UI tests
 */

const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

async function waitForServer(url, maxAttempts = 30) {
    const page = await (await puppeteer.launch()).newPage();
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await page.goto(url, { timeout: 5000 });
            console.log('✅ Server is ready!');
            await page.browser().close();
            return true;
        } catch {
            console.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    await page.browser().close();
    return false;
}

async function main() {
    console.log('🚀 Starting dev server and running UI tests...');
    
    // Start the dev server
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true
    });

    server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Ready in') || output.includes('Local:')) {
            console.log('📡 Dev server output:', output.trim());
        }
    });

    server.stderr.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('warn') && !output.includes('info')) {
            console.log('⚠️ Server error:', output.trim());
        }
    });

    try {
        // Wait for server to be ready
        const serverReady = await waitForServer('http://localhost:3000');
        
        if (!serverReady) {
            console.log('❌ Server failed to start in time');
            process.exit(1);
        }

        // Run the tests
        console.log('\n🧪 Running UI tests...\n');
        const UITester = require('./test-ui-improved');
        const tester = new UITester();
        await tester.runAllTests();

    } catch (error) {
        console.error('❌ Test execution failed:', error);
    } finally {
        // Kill the server
        console.log('\n🛑 Stopping dev server...');
        server.kill('SIGTERM');
        
        // Force kill if it doesn't stop gracefully
        setTimeout(() => {
            server.kill('SIGKILL');
            process.exit(0);
        }, 5000);
    }
}

main().catch(console.error);