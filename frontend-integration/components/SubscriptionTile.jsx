import React, { useState, useEffect } from 'react';
import litellmKeyService from '../services/litellmKeyService';

const SubscriptionTile = ({ subscription, onUpdate, onDelete, onTopUp }) => {
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showBridge, setShowBridge] = useState(false);

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
                        <h4>🔑 Your LiteLLM API Key</h4>
                        <div className="api-key-display">
                            <code className="api-key">
                                {showApiKey ? subscription.litellmKey : subscription.litellmKey?.replace(/sk-(.+)/, 'sk-' + '•'.repeat(20))}
                            </code>
                            <div className="key-actions">
                                <button 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="toggle-key-button"
                                >
                                    {showApiKey ? '👁️‍🗨️ Hide' : '👁️ Show Key'}
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(subscription.litellmKey)}
                                    className="copy-button"
                                >
                                    📋 Copy Key
                                </button>
                            </div>
                        </div>
                        <div className="key-info">
                            <span>Budget: ${subscription.maxBudget || 100}/month</span>
                            <span>Spent: {formatCurrency(usageData.usage_summary?.total_cost)}</span>
                            <span>Status: 🟢 Active</span>
                        </div>
                        
                        <div className="usage-instructions">
                            <h5>🚀 How to Use Your API Key</h5>
                            <div className="endpoint-info">
                                <div className="endpoint-label">OpenAI-Compatible Endpoint:</div>
                                <div className="endpoint-url">
                                    <code>https://llm.p10p.io</code>
                                    <button 
                                        onClick={() => copyToClipboard('https://llm.p10p.io')}
                                        className="copy-endpoint-button"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                            
                            <div className="code-examples">
                                <div className="example-section">
                                    <div className="example-title">🐍 Python (OpenAI Client)</div>
                                    <code className="code-block">
{`from openai import OpenAI

client = OpenAI(
    api_key="${subscription.litellmKey}",
    base_url="https://llm.p10p.io"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
                                    </code>
                                    <button 
                                        onClick={() => copyToClipboard(`from openai import OpenAI\n\nclient = OpenAI(\n    api_key="${subscription.litellmKey}",\n    base_url="https://llm.p10p.io"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-3.5-turbo",\n    messages=[{"role": "user", "content": "Hello!"}]\n)`)}
                                        className="copy-code-button"
                                    >
                                        📋 Copy Code
                                    </button>
                                </div>
                                
                                <div className="example-section">
                                    <div className="example-title">🌐 cURL</div>
                                    <code className="code-block">
{`curl -X POST "https://llm.p10p.io/v1/chat/completions" \\
  -H "Authorization: Bearer ${subscription.litellmKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                                    </code>
                                    <button 
                                        onClick={() => copyToClipboard(`curl -X POST "https://llm.p10p.io/v1/chat/completions" \\\n  -H "Authorization: Bearer ${subscription.litellmKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "gpt-3.5-turbo",\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }'`)}
                                        className="copy-code-button"
                                    >
                                        📋 Copy cURL
                                    </button>
                                </div>
                                
                                <div className="example-section">
                                    <div className="example-title">🔗 JavaScript (fetch)</div>
                                    <code className="code-block">
{`const response = await fetch('https://llm.p10p.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${subscription.litellmKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{role: 'user', content: 'Hello!'}]
  })
});`}
                                    </code>
                                    <button 
                                        onClick={() => copyToClipboard(`const response = await fetch('https://llm.p10p.io/v1/chat/completions', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ${subscription.litellmKey}',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    model: 'gpt-3.5-turbo',\n    messages: [{role: 'user', content: 'Hello!'}]\n  })\n});`)}
                                        className="copy-code-button"
                                    >
                                        📋 Copy JS
                                    </button>
                                </div>
                            </div>
                            
                            <div className="supported-models">
                                <div className="models-title">🤖 Supported Models</div>
                                <div className="models-list">
                                    <span className="model-tag">gpt-3.5-turbo</span>
                                    <span className="model-tag">gpt-4</span>
                                    <span className="model-tag">gpt-4-turbo</span>
                                    <span className="model-tag">claude-3-sonnet</span>
                                    <span className="model-tag">llama-2-70b</span>
                                </div>
                            </div>
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
                            onClick={() => onTopUp && onTopUp(subscription)}
                            className="topup-button"
                        >
                            💰 Add FLOW
                        </button>
                        <button 
                            onClick={() => setShowBridge(!showBridge)}
                            className="bridge-button"
                        >
                            🌉 Cross-Chain Top-Up
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

            {/* Cross-Chain Bridge */}
            {showBridge && (
                <div className="bridge-section">
                    <div className="bridge-mock">
                        <h3>🌉 Cross-Chain Bridge (Coming Soon)</h3>
                        <p>Bridge tokens from Ethereum, Polygon, Arbitrum, and Base to top up your Flow subscription.</p>
                        <div className="mock-form">
                            <div className="form-row">
                                <label>From Chain:</label>
                                <select disabled>
                                    <option>Ethereum</option>
                                    <option>Polygon</option>
                                    <option>Arbitrum</option>
                                    <option>Base</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Token:</label>
                                <select disabled>
                                    <option>USDC</option>
                                    <option>ETH</option>
                                    <option>USDT</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Amount:</label>
                                <input type="number" placeholder="100.0" disabled />
                            </div>
                            <button className="bridge-submit" disabled>
                                🚧 Bridge Feature Under Development
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowBridge(false)}
                            className="close-bridge"
                        >
                            ✕ Close
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

                .update-button, .topup-button, .bridge-button, .refresh-button, .delete-button {
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

                .topup-button {
                    background: #F59E0B;
                    color: white;
                    border-color: #F59E0B;
                }

                .topup-button:hover {
                    background: #D97706;
                }

                .bridge-button {
                    background: #8B5CF6;
                    color: white;
                    border-color: #8B5CF6;
                }

                .bridge-button:hover {
                    background: #7C3AED;
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

                /* Usage Instructions Styles */
                .usage-instructions {
                    margin-top: 20px;
                    padding: 20px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                }

                .usage-instructions h5 {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1E40AF;
                }

                .endpoint-info {
                    margin-bottom: 20px;
                    padding: 12px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                }

                .endpoint-label {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .endpoint-url {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .endpoint-url code {
                    flex: 1;
                    padding: 8px 12px;
                    background: #F3F4F6;
                    border: 1px solid #D1D5DB;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 14px;
                }

                .copy-endpoint-button {
                    padding: 6px 8px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .copy-endpoint-button:hover {
                    background: #2563EB;
                }

                .code-examples {
                    margin-bottom: 20px;
                }

                .example-section {
                    margin-bottom: 16px;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .example-title {
                    padding: 8px 12px;
                    background: #E5E7EB;
                    font-weight: 600;
                    font-size: 14px;
                    color: #374151;
                    border-bottom: 1px solid #D1D5DB;
                }

                .code-block {
                    display: block;
                    padding: 12px;
                    background: #1F2937;
                    color: #F9FAFB;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    margin: 0;
                    overflow-x: auto;
                }

                .copy-code-button {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    padding: 4px 8px;
                    background: #059669;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    opacity: 0.8;
                }

                .copy-code-button:hover {
                    opacity: 1;
                    background: #047857;
                }

                .example-section {
                    position: relative;
                }

                .supported-models {
                    padding: 12px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                }

                .models-title {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 12px;
                }

                .models-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .model-tag {
                    padding: 4px 8px;
                    background: #EBF4FF;
                    color: #1E40AF;
                    border: 1px solid #BFDBFE;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
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

                    .update-button, .topup-button, .bridge-button, .refresh-button, .delete-button {
                        width: 100%;
                    }

                    .endpoint-url {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .code-block {
                        font-size: 11px;
                    }

                    .models-list {
                        justify-content: center;
                    }

                    .usage-instructions {
                        padding: 16px;
                    }
                }

                .bridge-section {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #E5E7EB;
                }

                .bridge-mock {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    padding: 20px;
                    position: relative;
                }

                .bridge-mock h3 {
                    margin: 0 0 8px 0;
                    color: #1E40AF;
                    font-size: 16px;
                }

                .bridge-mock p {
                    margin: 0 0 16px 0;
                    color: #6B7280;
                    font-size: 14px;
                }

                .mock-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .form-row {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .form-row label {
                    font-weight: 500;
                    color: #374151;
                    font-size: 14px;
                }

                .form-row select, .form-row input {
                    padding: 8px 12px;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    background: #F9FAFB;
                    color: #9CA3AF;
                }

                .bridge-submit {
                    padding: 10px 16px;
                    background: #F3F4F6;
                    color: #6B7280;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: not-allowed;
                    margin-top: 8px;
                }

                .close-bridge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    color: #6B7280;
                    padding: 4px;
                }

                .close-bridge:hover {
                    color: #374151;
                }
            `}</style>
        </div>
    );
};

export default SubscriptionTile;