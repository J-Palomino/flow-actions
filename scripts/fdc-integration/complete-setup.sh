#!/bin/bash

# Complete Setup Script for LiteLLM → Flare Oracle Integration
# This script sets up everything needed to connect your Phala LiteLLM to Flare oracle

echo "🚀 Complete LiteLLM → Flare Oracle Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm found${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p config
echo -e "${GREEN}✅ Directories created${NC}"

# Generate Flare wallet if needed
echo ""
echo "🔥 Setting up Flare wallet..."

if [ ! -f ".env" ] || ! grep -q "FLARE_SUBMITTER_ADDRESS" .env; then
    echo "🔐 Generating new Flare wallet..."
    node generate-flare-wallet.js
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Save the wallet details above!${NC}"
    echo "Press Enter to continue after you've saved the wallet info..."
    read
else
    echo -e "${GREEN}✅ Flare wallet already configured${NC}"
fi

# Setup environment file
echo ""
echo "📝 Setting up environment configuration..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from template${NC}"
    
    # Update with Phala endpoint
    sed -i 's|LITELLM_API_URL=.*|LITELLM_API_URL=https://c1d44f34775bd04d0ec7a1f603cc2ff895d7d881-4000.dstack-prod7.phala.network|' .env
    echo -e "${GREEN}✅ Updated with Phala LiteLLM endpoint${NC}"
else
    echo -e "${YELLOW}ℹ️  .env file already exists${NC}"
fi

# Test Phala endpoint
echo ""
echo "🧪 Testing Phala LiteLLM endpoint..."
npm run test-phala

# Prompt for missing configuration
echo ""
echo "🔧 Configuration checklist:"
echo ""

# Check LiteLLM API key
if ! grep -q "LITELLM_API_KEY=.*[^_].*" .env; then
    echo -e "${YELLOW}⚠️  Missing: LITELLM_API_KEY${NC}"
    echo "   Get your API key from your LiteLLM instance"
    echo "   Add to .env: LITELLM_API_KEY=your_key_here"
    echo ""
fi

# Check Flare configuration
if ! grep -q "FLARE_SUBMITTER_ADDRESS=0x[a-fA-F0-9]" .env; then
    echo -e "${YELLOW}⚠️  Missing: FLARE_SUBMITTER_ADDRESS${NC}"
    echo "   Use the address generated above"
    echo "   Add to .env: FLARE_SUBMITTER_ADDRESS=0x..."
    echo ""
fi

if ! grep -q "FLARE_SUBMITTER_PRIVATE_KEY=0x[a-fA-F0-9]" .env; then
    echo -e "${YELLOW}⚠️  Missing: FLARE_SUBMITTER_PRIVATE_KEY${NC}"
    echo "   Use the private key generated above"
    echo "   Add to .env: FLARE_SUBMITTER_PRIVATE_KEY=0x..."
    echo ""
fi

# Final setup steps
echo "🎯 Final setup steps:"
echo ""
echo "1. 📝 Edit .env file with your configuration:"
echo "   nano .env  # or use your preferred editor"
echo ""
echo "2. 🚰 Get Flare testnet tokens:"
echo "   - Visit: https://faucet.flare.network/coston2"
echo "   - Enter your FLARE_SUBMITTER_ADDRESS"
echo "   - Request C2FLR tokens"
echo ""
echo "3. 🧪 Test everything:"
echo "   npm run test-flare  # Test Flare wallet"
echo "   npm test           # Test full integration"
echo ""
echo "4. 🚀 Start the connector:"
echo "   npm start"
echo ""

# Create helpful aliases
echo "📋 Creating helpful scripts..."

cat > quick-test.sh << 'EOF'
#!/bin/bash
echo "🧪 Quick Integration Test"
echo "========================"
echo ""

echo "1️⃣  Testing Phala LiteLLM endpoint..."
npm run test-phala
echo ""

echo "2️⃣  Testing Flare wallet..."
npm run test-flare  
echo ""

echo "3️⃣  Testing full connector..."
npm test
echo ""

echo "✅ Test complete! If all tests pass, run: npm start"
EOF

chmod +x quick-test.sh

cat > start-monitoring.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting LiteLLM → Flare Oracle Connector"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Run ./complete-setup.sh first"
    exit 1
fi

# Check if required vars are set
source .env

if [ -z "$LITELLM_API_KEY" ] || [ "$LITELLM_API_KEY" = "your_litellm_api_key_here" ]; then
    echo "❌ LITELLM_API_KEY not configured in .env"
    exit 1
fi

if [ -z "$FLARE_SUBMITTER_ADDRESS" ] || [ "$FLARE_SUBMITTER_ADDRESS" = "your_address_here" ]; then
    echo "❌ FLARE_SUBMITTER_ADDRESS not configured in .env"
    exit 1
fi

echo "✅ Configuration verified"
echo "🔄 Starting connector..."
echo ""

npm start
EOF

chmod +x start-monitoring.sh

echo -e "${GREEN}✅ Created quick-test.sh and start-monitoring.sh${NC}"

# Summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Flare wallet generated${NC}"  
echo -e "${GREEN}✅ Environment configured${NC}"
echo -e "${GREEN}✅ Phala endpoint tested${NC}"
echo -e "${GREEN}✅ Helper scripts created${NC}"
echo ""

echo "🔧 What you need to do now:"
echo ""
echo "1. 📝 Complete your .env configuration:"
echo "   - Add your LiteLLM API key"
echo "   - Verify Flare wallet details"
echo ""
echo "2. 🚰 Get test tokens:"
echo "   - Visit: https://faucet.flare.network/coston2"
echo "   - Request tokens for your Flare address"
echo ""
echo "3. 🧪 Test everything:"
echo "   ./quick-test.sh"
echo ""
echo "4. 🚀 Start monitoring:"
echo "   ./start-monitoring.sh"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - Flare setup: cat FLARE_SETUP_GUIDE.md"
echo "   - Full guide: cat README.md"
echo "   - Integration: cat ../LITELLM_FLARE_INTEGRATION_GUIDE.md"
echo ""

echo "🎯 Your Phala LiteLLM will soon be connected to Flare oracle!"
echo "   Usage data → Flare → Flow blockchain → Dynamic pricing"
echo ""