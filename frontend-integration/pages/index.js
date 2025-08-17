import React, { useEffect } from 'react';
import Head from 'next/head';
import SubscriptionDashboard from '../components/SubscriptionDashboard';
import '../config/flowConfig'; // Initialize Flow configuration

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>Flow Actions + Flare Oracle - Usage-Based Subscriptions</title>
                <meta name="description" content="Dynamic pricing with Flare oracle data feeds on Flow Mainnet" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                {/* Header */}
                <div className="bg-gray-900 text-white">
                    <div className="container mx-auto px-4 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold mb-4">
                                🚀 Flow Actions + Flare Oracle
                            </h1>
                            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-6">
                                Revolutionary usage-based subscriptions powered by Flare oracle data feeds, 
                                deployed on Flow Mainnet with real-time transaction insights.
                            </p>
                            <div className="flex justify-center space-x-6 text-sm">
                                <span className="bg-blue-600 px-3 py-1 rounded">Contract: 0x6daee039a7b9c2f0</span>
                                <span className="bg-green-600 px-3 py-1 rounded">Network: Flow Mainnet</span>
                                <span className="bg-purple-600 px-3 py-1 rounded">Oracle: Flare FDC</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard */}
                <div className="container mx-auto px-4">
                    <SubscriptionDashboard />
                </div>

                {/* Footer */}
                <div className="bg-gray-900 text-white mt-16">
                    <div className="container mx-auto px-4 py-12">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-4">🌟 Next-Generation DeFi Infrastructure</h2>
                            <p className="text-gray-300 max-w-3xl mx-auto">
                                Experience the future of usage-based billing with Flow Actions framework, 
                                Flare oracle integration, and real-time transaction insights.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-3">📡 Flare Oracle</h3>
                                <p className="text-gray-300 text-sm">
                                    Real-time data feeds from external services with cryptographic verification
                                </p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-3">⚡ Flow Actions</h3>
                                <p className="text-gray-300 text-sm">
                                    Composable DeFi operations with standardized connector patterns
                                </p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-3">🔗 LayerZero</h3>
                                <p className="text-gray-300 text-sm">
                                    Cross-chain messaging for seamless multi-chain DeFi operations
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-8">
                            <div className="flex justify-center space-x-8 text-sm">
                                <a 
                                    href="https://www.flowdiver.io/account/0x6daee039a7b9c2f0" 
                                    className="text-blue-400 hover:text-blue-300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Contracts on FlowDiver →
                                </a>
                                <a 
                                    href="https://docs.onflow.org" 
                                    className="text-blue-400 hover:text-blue-300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Flow Documentation →
                                </a>
                                <a 
                                    href="https://flare.network" 
                                    className="text-blue-400 hover:text-blue-300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Flare Network →
                                </a>
                            </div>
                            <div className="text-center mt-6 text-gray-400 text-sm">
                                <p>Deployed on Flow Mainnet | Flare Testnet (Coston2) | © 2025 Flow Actions Scaffold</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}