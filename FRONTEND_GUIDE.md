# 🎨 Frontend Development Guide
**Building Applications Around Flare FDC + LayerZero Integration**

This guide walks you through creating frontend applications that interact with our cross-chain automation system, covering APIs, SDKs, and implementation patterns.

## 🚀 **Demo Execution Guide**

### **Prerequisites**
```bash
# Required tools
- Flow CLI (included in project)
- Node.js 18+ (for frontend development)
- Git
- Code editor (VS Code recommended)
```

### **Step 1: Environment Setup**
```bash
# Clone and setup
git clone <your-repo>
cd flow-actions-scaffold

# Start Flow emulator with full DeFi environment
make start

# Verify emulator is running
curl http://localhost:8888/v1/blocks/latest
```

### **Step 2: Deploy Integration Contracts**
```bash
# Deploy all contracts including FDC and LayerZero
./flow-cli.exe project deploy --network emulator --update

# Setup FDC handler
./flow-cli.exe transactions send setup_integration_simple.cdc \
  --network emulator --signer emulator-account

# Verify deployment
./flow-cli.exe scripts execute cadence/scripts/cross-chain/check_fdc_integration.cdc \
  --network emulator
```

### **Step 3: Run Demo Scenarios**
```bash
# Test FDC trigger processing
./flow-cli.exe scripts execute test_fdc_simple.cdc --network emulator

# Test LayerZero messaging
./flow-cli.exe scripts execute test_layerzero_simple.cdc --network emulator

# Execute end-to-end cross-chain automation
./flow-cli.exe transactions send test_e2e_fixed.cdc \
  --network emulator --signer emulator-account
```

## 🛠 **Frontend Development Stack**

### **Core SDKs & APIs**

#### **1. Flow SDK (Primary Interface)**
```bash
npm install @onflow/fcl @onflow/types @onflow/config
```

**Key Features:**
- **Transaction submission** to Flow blockchain
- **Script execution** for queries
- **Event listening** for real-time updates
- **Account management** and authentication

#### **2. Flare Network APIs**
```bash
npm install axios ethers
```

**Integration Points:**
- **FDC Data API**: `https://api.flare.network/fdc/`
- **Price Feeds**: Real-time asset pricing
- **Attestation API**: Data verification
- **Event Streams**: WebSocket for live data

#### **3. LayerZero SDK**
```bash
npm install @layerzerolabs/sdk
```

**Capabilities:**
- **Cross-chain messaging** status
- **Gas estimation** for target chains
- **Message tracking** across networks
- **Fee calculation** per chain

#### **4. Multi-Chain Web3 Integration**
```bash
npm install wagmi viem @rainbow-me/rainbowkit
```

**For connecting to target chains:**
- **Ethereum**: Primary DeFi operations
- **Arbitrum**: Low-cost executions
- **Polygon**: Fast transactions
- **Optimism**: Layer 2 scaling

## 📱 **Frontend Architecture**

### **React Application Structure**
```
src/
├── components/
│   ├── TriggerMonitor/       # FDC trigger dashboard
│   ├── CrossChainStatus/     # LayerZero message tracking
│   ├── PortfolioView/        # User portfolio across chains
│   └── ActionBuilder/        # Create custom automations
├── hooks/
│   ├── useFlowConnection/    # Flow blockchain integration
│   ├── useFDCData/          # Flare data feeds
│   ├── useLayerZero/        # Cross-chain messaging
│   └── usePortfolio/        # Multi-chain portfolio
├── services/
│   ├── flowAPI.js           # Flow blockchain API
│   ├── flareAPI.js          # Flare network integration
│   ├── layerZeroAPI.js      # LayerZero messaging
│   └── multiChainAPI.js     # Target chain interactions
└── utils/
    ├── cadenceScripts.js    # Pre-built Cadence queries
    ├── triggerTypes.js      # FDC trigger definitions
    └── chainConfig.js       # Multi-chain configuration
```

## 🔧 **Implementation Examples**

### **1. Flow Blockchain Integration**

#### **Setup FCL Configuration**
```javascript
// src/config/flow.js
import * as fcl from "@onflow/fcl"

fcl.config({
  "accessNode.api": "http://localhost:8888", // Emulator
  // "accessNode.api": "https://access.mainnet.nodes.onflow.org", // Mainnet
  "discovery.wallet": "http://localhost:8701/fcl/authn", // Dev wallet
  "app.detail.title": "Cross-Chain Automation",
  "app.detail.icon": "https://your-app.com/icon.png"
})

export { fcl }
```

