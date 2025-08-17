import React, { useEffect } from 'react';
import Head from 'next/head';
import SubscriptionManager from '../components/SubscriptionManager';
import '../config/flowConfig'; // Initialize Flow configuration

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>FlareFlow.link - LiteLLM API Key Management & Usage-Based Billing</title>
                <meta name="description" content="FlareFlow.link: Create individual LiteLLM subscriptions with unique API keys, real-time usage tracking, and Flow blockchain billing" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                {/* Header */}
                <div className="bg-gray-900 text-white">
                    <div className="container mx-auto px-4 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold mb-4">
                                🔗 FlareFlow.link
                            </h1>
                            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-6">
                                The premier platform for LiteLLM API key management with Flare oracle integration, 
                                Flow blockchain billing, and real-time usage analytics.
                            </p>
                            <div className="flex justify-center space-x-6 text-sm mb-6">
                                <span className="bg-orange-600 px-3 py-1 rounded">🔥 Flare Oracle</span>
                                <span className="bg-blue-600 px-3 py-1 rounded">⚡ Flow Blockchain</span>
                                <span className="bg-purple-600 px-3 py-1 rounded">🔑 LiteLLM Keys</span>
                            </div>
                            <div className="flex justify-center">
                                <a 
                                    href="/how-it-works" 
                                    className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                >
                                    🔧 How It Works & Public Contracts →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Manager */}
                <div className="container mx-auto px-4">
                    <SubscriptionManager />
                </div>

                {/* Footer */}
                <div className="bg-gray-900 text-white mt-16">
                    <div className="container mx-auto px-4 py-12">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-4">🌟 The Future of AI API Management</h2>
                            <p className="text-gray-300 max-w-3xl mx-auto">
                                FlareFlow.link bridges Flare oracle data with Flow blockchain payments, 
                                creating the most advanced LiteLLM subscription platform available.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-3">🔥 Flare Oracle Integration</h3>
                                <p className="text-gray-300 text-sm">
                                    Real-time usage data verification and cross-chain oracle feeds
                                </p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-3">⚡ Flow Blockchain Payments</h3>
                                <p className="text-gray-300 text-sm">
                                    Transparent, immutable billing with usage-based smart contracts
                                </p>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-3">🔗 Seamless Integration</h3>
                                <p className="text-gray-300 text-sm">
                                    One-click LiteLLM subscriptions with automatic key management
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
                                <p>FlareFlow.link | Flare Oracle ⚡ Flow Blockchain | © 2025</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}