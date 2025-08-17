import React, { useEffect } from 'react';
import Head from 'next/head';
import CreateSubscriptionForm from '../components/CreateSubscriptionForm';
import '../config/flowConfig'; // Initialize Flow configuration

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>Usage-Based Subscriptions - LiteLLM Billing</title>
                <meta name="description" content="Variable pricing for LiteLLM based on actual usage" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Usage-Based LiteLLM Subscriptions
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Pay only for what you use! Dynamic pricing based on your actual LiteLLM consumption 
                        with automatic volume discounts and model-specific rates.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4">🎯 How It Works</h2>
                        <div className="space-y-3 text-gray-700">
                            <div className="flex items-start">
                                <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm font-medium mr-3 mt-0.5">1</span>
                                <div>
                                    <strong>Connect Wallet</strong>
                                    <p className="text-sm">Connect your Flow wallet and fund your subscription vault</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm font-medium mr-3 mt-0.5">2</span>
                                <div>
                                    <strong>Usage Tracking</strong>
                                    <p className="text-sm">Your LiteLLM API usage is automatically tracked in real-time</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm font-medium mr-3 mt-0.5">3</span>
                                <div>
                                    <strong>Dynamic Pricing</strong>
                                    <p className="text-sm">Pricing updates every 5 minutes based on actual consumption</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm font-medium mr-3 mt-0.5">4</span>
                                <div>
                                    <strong>Automated Billing</strong>
                                    <p className="text-sm">Provider automatically charges exact usage amount</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-4">💰 Pricing Benefits</h2>
                        <div className="space-y-3 text-gray-700">
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <span><strong>Pay per token:</strong> No fixed monthly fees</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <span><strong>Volume discounts:</strong> Up to 30% off for high usage</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <span><strong>Model pricing:</strong> GPT-4 premium, GPT-3.5 standard</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <span><strong>Transparent:</strong> All billing on blockchain</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <span><strong>Real-time:</strong> Updates every 5 minutes</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-green-500 mr-2">✅</span>
                                <span><strong>Secure:</strong> Automated entitlements prevent overcharging</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main subscription form */}
                <CreateSubscriptionForm />

                <div className="mt-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4">🔧 Technical Details</h2>
                    <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
                        <div>
                            <h3 className="font-semibold mb-2">Smart Contract</h3>
                            <p><strong>Address:</strong> 0x7ee75d81c7229a61</p>
                            <p><strong>Network:</strong> Flow Testnet</p>
                            <p><strong>Function:</strong> SimpleUsageSubscriptions.createSubscriptionVault()</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Data Source</h3>
                            <p><strong>LiteLLM API:</strong> https://llm.p10p.io</p>
                            <p><strong>Oracle:</strong> Flare Data Connector</p>
                            <p><strong>Update Frequency:</strong> Every 5 minutes</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>
                        Powered by Flow blockchain • Real-time pricing via Flare Data Connector • 
                        <a href="https://testnet.flowscan.io/account/0x7ee75d81c7229a61" className="text-blue-500 hover:underline ml-1">
                            View Contract
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}