#### **Query Integration Status**
```javascript
// src/services/flowAPI.js
import { fcl } from '../config/flow'

export const checkIntegrationStatus = async () => {
  const script = `
    import "FlareFDCTriggers"
    import "LayerZeroConnectors"
    
    access(all) fun main(): {String: AnyStruct} {
      return {
        "fdc_registry": FlareFDCTriggers.getRegistryRef().owner?.address?.toString() ?? "Not deployed",
        "layerzero_chains": LayerZeroConnectors.ChainIds,
        "status": "Active"
      }
    }
  `
  
  try {
    const result = await fcl.query({ cadence: script })
    return result
  } catch (error) {
    console.error("Integration status check failed:", error)
    throw error
  }
}
```

#### **Submit FDC Trigger**
```javascript
// src/services/flowAPI.js
export const submitFDCTrigger = async (triggerData) => {
  const transaction = `
    import "FlareFDCTriggers"
    
    transaction(
      triggerType: UInt8,
      sourceChain: String,
      targetChain: UInt8,
      payload: {String: String}
    ) {
      execute {
        let trigger = FlareFDCTriggers.FDCTrigger(
          id: "frontend-trigger-".concat(getCurrentBlock().timestamp.toString()),
          triggerType: FlareFDCTriggers.TriggerType(rawValue: triggerType)!,
          sourceChain: sourceChain,
          targetChain: FlareFDCTriggers.TargetChain(rawValue: targetChain)!,
          payload: payload,
          timestamp: getCurrentBlock().timestamp,
          signature: "frontend-signature"
        )
        
        let result = FlareFDCTriggers.submitFDCTrigger(trigger: trigger)
        log("Trigger submitted: ".concat(result ? "success" : "failed"))
      }
    }
  `
  
  const transactionId = await fcl.mutate({
    cadence: transaction,
    args: (arg, t) => [
      arg(triggerData.triggerType, t.UInt8),
      arg(triggerData.sourceChain, t.String),
      arg(triggerData.targetChain, t.UInt8),
      arg(triggerData.payload, t.Dictionary({ key: t.String, value: t.String }))
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000
  })
  
  return fcl.tx(transactionId).onceSealed()
}
```

### **2. React Hooks for Integration**

#### **Flow Connection Hook**
```javascript
// src/hooks/useFlowConnection.js
import { useState, useEffect } from 'react'
import { fcl } from '../config/flow'

export const useFlowConnection = () => {
  const [user, setUser] = useState({ loggedIn: null })
  const [integrationStatus, setIntegrationStatus] = useState(null)

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  const authenticate = () => fcl.authenticate()
  const unauthenticate = () => fcl.unauthenticate()

  const checkStatus = async () => {
    try {
      const status = await checkIntegrationStatus()
      setIntegrationStatus(status)
      return status
    } catch (error) {
      console.error('Status check failed:', error)
      return null
    }
  }

  return {
    user,
    integrationStatus,
    authenticate,
    unauthenticate,
    checkStatus
  }
}
```

#### **FDC Data Hook**
```javascript
// src/hooks/useFDCData.js
import { useState, useEffect } from 'react'
import { flareAPI } from '../services/flareAPI'

export const useFDCData = (dataType = 'price', symbols = ['ETH/USD']) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await flareAPI.getFDCData(dataType, symbols)
        setData(result)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('FDC data fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Setup WebSocket for real-time updates
    const ws = flareAPI.subscribeToFDC(dataType, symbols, (newData) => {
      setData(newData)
    })

    return () => {
      if (ws) ws.close()
    }
  }, [dataType, symbols])

  return { data, loading, error }
}
```

### **3. Flare Network Integration**

#### **FDC Data Service**
```javascript
// src/services/flareAPI.js
export const flareAPI = {
  // Get current FDC data
  getFDCData: async (dataType, symbols) => {
    const response = await fetch(`https://api.flare.network/fdc/${dataType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols })
    })
    return response.json()
  },

  // Subscribe to real-time FDC updates
  subscribeToFDC: (dataType, symbols, callback) => {
    const ws = new WebSocket(`wss://ws.flare.network/fdc/${dataType}`)
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ subscribe: symbols }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      callback(data)
    }
    
    return ws
  },

  // Verify FDC attestation
  verifyAttestation: async (attestationData) => {
    const response = await fetch('https://api.flare.network/fdc/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attestationData)
    })
    return response.json()
  }
}
```

### **4. LayerZero Integration**

#### **Cross-Chain Messaging Service**
```javascript
// src/services/layerZeroAPI.js
import { LayerZero } from '@layerzerolabs/sdk'

export const layerZeroAPI = {
  // Initialize LayerZero SDK
  init: () => {
    return new LayerZero({
      version: 2,
      networks: {
        ethereum: { chainId: 1, endpoint: 'https://mainnet.infura.io/v3/YOUR_KEY' },
        arbitrum: { chainId: 42161, endpoint: 'https://arb1.arbitrum.io/rpc' },
        polygon: { chainId: 137, endpoint: 'https://polygon-rpc.com' }
      }
    })
  },

  // Send cross-chain message
  sendMessage: async (fromChain, toChain, payload) => {
    const lz = layerZeroAPI.init()
    
    const message = {
      dstChainId: getLayerZeroChainId(toChain),
      payload: encodeFunctionData({
        abi: crossChainABI,
        functionName: 'executeAction',
        args: [payload]
      })
    }
    
    return lz.send(message)
  },

  // Track message status
  trackMessage: async (messageId) => {
    const lz = layerZeroAPI.init()
    return lz.getMessageStatus(messageId)
  },

  // Estimate fees
  estimateFees: async (fromChain, toChain, payload) => {
    const lz = layerZeroAPI.init()
    return lz.estimateFees(fromChain, toChain, payload)
  }
}

const getLayerZeroChainId = (chainName) => {
  const mapping = {
    'ethereum': 101,
    'arbitrum': 110,
    'polygon': 109,
    'optimism': 111,
    'bsc': 102,
    'avalanche': 106
  }
  return mapping[chainName.toLowerCase()]
}
```

## 🎨 **UI Components**

### **1. Trigger Monitor Dashboard**
```jsx
// src/components/TriggerMonitor/TriggerMonitor.jsx
import React from 'react'
import { useFDCData } from '../../hooks/useFDCData'

export const TriggerMonitor = () => {
  const { data: priceData } = useFDCData('price', ['ETH/USD', 'BTC/USD'])
  const { data: volumeData } = useFDCData('volume', ['ETH'])

  return (
    <div className="trigger-monitor">
      <h2>🔍 Live FDC Triggers</h2>
      
      <div className="trigger-grid">
        <TriggerCard
          type="Price Threshold"
          current={priceData?.['ETH/USD']?.price}
          threshold={3000}
          status={priceData?.['ETH/USD']?.price > 3000 ? 'TRIGGERED' : 'MONITORING'}
        />
        
        <TriggerCard
          type="Volume Spike"
          current={volumeData?.ETH?.volume24h}
          threshold="500% increase"
          status="MONITORING"
        />
      </div>
    </div>
  )
}

const TriggerCard = ({ type, current, threshold, status }) => (
  <div className={`trigger-card ${status.toLowerCase()}`}>
    <h3>{type}</h3>
    <div className="metrics">
      <span>Current: {current}</span>
      <span>Threshold: {threshold}</span>
    </div>
    <div className={`status ${status.toLowerCase()}`}>
      {status}
    </div>
  </div>
)
```

### **2. Cross-Chain Status Tracker**
```jsx
// src/components/CrossChainStatus/CrossChainStatus.jsx
import React, { useState, useEffect } from 'react'
import { layerZeroAPI } from '../../services/layerZeroAPI'

export const CrossChainStatus = () => {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // Listen for Flow events and track LayerZero messages
    const eventSubscription = fcl.events('A.f8d6e0586b0a20c7.LayerZeroConnectors.CrossChainMessageSent')
      .subscribe((events) => {
        events.forEach(async (event) => {
          const messageId = event.data.messageId
          const status = await layerZeroAPI.trackMessage(messageId)
          
          setMessages(prev => [...prev, {
            id: messageId,
            targetChain: event.data.targetChain,
            status: status,
            timestamp: new Date()
          }])
        })
      })

    return () => eventSubscription.unsubscribe()
  }, [])

  return (
    <div className="cross-chain-status">
      <h2>🌐 Cross-Chain Operations</h2>
      
      <div className="message-list">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}

const MessageItem = ({ message }) => (
  <div className="message-item">
    <div className="message-id">{message.id.slice(0, 8)}...</div>
    <div className="target-chain">{getChainName(message.targetChain)}</div>
    <div className={`status ${message.status.toLowerCase()}`}>
      {message.status}
    </div>
    <div className="timestamp">
      {message.timestamp.toLocaleTimeString()}
    </div>
  </div>
)
```

### **3. Action Builder Interface**
```jsx
// src/components/ActionBuilder/ActionBuilder.jsx
import React, { useState } from 'react'
import { submitFDCTrigger } from '../../services/flowAPI'

export const ActionBuilder = () => {
  const [trigger, setTrigger] = useState({
    triggerType: 0, // Price Threshold
    sourceChain: 'ethereum',
    targetChain: 0, // Ethereum
    payload: {}
  })

  const triggerTypes = [
    { value: 0, label: 'Price Threshold', icon: '💰' },
    { value: 1, label: 'Volume Spike', icon: '📈' },
    { value: 2, label: 'Liquidity Change', icon: '🏊' },
    { value: 3, label: 'Governance Vote', icon: '🗳️' },
    { value: 4, label: 'Bridge Event', icon: '🌉' },
    { value: 5, label: 'Protocol Event', icon: '⚙️' }
  ]

  const chains = [
    { value: 0, label: 'Ethereum', icon: '⟠' },
    { value: 1, label: 'BSC', icon: '🟡' },
    { value: 2, label: 'Polygon', icon: '🟣' },
    { value: 3, label: 'Arbitrum', icon: '🔵' },
    { value: 4, label: 'Optimism', icon: '🔴' },
    { value: 5, label: 'Avalanche', icon: '⚪' }
  ]

  const handleSubmit = async () => {
    try {
      const result = await submitFDCTrigger(trigger)
      console.log('Trigger submitted:', result)
      // Show success notification
    } catch (error) {
      console.error('Trigger submission failed:', error)
      // Show error notification
    }
  }

  return (
    <div className="action-builder">
      <h2>🛠️ Build Custom Automation</h2>
      
      <div className="builder-form">
        <div className="form-section">
          <label>Trigger Type</label>
          <select 
            value={trigger.triggerType}
            onChange={(e) => setTrigger(prev => ({
              ...prev, 
              triggerType: parseInt(e.target.value)
            }))}
          >
            {triggerTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label>Target Chain</label>
          <select 
            value={trigger.targetChain}
            onChange={(e) => setTrigger(prev => ({
              ...prev, 
              targetChain: parseInt(e.target.value)
            }))}
          >
            {chains.map(chain => (
              <option key={chain.value} value={chain.value}>
                {chain.icon} {chain.label}
              </option>
            ))}
          </select>
        </div>

        <TriggerConfigForm 
          triggerType={trigger.triggerType}
          payload={trigger.payload}
          onChange={(payload) => setTrigger(prev => ({ ...prev, payload }))}
        />

        <button onClick={handleSubmit} className="submit-btn">
          🚀 Deploy Automation
        </button>
      </div>
    </div>
  )
}
```

## 📊 **Dashboard Example**

### **Main Application Component**
```jsx
// src/App.jsx
import React from 'react'
import { useFlowConnection } from './hooks/useFlowConnection'
import { TriggerMonitor } from './components/TriggerMonitor'
import { CrossChainStatus } from './components/CrossChainStatus'
import { ActionBuilder } from './components/ActionBuilder'
import { PortfolioView } from './components/PortfolioView'

function App() {
  const { user, integrationStatus, authenticate, checkStatus } = useFlowConnection()

  if (!user.loggedIn) {
    return (
      <div className="login-screen">
        <h1>🌐 Cross-Chain Automation Platform</h1>
        <p>Connect your wallet to start automating DeFi operations</p>
        <button onClick={authenticate}>Connect Wallet</button>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Cross-Chain Automation Dashboard</h1>
        <div className="user-info">
          Connected: {user.addr}
          <button onClick={() => fcl.unauthenticate()}>Disconnect</button>
        </div>
      </header>

      <div className="dashboard-grid">
        <TriggerMonitor />
        <CrossChainStatus />
        <PortfolioView />
        <ActionBuilder />
      </div>

      <footer>
        <div className="integration-status">
          Status: {integrationStatus?.status || 'Checking...'}
          <button onClick={checkStatus}>Refresh</button>
        </div>
      </footer>
    </div>
  )
}

export default App
```

## 🚀 **Deployment & Production**

### **Environment Configuration**
```javascript
// src/config/environment.js
export const config = {
  development: {
    flowAPI: 'http://localhost:8888',
    flareAPI: 'https://api.flare.network',
    layerZeroAPI: 'https://api.layerzero.network',
    contracts: {
      FlareFDCTriggers: '0xf8d6e0586b0a20c7',
      LayerZeroConnectors: '0xf8d6e0586b0a20c7'
    }
  },
  production: {
    flowAPI: 'https://access.mainnet.nodes.onflow.org',
    flareAPI: 'https://api.flare.network',
    layerZeroAPI: 'https://api.layerzero.network',
    contracts: {
      FlareFDCTriggers: 'YOUR_MAINNET_ADDRESS',
      LayerZeroConnectors: 'YOUR_MAINNET_ADDRESS'
    }
  }
}
```

### **Build & Deploy**
```bash
# Development
npm run dev

# Production build
npm run build

# Deploy to hosting platform
npm run deploy
```

## 📚 **Additional Resources**

- **Flow FCL Documentation**: https://developers.flow.com/tools/fcl-js
- **Flare Network API Docs**: https://dev.flare.network/apis/
- **LayerZero SDK**: https://layerzero.gitbook.io/docs/
- **Wagmi Documentation**: https://wagmi.sh/
- **Flow DevNet**: https://flowdiver.io/

This guide provides everything needed to build production-ready frontend applications that leverage our cross-chain automation infrastructure!