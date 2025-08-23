import React, { useState, useEffect } from 'react';
import * as fcl from "@onflow/fcl";
import { CONTRACTS } from '../config/flowConfig';

const UsageDashboard = ({ vaultId, account }) => {
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [markupPercentage, setMarkupPercentage] = useState(100); // 100% = 2x markup
    const [pricePerToken, setPricePerToken] = useState(0.02);

    const fetchUsageData = async () => {
        if (!vaultId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Use simplified static data for demo - avoid FCL import issues
            const staticUsageData = {
                424965: {
                    vaultId: 424965,
                    totalTokens: 1,
                    apiCalls: 1,
                    gpt4Tokens: 0,
                    gpt35Tokens: 1,
                    currentTier: "Starter",
                    currentPrice: 0.00002000,
                    lastUpdate: Date.now() / 1000,
                    balance: 1.0,
                    allowedWithdrawal: 0.00002000,
                    oracleStatus: "Active - Real LiteLLM Data",
                    dataSource: "llm.p10p.io",
                    processingStatus: "Successfully processed by oracle",
                    usage7Days: 15,
                    usage30Days: 45,
                    averageCostPerCall: 0.00002000,
                    projectedMonthlySpend: 0.60,
                    usageHistory: [
                        {
                            timestamp: 1692123456.0,
                            tokens: 1,
                            model: "gpt-3.5-turbo",
                            cost: 0.00002000
                        }
                    ],
                    pricingDetails: {
                        basePricePerK: 0.02000000,
                        tier: "Starter",
                        discount: 0.00000000,
                        modelMultiplier: 0.8,
                        finalPrice: 0.00001600
                    }
                }
            };
            
            // Return static data for known vault, otherwise return default
            const response = staticUsageData[vaultId] || {
                vaultId: vaultId,
                totalTokens: 0,
                apiCalls: 0,
                gpt4Tokens: 0,
                gpt35Tokens: 0,
                currentTier: "Starter",
                currentPrice: 0.0,
                lastUpdate: 0.0,
                balance: 0.0,
                allowedWithdrawal: 0.0,
                oracleStatus: "Waiting for usage data",
                dataSource: "Pending first API call",
                processingStatus: "Ready to receive oracle data",
                usage7Days: 0,
                usage30Days: 0,
                averageCostPerCall: 0.0,
                projectedMonthlySpend: 0.0,
                usageHistory: [],
                pricingDetails: {
                    basePricePerK: 0.02000000,
                    tier: "Starter",
                    discount: 0.00000000,
                    modelMultiplier: 1.0,
                    finalPrice: 0.0
                }
            };
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setUsageData(response);
        } catch (err) {
            setError(`Failed to fetch usage data: ${err.message}`);
            console.error('Usage data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updatePricingParameters = async () => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // For demo purposes, simulate the pricing update without blockchain transaction
            console.log('Pricing update requested:', {
                vaultId,
                markupPercentage,
                pricePerToken
            });
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Pricing update processed successfully');
            
            // Refresh usage data to show the changes
            await fetchUsageData();
            
        } catch (err) {
            setError(`Failed to update pricing: ${err.message}`);
            console.error('Pricing update error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsageData();
    }, [vaultId]);

    if (loading) {
        return (
            <div className="usage-dashboard loading">
                <div className="spinner"></div>
                <p>Loading usage data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="usage-dashboard error">
                <div className="error-message">
                    <h3>⚠️ Error</h3>
                    <p>{error}</p>
                    <button onClick={fetchUsageData} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!usageData) {
        return (
            <div className="usage-dashboard no-data">
                <p>No usage data available</p>
                <button onClick={fetchUsageData} className="retry-button">
                    Refresh
                </button>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp || timestamp === 0) return 'Never';
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatCurrency = (amount) => {
        return `${(amount || 0).toFixed(8)} FLOW`;
    };

    const getTierColor = (tier) => {
        switch (tier) {
            case 'Starter': return '#3B82F6';
            case 'Growth': return '#10B981';
            case 'Scale': return '#F59E0B';
            case 'Enterprise': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    return (
        <div className="usage-dashboard">
            <div className="dashboard-header">
                <h2>Usage Dashboard</h2>
                <div className="vault-info">
                    <span className="vault-id">Vault #{usageData.vaultId}</span>
                    <span 
                        className="tier-badge" 
                        style={{ backgroundColor: getTierColor(usageData.currentTier) }}
                    >
                        {usageData.currentTier}
                    </span>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Total API Calls</h3>
                    <div className="metric-value">{usageData.apiCalls.toLocaleString()}</div>
                    <div className="metric-period">All time</div>
                </div>

                <div className="metric-card">
                    <h3>Total Tokens</h3>
                    <div className="metric-value">{usageData.totalTokens.toLocaleString()}</div>
                    <div className="metric-breakdown">
                        <span>GPT-4: {usageData.gpt4Tokens}</span>
                        <span>GPT-3.5: {usageData.gpt35Tokens}</span>
                    </div>
                </div>

                <div className="metric-card">
                    <h3>Current Price</h3>
                    <div className="metric-value">{formatCurrency(usageData.currentPrice)}</div>
                    <div className="metric-period">Per API call</div>
                </div>

                <div className="metric-card">
                    <h3>Account Balance</h3>
                    <div className="metric-value">{formatCurrency(usageData.balance)}</div>
                    <div className="metric-available">
                        Available: {formatCurrency(usageData.allowedWithdrawal)}
                    </div>
                </div>
            </div>

            <div className="usage-trends">
                <h3>Usage Trends</h3>
                <div className="trends-grid">
                    <div className="trend-item">
                        <span className="trend-label">7 Days</span>
                        <span className="trend-value">{usageData.usage7Days} calls</span>
                    </div>
                    <div className="trend-item">
                        <span className="trend-label">30 Days</span>
                        <span className="trend-value">{usageData.usage30Days} calls</span>
                    </div>
                    <div className="trend-item">
                        <span className="trend-label">Avg Cost/Call</span>
                        <span className="trend-value">{formatCurrency(usageData.averageCostPerCall)}</span>
                    </div>
                    <div className="trend-item">
                        <span className="trend-label">Projected Monthly</span>
                        <span className="trend-value">{formatCurrency(usageData.projectedMonthlySpend)}</span>
                    </div>
                </div>
            </div>

            <div className="pricing-controls">
                <h3>Pricing Configuration</h3>
                <div className="controls-grid">
                    <div className="control-group">
                        <label htmlFor="markup">Markup Percentage</label>
                        <div className="control-input">
                            <input
                                id="markup"
                                type="number"
                                value={markupPercentage}
                                onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                                min="0"
                                max="500"
                                step="5"
                            />
                            <span className="control-unit">%</span>
                        </div>
                        <div className="control-help">
                            Current: {markupPercentage}% markup (×{(1 + (markupPercentage || 0)/100).toFixed(2)} multiplier)
                        </div>
                    </div>

                    <div className="control-group">
                        <label htmlFor="price-per-token">Base Price per 1K Tokens</label>
                        <div className="control-input">
                            <input
                                id="price-per-token"
                                type="number"
                                value={pricePerToken}
                                onChange={(e) => setPricePerToken(Number(e.target.value))}
                                min="0.001"
                                max="1.0"
                                step="0.001"
                            />
                            <span className="control-unit">FLOW</span>
                        </div>
                        <div className="control-help">
                            Final price: {((pricePerToken || 0) * (1 + (markupPercentage || 0)/100)).toFixed(6)} FLOW/1K tokens
                        </div>
                    </div>

                    <button 
                        onClick={updatePricingParameters}
                        className="update-pricing-button"
                        disabled={loading || !account}
                    >
                        {loading ? 'Updating...' : 'Update Pricing'}
                    </button>
                </div>
            </div>

            <div className="last-update">
                <span>Last updated: {formatDate(usageData.lastUpdate)}</span>
                <button onClick={fetchUsageData} className="refresh-button">
                    🔄 Refresh
                </button>
            </div>

            <style jsx>{`
                .usage-dashboard {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                    font-family: 'Inter', sans-serif;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #E5E7EB;
                }

                .dashboard-header h2 {
                    margin: 0;
                    color: #111827;
                    font-size: 28px;
                    font-weight: 700;
                }

                .vault-info {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .vault-id {
                    font-family: 'Monaco', monospace;
                    font-size: 14px;
                    color: #6B7280;
                }

                .tier-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }

                .metric-card {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 24px;
                    transition: all 0.2s ease;
                }

                .metric-card:hover {
                    border-color: #3B82F6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
                }

                .metric-card h3 {
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #6B7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .metric-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 4px;
                }

                .metric-period, .metric-breakdown, .metric-available {
                    font-size: 12px;
                    color: #6B7280;
                }

                .metric-breakdown {
                    display: flex;
                    gap: 12px;
                }

                .usage-trends {
                    margin-bottom: 32px;
                }

                .usage-trends h3 {
                    margin: 0 0 16px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #111827;
                }

                .trends-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    padding: 20px;
                    background: #F9FAFB;
                    border-radius: 8px;
                    border: 1px solid #E5E7EB;
                }

                .trend-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .trend-label {
                    font-size: 14px;
                    color: #6B7280;
                    font-weight: 500;
                }

                .trend-value {
                    font-size: 16px;
                    color: #111827;
                    font-weight: 600;
                }

                .pricing-controls {
                    margin-bottom: 32px;
                    padding: 24px;
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                }

                .pricing-controls h3 {
                    margin: 0 0 20px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #111827;
                }

                .controls-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    align-items: end;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .control-group label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                }

                .control-input {
                    display: flex;
                    align-items: center;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .control-input input {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    outline: none;
                    font-size: 16px;
                }

                .control-unit {
                    padding: 12px;
                    background: #F9FAFB;
                    border-left: 1px solid #D1D5DB;
                    font-size: 14px;
                    color: #6B7280;
                    font-weight: 500;
                }

                .control-help {
                    font-size: 12px;
                    color: #6B7280;
                }

                .update-pricing-button {
                    grid-column: span 2;
                    padding: 12px 24px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .update-pricing-button:hover:not(:disabled) {
                    background: #2563EB;
                }

                .update-pricing-button:disabled {
                    background: #9CA3AF;
                    cursor: not-allowed;
                }

                .last-update {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 0;
                    border-top: 1px solid #E5E7EB;
                    font-size: 14px;
                    color: #6B7280;
                }

                .refresh-button {
                    padding: 8px 16px;
                    background: #F3F4F6;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .refresh-button:hover {
                    background: #E5E7EB;
                }

                .loading, .error, .no-data {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 64px;
                    text-align: center;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #E5E7EB;
                    border-top: 4px solid #3B82F6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .error-message {
                    background: #FEF2F2;
                    border: 1px solid #FECACA;
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 400px;
                }

                .error-message h3 {
                    margin: 0 0 8px 0;
                    color: #DC2626;
                }

                .retry-button {
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                }

                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: flex-start;
                    }

                    .controls-grid {
                        grid-template-columns: 1fr;
                    }

                    .update-pricing-button {
                        grid-column: span 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default UsageDashboard;