/**
 * Puppeteer Test Recorder & Replayer
 * Records your manual actions in native browser and replays them as automated tests
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PuppeteerTestRecorder {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isRecording = false;
        this.recordedActions = [];
        this.startTime = null;
        this.config = {
            baseUrl: 'http://localhost:3006',
            recordingsDir: './test-recordings',
            slowMo: 500,
        };
    }

    async setup() {
        console.log('🎬 Setting up Puppeteer Test Recorder...');
        
        // Ensure recordings directory exists
        try {
            await fs.mkdir(this.config.recordingsDir, { recursive: true });
        } catch (e) {
            // Directory already exists
        }

        const userDataDir = path.join(process.env.TEMP || '/tmp', 'puppet-recorder-' + Date.now());
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: this.config.slowMo,
            devtools: true,
            defaultViewport: null,
            userDataDir: userDataDir,
            args: [
                '--start-maximized',
                '--no-first-run',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Add recording capabilities
        await this.setupRecording();
        
        console.log('✅ Browser launched with recording capabilities');
    }

    async setupRecording() {
        // Inject recording script into the page
        await this.page.evaluateOnNewDocument(() => {
            window.puppeteerRecorder = {
                actions: [],
                startTime: Date.now(),
                isRecording: false,
                
                recordAction(type, details) {
                    if (!this.isRecording) return;
                    
                    const action = {
                        type,
                        timestamp: Date.now() - this.startTime,
                        details,
                        url: window.location.href,
                        title: document.title
                    };
                    
                    this.actions.push(action);
                    console.log('🎬 Recorded:', action.type, action.details);
                },
                
                startRecording() {
                    this.isRecording = true;
                    this.startTime = Date.now();
                    this.actions = [];
                    console.log('🔴 Recording started');
                },
                
                stopRecording() {
                    this.isRecording = false;
                    console.log('⏹️ Recording stopped');
                    return this.actions;
                },
                
                getActions() {
                    return this.actions;
                }
            };
            
            // Record clicks
            document.addEventListener('click', (e) => {
                if (!window.puppeteerRecorder.isRecording) return;
                
                const element = e.target;
                const selector = window.puppeteerRecorder.generateSelector(element);
                
                window.puppeteerRecorder.recordAction('click', {
                    selector,
                    text: element.textContent?.trim() || '',
                    tagName: element.tagName,
                    type: element.type || '',
                    id: element.id || '',
                    className: element.className || '',
                    x: e.clientX,
                    y: e.clientY
                });
            });
            
            // Record typing
            document.addEventListener('input', (e) => {
                if (!window.puppeteerRecorder.isRecording) return;
                
                const element = e.target;
                const selector = window.puppeteerRecorder.generateSelector(element);
                
                window.puppeteerRecorder.recordAction('type', {
                    selector,
                    value: element.value,
                    placeholder: element.placeholder || '',
                    type: element.type || '',
                    id: element.id || '',
                    name: element.name || ''
                });
            });
            
            // Record form submissions
            document.addEventListener('submit', (e) => {
                if (!window.puppeteerRecorder.isRecording) return;
                
                const form = e.target;
                const selector = window.puppeteerRecorder.generateSelector(form);
                
                window.puppeteerRecorder.recordAction('submit', {
                    selector,
                    action: form.action || '',
                    method: form.method || 'GET'
                });
            });
            
            // Record navigation
            let lastUrl = window.location.href;
            setInterval(() => {
                if (!window.puppeteerRecorder.isRecording) return;
                
                if (window.location.href !== lastUrl) {
                    window.puppeteerRecorder.recordAction('navigate', {
                        from: lastUrl,
                        to: window.location.href,
                        title: document.title
                    });
                    lastUrl = window.location.href;
                }
            }, 500);
            
            // Helper function to generate CSS selectors
            window.puppeteerRecorder.generateSelector = function(element) {
                if (element.id) {
                    return `#${element.id}`;
                }
                
                if (element.name) {
                    return `[name="${element.name}"]`;
                }
                
                if (element.className) {
                    const classes = element.className.split(' ').filter(c => c.trim());
                    if (classes.length > 0) {
                        return `.${classes.join('.')}`;
                    }
                }
                
                // Generate path-based selector
                const path = [];
                let current = element;
                
                while (current && current !== document.body) {
                    let selector = current.tagName.toLowerCase();
                    
                    if (current.id) {
                        path.unshift(`#${current.id}`);
                        break;
                    }
                    
                    const siblings = Array.from(current.parentElement?.children || [])
                        .filter(sibling => sibling.tagName === current.tagName);
                    
                    if (siblings.length > 1) {
                        const index = siblings.indexOf(current) + 1;
                        selector += `:nth-of-type(${index})`;
                    }
                    
                    path.unshift(selector);
                    current = current.parentElement;
                }
                
                return path.join(' > ');
            };
        });
    }

    async startRecording(testName = 'subscription-test') {
        console.log(`🎬 Starting recording: ${testName}`);
        
        await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle2' });
        
        // Start recording
        await this.page.evaluate(() => {
            window.puppeteerRecorder.startRecording();
        });
        
        this.isRecording = true;
        this.startTime = Date.now();
        this.currentTestName = testName;
        
        console.log('🔴 Recording started! Perform your actions in the browser...');
        console.log('📝 Actions being recorded:');
        console.log('   - Clicks on buttons, links, form elements');
        console.log('   - Text input in form fields');
        console.log('   - Form submissions');
        console.log('   - Page navigation');
        console.log('');
        console.log('⏹️ Press Ctrl+C to stop recording and save');
        
        // Monitor for console messages
        this.page.on('console', msg => {
            if (msg.text().includes('🎬 Recorded:')) {
                console.log(msg.text());
            }
        });
    }

    async stopRecording() {
        if (!this.isRecording) {
            console.log('⚠️ No recording in progress');
            return;
        }
        
        console.log('⏹️ Stopping recording...');
        
        // Get recorded actions from the page
        const actions = await this.page.evaluate(() => {
            return window.puppeteerRecorder.stopRecording();
        });
        
        this.recordedActions = actions;
        this.isRecording = false;
        
        // Save recording
        const filename = await this.saveRecording();
        
        console.log(`✅ Recording saved: ${filename}`);
        console.log(`📊 Recorded ${actions.length} actions in ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
        
        // Print summary
        this.printActionSummary(actions);
        
        return filename;
    }

    async saveRecording() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${this.currentTestName}-${timestamp}.json`;
        const filepath = path.join(this.config.recordingsDir, filename);
        
        const recordingData = {
            name: this.currentTestName,
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            baseUrl: this.config.baseUrl,
            actions: this.recordedActions,
            metadata: {
                userAgent: await this.page.evaluate(() => navigator.userAgent),
                viewport: await this.page.viewport(),
                url: await this.page.url(),
                title: await this.page.title()
            }
        };
        
        await fs.writeFile(filepath, JSON.stringify(recordingData, null, 2));
        return filename;
    }

    printActionSummary(actions) {
        console.log('\n📋 ACTION SUMMARY:');
        console.log('==================');
        
        const actionTypes = {};
        actions.forEach(action => {
            actionTypes[action.type] = (actionTypes[action.type] || 0) + 1;
        });
        
        Object.entries(actionTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} action(s)`);
        });
        
        console.log('\n🎬 First 5 actions:');
        actions.slice(0, 5).forEach((action, i) => {
            console.log(`   ${i + 1}. ${action.type}: ${JSON.stringify(action.details).substring(0, 100)}...`);
        });
    }

    async listRecordings() {
        try {
            const files = await fs.readdir(this.config.recordingsDir);
            const recordings = files.filter(f => f.endsWith('.json'));
            
            console.log('📁 Available recordings:');
            console.log('========================');
            
            for (const file of recordings) {
                try {
                    const content = await fs.readFile(path.join(this.config.recordingsDir, file), 'utf8');
                    const data = JSON.parse(content);
                    
                    console.log(`📝 ${file}`);
                    console.log(`   Name: ${data.name}`);
                    console.log(`   Date: ${new Date(data.timestamp).toLocaleString()}`);
                    console.log(`   Actions: ${data.actions.length}`);
                    console.log(`   Duration: ${(data.duration / 1000).toFixed(1)}s`);
                    console.log('');
                } catch (e) {
                    console.log(`❌ ${file} - corrupted`);
                }
            }
            
            return recordings;
        } catch (error) {
            console.log('📁 No recordings directory found');
            return [];
        }
    }

    async replayRecording(filename) {
        console.log(`🎮 Replaying recording: ${filename}`);
        
        const filepath = path.join(this.config.recordingsDir, filename);
        
        try {
            const content = await fs.readFile(filepath, 'utf8');
            const recording = JSON.parse(content);
            
            console.log(`📋 Replay details:`);
            console.log(`   Name: ${recording.name}`);
            console.log(`   Actions: ${recording.actions.length}`);
            console.log(`   Original duration: ${(recording.duration / 1000).toFixed(1)}s`);
            console.log('');
            
            // Navigate to starting URL
            await this.page.goto(recording.baseUrl, { waitUntil: 'networkidle2' });
            console.log(`🌐 Navigated to: ${recording.baseUrl}`);
            
            // Replay each action
            let lastTimestamp = 0;
            for (let i = 0; i < recording.actions.length; i++) {
                const action = recording.actions[i];
                const delay = action.timestamp - lastTimestamp;
                
                if (delay > 100) {
                    await this.page.waitForTimeout(Math.min(delay, 3000)); // Cap delay at 3s
                }
                
                await this.replayAction(action, i + 1);
                lastTimestamp = action.timestamp;
            }
            
            console.log('✅ Replay completed successfully!');
            
            // Take final screenshot
            await this.page.screenshot({ 
                path: `replay-final-${Date.now()}.png`, 
                fullPage: true 
            });
            console.log('📸 Final screenshot saved');
            
        } catch (error) {
            console.error('❌ Replay failed:', error.message);
        }
    }

    async replayAction(action, stepNumber) {
        console.log(`🎬 Step ${stepNumber}: ${action.type} - ${JSON.stringify(action.details).substring(0, 100)}...`);
        
        try {
            switch (action.type) {
                case 'click':
                    await this.page.waitForSelector(action.details.selector, { timeout: 5000 });
                    await this.page.click(action.details.selector);
                    console.log(`   ✅ Clicked: ${action.details.text || action.details.selector}`);
                    break;
                    
                case 'type':
                    await this.page.waitForSelector(action.details.selector, { timeout: 5000 });
                    await this.page.click(action.details.selector); // Focus first
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('a');
                    await this.page.keyboard.up('Control');
                    await this.page.type(action.details.selector, action.details.value);
                    console.log(`   ✅ Typed: "${action.details.value}" in ${action.details.selector}`);
                    break;
                    
                case 'submit':
                    await this.page.waitForSelector(action.details.selector, { timeout: 5000 });
                    await this.page.click(`${action.details.selector} [type="submit"], ${action.details.selector} button`);
                    console.log(`   ✅ Submitted form: ${action.details.selector}`);
                    break;
                    
                case 'navigate':
                    if (action.details.to !== this.page.url()) {
                        await this.page.goto(action.details.to, { waitUntil: 'networkidle2' });
                        console.log(`   ✅ Navigated to: ${action.details.to}`);
                    }
                    break;
                    
                default:
                    console.log(`   ⚠️ Unknown action type: ${action.type}`);
            }
            
            await this.page.waitForTimeout(500); // Small delay between actions
            
        } catch (error) {
            console.log(`   ❌ Failed to replay action: ${error.message}`);
        }
    }

    async teardown() {
        if (this.browser) {
            console.log('🧹 Browser will remain open for inspection...');
            // Don't close browser automatically
        }
    }
}

// CLI Interface
async function main() {
    const recorder = new PuppeteerTestRecorder();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    // Don't setup browser for list or help commands
    if (command === 'list') {
        await recorder.listRecordings();
        process.exit(0);
    }
    
    if (!command || command === 'help') {
        console.log('🎬 Puppeteer Test Recorder & Replayer');
        console.log('====================================');
        console.log('');
        console.log('Commands:');
        console.log('  record [name]     - Start recording actions (default name: subscription-test)');
        console.log('  replay <file>     - Replay a recorded session');
        console.log('  list              - List available recordings');
        console.log('');
        console.log('Examples:');
        console.log('  npm run test:record');
        console.log('  npm run test:record wallet-connect');
        console.log('  npm run test:replay subscription-test-2024-01-01.json');
        console.log('  npm run test:list');
        process.exit(0);
    }
    
    await recorder.setup();
    
    if (command === 'record') {
        const testName = args[1] || 'subscription-test';
        await recorder.startRecording(testName);
        
        // Handle Ctrl+C gracefully
        process.on('SIGINT', async () => {
            console.log('\n⏹️ Recording interrupted by user');
            await recorder.stopRecording();
            await recorder.teardown();
            process.exit(0);
        });
        
        // Keep process alive
        setInterval(() => {}, 1000);
        
    } else if (command === 'replay') {
        const filename = args[1];
        if (!filename) {
            console.log('❌ Please specify a recording file to replay');
            await recorder.listRecordings();
            return;
        }
        
        await recorder.replayRecording(filename);
        await recorder.teardown();
        
        
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PuppeteerTestRecorder;