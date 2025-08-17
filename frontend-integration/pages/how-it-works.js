import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function HowItWorks() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>How It Works - FlareFlow.link</title>
                <meta name="description" content="Learn how FlareFlow.link integrates Flare oracle data with Flow blockchain for LiteLLM usage-based billing" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                {/* Header */}
                <div className="bg-gray-900 text-white">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center">
                                ← Back to Dashboard
                            </Link>
                        </div>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold mb-4">
                                🔧 How FlareFlow.link Works
                            </h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                Understanding the architecture behind Flare oracle integration, 
                                Flow blockchain billing, and LiteLLM API management
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    {/* Architecture Overview */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">🏗️ System Architecture</h2>
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className="bg-orange-100 rounded-lg p-6 mb-4">
                                        <h3 className="text-xl font-semibold text-orange-800 mb-2">🔥 Flare Oracle</h3>
                                        <p className="text-orange-700 text-sm">
                                            Verifies LiteLLM usage data every 5 minutes via StateConnector and FDC
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="bg-blue-100 rounded-lg p-6 mb-4">
                                        <h3 className="text-xl font-semibold text-blue-800 mb-2">⚡ Flow Blockchain</h3>
                                        <p className="text-blue-700 text-sm">
                                            Processes payments and manages subscriptions with smart contracts
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="bg-purple-100 rounded-lg p-6 mb-4">
                                        <h3 className="text-xl font-semibold text-purple-800 mb-2">🔑 LiteLLM API</h3>
                                        <p className="text-purple-700 text-sm">
                                            Provides OpenAI-compatible endpoint with usage tracking
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Data Flow */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">🔄 Data Flow Process</h2>
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">API Usage Occurs</h4>
                                        <p className="text-gray-600">User makes API calls to https://llm.p10p.io with their unique LiteLLM key</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Real-time Display</h4>
                                        <p className="text-gray-600">Frontend shows immediate usage updates via WebSocket/polling (pending state)</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">FDC Connector Polls</h4>
                                        <p className="text-gray-600">Flare Data Connector polls LiteLLM every 5 minutes and aggregates usage data</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Oracle Attestation</h4>
                                        <p className="text-gray-600">Flare StateConnector provides cryptographic proof of usage data authenticity</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">5</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Billing Update</h4>
                                        <p className="text-gray-600">Flow smart contracts process verified usage and update billing entitlements</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Public Contracts & Oracles */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">📋 Public Contracts & Oracles</h2>
                        
                        {/* Flow Contracts */}
                        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                            <h3 className="text-2xl font-semibold text-blue-800 mb-4">⚡ Flow Blockchain Contracts</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Main Account</h4>
                                    <a 
                                        href="https://www.flowdiver.io/account/0x6daee039a7b9c2f0" 
                                        className="text-blue-600 hover:text-blue-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        0x6daee039a7b9c2f0 →
                                    </a>
                                    <p className="text-sm text-gray-600">View all deployed contracts on FlowDiver</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Contract Explorer</h4>
                                    <a 
                                        href="https://contractbrowser.com" 
                                        className="text-blue-600 hover:text-blue-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Contract Browser →
                                    </a>
                                    <p className="text-sm text-gray-600">Search and verify Flow contracts</p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Core Smart Contracts</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="font-mono">UsageBasedSubscriptions</span>
                                        <span className="text-gray-600">Dynamic pricing & billing logic</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="font-mono">FlareOracleVerifier</span>
                                        <span className="text-gray-600">Oracle data validation</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="font-mono">SimpleUsageSubscriptions</span>
                                        <span className="text-gray-600">Basic subscription management</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="font-mono">FlareFDCTriggers</span>
                                        <span className="text-gray-600">Flare Data Connector integration</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flare Oracle */}
                        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                            <h3 className="text-2xl font-semibold text-orange-800 mb-4">🔥 Flare Oracle Infrastructure</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Flare Network</h4>
                                    <a 
                                        href="https://flare.network" 
                                        className="text-orange-600 hover:text-orange-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        flare.network →
                                    </a>
                                    <p className="text-sm text-gray-600">Main Flare network documentation</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">StateConnector</h4>
                                    <a 
                                        href="https://docs.flare.network/tech/state-connector/" 
                                        className="text-orange-600 hover:text-orange-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        StateConnector Docs →
                                    </a>
                                    <p className="text-sm text-gray-600">Oracle attestation system</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Coston2 Testnet</h4>
                                    <a 
                                        href="https://coston2-explorer.flare.network" 
                                        className="text-orange-600 hover:text-orange-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Coston2 Explorer →
                                    </a>
                                    <p className="text-sm text-gray-600">Testnet blockchain explorer</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">FDC Documentation</h4>
                                    <a 
                                        href="https://docs.flare.network/dev/flare-data-connector/" 
                                        className="text-orange-600 hover:text-orange-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        FDC Guides →
                                    </a>
                                    <p className="text-sm text-gray-600">Flare Data Connector integration</p>
                                </div>
                            </div>
                        </div>

                        {/* LiteLLM API */}
                        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                            <h3 className="text-2xl font-semibold text-purple-800 mb-4">🔑 LiteLLM API Infrastructure</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">API Endpoint</h4>
                                    <a 
                                        href="https://llm.p10p.io" 
                                        className="text-purple-600 hover:text-purple-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        https://llm.p10p.io →
                                    </a>
                                    <p className="text-sm text-gray-600">OpenAI-compatible API endpoint</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">LiteLLM Documentation</h4>
                                    <a 
                                        href="https://docs.litellm.ai" 
                                        className="text-purple-600 hover:text-purple-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        LiteLLM Docs →
                                    </a>
                                    <p className="text-sm text-gray-600">Usage tracking and key management</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">OpenAI Compatibility</h4>
                                    <a 
                                        href="https://platform.openai.com/docs/api-reference" 
                                        className="text-purple-600 hover:text-purple-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        OpenAI API Reference →
                                    </a>
                                    <p className="text-sm text-gray-600">Standard API format for all models</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">API Usage Example</h4>
                                    <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                                        curl -X POST https://llm.p10p.io/chat/completions<br/>
                                        -H "Authorization: Bearer your-api-key"
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flow Ecosystem */}
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <h3 className="text-2xl font-semibold text-green-800 mb-4">🌊 Flow Ecosystem Resources</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Flow Documentation</h4>
                                    <a 
                                        href="https://docs.onflow.org" 
                                        className="text-green-600 hover:text-green-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        docs.onflow.org →
                                    </a>
                                    <p className="text-sm text-gray-600">Complete Flow blockchain documentation</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Cadence Language</h4>
                                    <a 
                                        href="https://cadence-lang.org" 
                                        className="text-green-600 hover:text-green-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        cadence-lang.org →
                                    </a>
                                    <p className="text-sm text-gray-600">Smart contract programming language</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Flow Client Library</h4>
                                    <a 
                                        href="https://github.com/onflow/fcl-js" 
                                        className="text-green-600 hover:text-green-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        FCL on GitHub →
                                    </a>
                                    <p className="text-sm text-gray-600">JavaScript SDK for Flow integration</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Flow Port Wallet</h4>
                                    <a 
                                        href="https://port.onflow.org" 
                                        className="text-green-600 hover:text-green-800 block mb-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        port.onflow.org →
                                    </a>
                                    <p className="text-sm text-gray-600">Official Flow wallet for transactions</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Integration Guide */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">🔧 Integration Guide</h2>
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">For Developers</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-500">✓</span>
                                            <span>Connect Flow wallet using FCL</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-500">✓</span>
                                            <span>Create subscriptions with FLOW deposits</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-500">✓</span>
                                            <span>Get unique LiteLLM API keys automatically</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-500">✓</span>
                                            <span>Monitor real-time usage via WebSocket</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-500">✓</span>
                                            <span>Verify billing through Flare oracle</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">For Users</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-500">→</span>
                                            <span>Install Flow Port wallet</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-500">→</span>
                                            <span>Fund wallet with FLOW tokens</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-500">→</span>
                                            <span>Connect wallet to FlareFlow.link</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-500">→</span>
                                            <span>Create subscription with deposit</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-500">→</span>
                                            <span>Use API key with any OpenAI-compatible app</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Back to Dashboard */}
                    <div className="text-center">
                        <Link 
                            href="/" 
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}