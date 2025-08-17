#!/bin/bash

# Setup script for LiteLLM → Flare Oracle Integration

echo "🚀 Setting up LiteLLM → Flare Oracle Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Copy environment template
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
else
    echo "ℹ️  Environment file already exists"
fi

echo ""
echo "🎯 Setup Complete! Next steps:"
echo ""
echo "1. Edit .env file with your configuration:"
echo "   - LITELLM_API_KEY: Your LiteLLM API key"
echo "   - FLARE_API_KEY: Your Flare network API key"
echo "   - FLARE_SUBMITTER_ADDRESS: Your Flare submitter address"
echo "   - FLARE_SUBMITTER_PRIVATE_KEY: Your Flare private key"
echo ""
echo "2. Test the connection:"
echo "   npm test"
echo ""
echo "3. Start the connector:"
echo "   npm start"
echo ""
echo "4. For development (auto-restart):"
echo "   npm run dev"
echo ""
echo "📚 See README.md for detailed configuration options"
echo ""

# Create a simple test file
cat > test-connector.js << 'EOF'
const LiteLLMFlareConnector = require('./litellm-flare-connector');

async function testConnector() {
    console.log('🧪 Testing LiteLLM → Flare Connector...');
    
    const connector = new LiteLLMFlareConnector({
        litellmApiUrl: process.env.LITELLM_API_URL || 'https://llm.p10p.io',
        litellmApiKey: process.env.LITELLM_API_KEY || 'test-key',
        flareEndpoint: process.env.FLARE_ENDPOINT || 'https://coston2-api.flare.network/ext/bc/C/rpc',
        pollInterval: 10000 // 10 seconds for testing
    });
    
    console.log('📊 Connector Status:', connector.getStatus());
    
    // Test without actually starting
    console.log('✅ Connector initialized successfully!');
    console.log('💡 To run full test, configure .env file and restart');
}

testConnector().catch(console.error);
EOF

echo "✅ Test file created: test-connector.js"
echo ""