import React, { useState, useEffect } from 'react';
import litellmKeyService from '../services/litellmKeyService';

const SubscriptionTile = ({ subscription, onUpdate, onDelete }) => {
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        if (subscription.litellmKey) {
            fetchUsageData();
        }
    }, [subscription.litellmKey]);

    const fetchUsageData = async () => {
        if (!subscription.litellmKey) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const usage = await litellmKeyService.getKeyUsage(subscription.litellmKey);
            setUsageData(usage);
        } catch (err) {
            setError(`Failed to fetch usage: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount || 0).toFixed(6)}`;
    };

    const formatNumber = (num) => {
        return num?.toLocaleString() || '0';
    };

    const getTierColor = (spend) => {
        const amount = parseFloat(spend || 0);
        if (amount > 50) return '#DC2626'; // Red - High usage
        if (amount > 20) return '#F59E0B'; // Orange - Medium usage  
        if (amount > 5) return '#10B981';  // Green - Active usage
        return '#6B7280'; // Gray - Low usage
    };

    const getTierLabel = (spend) => {
        const amount = parseFloat(spend || 0);
        if (amount > 50) return 'Heavy User';
        if (amount > 20) return 'Active User';
        if (amount > 5) return 'Regular User';
        return 'Light User';
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    return (
        <div className="subscription-tile">
            <div className="tile-header">
                <div className="subscription-info">
                    <h3 className="vault-title">Vault #{subscription.vaultId}</h3>
                    <div className="subscription-meta">
                        <span className="provider">Provider: {subscription.provider.slice(0, 8)}...</span>
                        <span 
                            className="tier-badge"
                            style={{ backgroundColor: getTierColor(usageData?.usage_summary?.total_cost) }}
                        >
                            {getTierLabel(usageData?.usage_summary?.total_cost)}
                        </span>
                    </div>
                </div>
                <div className="tile-actions">
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="details-button"
                    >
                        {showDetails ? '▼' : '▶'} Details
                    </button>
                </div>
            </div>

            <div className="usage-summary">
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Loading usage...</span>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                        <button onClick={fetchUsageData} className="retry-button">Retry</button>
                    </div>
                )}

                {usageData && !loading && (
                    <div className="usage-grid">
                        <div className="usage-metric">
                            <div className="metric-label">Total Requests</div>
                            <div className="metric-value">
                                {formatNumber(usageData.usage_summary?.total_requests)}
                            </div>
                        </div>
                        <div className="usage-metric">
                            <div className="metric-label">Total Tokens</div>
                            <div className="metric-value">
                                {formatNumber(usageData.usage_summary?.total_tokens)}
                            </div>
                        </div>
                        <div className="usage-metric">
                            <div className="metric-label">Total Cost</div>
                            <div className="metric-value">
                                {formatCurrency(usageData.usage_summary?.total_cost)}
                            </div>
                        </div>
                        <div className="usage-metric">
                            <div className="metric-label">Vault Balance</div>
                            <div className="metric-value">
                                {parseFloat(subscription.balance || 0).toFixed(4)} FLOW
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showDetails && usageData && (
                <div className="detailed-usage">
                    <div className="api-key-section">
                        <h4>🔑 LiteLLM API Key</h4>
                        <div className="api-key-display">
                            <code className="api-key">
                                {showApiKey ? subscription.litellmKey : subscription.litellmKey?.replace(/sk-(.+)/, 'sk-' + '•'.repeat(20))}
                            </code>
                            <div className="key-actions">
                                <button 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="toggle-key-button"
                                >
                                    {showApiKey ? '👁️‍🗨️ Hide' : '👁️ Show'}
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(subscription.litellmKey)}
                                    className="copy-button"
                                >
                                    📋 Copy
                                </button>
                            </div>
                        </div>
                        <div className="key-info">
                            <span>Budget: ${subscription.maxBudget || 100}/month</span>
                            <span>Spent: {formatCurrency(usageData.usage_summary?.total_cost)}</span>
                        </div>
                    </div>

                    <div className="model-breakdown">
                        <h4>📊 Model Usage Breakdown</h4>
                        <div className="model-grid">
                            {Object.entries(usageData.model_breakdown || {}).map(([model, data]) => (
                                <div key={model} className="model-card">
                                    <div className="model-name">{model}</div>
                                    <div className="model-stats">
                                        <span>{formatNumber(data.requests)} requests</span>
                                        <span>{formatNumber(data.tokens)} tokens</span>
                                        <span>{formatCurrency(data.cost)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="recent-activity">
                        <h4>🕒 Recent Activity</h4>
                        <div className="activity-list">
                            {usageData.recent_requests?.slice(0, 5).map((request, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-main">
                                        <span className="activity-model">{request.model}</span>
                                        <span className="activity-tokens">{formatNumber(request.tokens)} tokens</span>
                                    </div>
                                    <div className="activity-meta">
                                        <span className="activity-time">
                                            {new Date(request.timestamp).toLocaleString()}
                                        </span>
                                        <span className="activity-cost">{formatCurrency(request.cost)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="subscription-actions">
                        <button 
                            onClick={() => onUpdate && onUpdate(subscription)}
                            className="update-button"
                        >
                            ⚙️ Update Settings
                        </button>
                        <button 
                            onClick={fetchUsageData}
                            className="refresh-button"
                        >
                            🔄 Refresh Usage
                        </button>
                        <button 
                            onClick={() => onDelete && onDelete(subscription)}
                            className="delete-button"
                        >
                            🗑️ Delete Subscription
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .subscription-tile {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 16px;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .subscription-tile:hover {
                    border-color: #3B82F6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
                }

                .tile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .subscription-info {
                    flex: 1;
                }

                .vault-title {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #111827;
                }

                .subscription-meta {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .provider {
                    font-size: 14px;
                    color: #6B7280;
                    font-family: 'Monaco', monospace;
                }

                .tier-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .details-button {
                    padding: 8px 12px;
                    background: #F3F4F6;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s ease;
                }

                .details-button:hover {
                    background: #E5E7EB;
                }

                .usage-summary {
                    min-height: 80px;
                }

                .loading-state, .error-state {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 20px;
                    text-align: center;
                    justify-content: center;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #E5E7EB;
                    border-top: 2px solid #3B82F6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .error-state {
                    color: #DC2626;
                    background: #FEF2F2;
                    border-radius: 6px;
                }

                .retry-button {
                    padding: 4px 8px;
                    background: #DC2626;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .usage-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 16px;
                }

                .usage-metric {
                    text-align: center;
                    padding: 12px;
                    background: #F9FAFB;
                    border-radius: 8px;
                    border: 1px solid #E5E7EB;
                }

                .metric-label {
                    font-size: 12px;
                    color: #6B7280;
                    margin-bottom: 4px;
                    font-weight: 500;
                }

                .metric-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #111827;
                }

                .detailed-usage {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #E5E7EB;
                }

                .detailed-usage h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #111827;
                }

                .api-key-section {
                    margin-bottom: 24px;
                }

                .api-key-display {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                }

                .api-key {
                    flex: 1;
                    padding: 8px 12px;
                    background: #1F2937;
                    color: #F9FAFB;
                    border-radius: 6px;
                    font-family: 'Monaco', monospace;
                    font-size: 14px;
                    min-width: 200px;
                }

                .key-actions {
                    display: flex;
                    gap: 8px;
                }

                .toggle-key-button, .copy-button {
                    padding: 6px 12px;
                    border: 1px solid #D1D5DB;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }

                .toggle-key-button:hover, .copy-button:hover {
                    background: #F3F4F6;
                }

                .key-info {
                    display: flex;
                    gap: 16px;
                    font-size: 12px;
                    color: #6B7280;
                }

                .model-breakdown {
                    margin-bottom: 24px;
                }

                .model-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                }

                .model-card {
                    padding: 12px;
                    background: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                }

                .model-name {
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 8px;
                    font-size: 14px;
                }

                .model-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    font-size: 12px;
                    color: #6B7280;
                }

                .recent-activity {
                    margin-bottom: 24px;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .activity-item {
                    padding: 8px 12px;
                    background: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    border-radius: 6px;
                }

                .activity-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }

                .activity-model {
                    font-weight: 600;
                    color: #111827;
                    font-size: 14px;
                }

                .activity-tokens {
                    color: #059669;
                    font-weight: 500;
                    font-size: 14px;
                }

                .activity-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #6B7280;
                }

                .activity-cost {
                    font-weight: 500;
                    color: #DC2626;
                }

                .subscription-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .update-button, .refresh-button, .delete-button {
                    padding: 8px 16px;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .update-button {
                    background: #3B82F6;
                    color: white;
                    border-color: #3B82F6;
                }

                .update-button:hover {
                    background: #2563EB;
                }

                .refresh-button {
                    background: #10B981;
                    color: white;
                    border-color: #10B981;
                }

                .refresh-button:hover {
                    background: #059669;
                }

                .delete-button {
                    background: #DC2626;
                    color: white;
                    border-color: #DC2626;
                }

                .delete-button:hover {
                    background: #B91C1C;
                }

                @media (max-width: 768px) {
                    .tile-header {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .subscription-meta {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }

                    .api-key-display {
                        flex-direction: column;
                    }

                    .api-key {
                        min-width: unset;
                        width: 100%;
                    }

                    .subscription-actions {
                        flex-direction: column;
                    }

                    .update-button, .refresh-button, .delete-button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubscriptionTile;