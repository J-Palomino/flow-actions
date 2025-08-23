import React, { useState, useEffect } from 'react';
import realtimeUsageService from '../services/realtimeUsageService';

const RealtimeUsageDisplay = ({ subscription }) => {
    const [hybridUsage, setHybridUsage] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [nextUpdate, setNextUpdate] = useState(null);

    useEffect(() => {
        if (subscription?.litellmKey) {
            startMonitoring();
        }

        return () => {
            if (isMonitoring) {
                realtimeUsageService.stopRealtimeMonitoring();
            }
        };
    }, [subscription]);

    // Update countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            const next = realtimeUsageService.getNextOracleUpdateTime();
            setNextUpdate(next);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const startMonitoring = async () => {
        setIsMonitoring(true);

        // Get initial hybrid usage
        const usage = await realtimeUsageService.getHybridUsage(
            subscription.litellmKey,
            subscription.vaultId
        );
        setHybridUsage(usage);

        // Start real-time monitoring for pending updates
        realtimeUsageService.startRealtimeMonitoring(
            subscription.litellmKey,
            (pendingUpdate) => {
                setHybridUsage(prev => ({
                    ...prev,
                    pending: {
                        ...pendingUpdate,
                        status: 'PENDING_ORACLE_CONFIRMATION'
                    },
                    total: {
                        tokens: pendingUpdate.tokens + (prev?.confirmed?.tokens || 0),
                        requests: pendingUpdate.requests + (prev?.confirmed?.requests || 0),
                        estimatedCost: pendingUpdate.cost + (prev?.confirmed?.cost || 0),
                        billableCost: prev?.confirmed?.cost || 0
                    }
                }));
            }
        );
    };

    if (!hybridUsage) {
        return (
            <div className="usage-loading">
                <div className="spinner"></div>
                <span>Loading real-time usage...</span>
            </div>
        );
    }

    return (
        <div className="realtime-usage-display">
            {/* Oracle Update Timer */}
            <div className="oracle-timer">
                <div className="timer-content">
                    <span className="timer-label">🔄 Next Oracle Update:</span>
                    <span className="timer-countdown">{nextUpdate?.countdown || 'Calculating...'}</span>
                </div>
                <div className="timer-bar">
                    <div 
                        className="timer-progress"
                        style={{ 
                            width: `${100 - (nextUpdate?.milliseconds || 0) / 300000 * 100}%` 
                        }}
                    />
                </div>
            </div>

            {/* Usage Summary */}
            <div className="usage-summary">
                <div className="usage-card total">
                    <h4>📊 Total Usage & Billing</h4>
                    <div className="usage-metrics">
                        <div className="metric">
                            <span className="label">Total Tokens:</span>
                            <span className="value">{hybridUsage.total.tokens.toLocaleString()}</span>
                        </div>
                        <div className="metric">
                            <span className="label">Total Requests:</span>
                            <span className="value">{hybridUsage.total.requests}</span>
                        </div>
                        <div className="metric">
                            <span className="label">Already Paid:</span>
                            <span className="value confirmed-cost">
                                ${(hybridUsage.total?.billableCost || 0).toFixed(6)} FLOW
                            </span>
                        </div>
                        <div className="metric">
                            <span className="label">Pending Payment:</span>
                            <span className="value pending-cost">
                                ${(hybridUsage.total?.pendingBill || 0).toFixed(6)} FLOW
                            </span>
                        </div>
                    </div>
                </div>

                <div className="usage-split">
                    {/* Pending Payment */}
                    <div className="usage-card pending">
                        <div className="card-header">
                            <h5>⏳ Pending Payment</h5>
                            <span className="status-badge pending">AWAITING FLARE</span>
                        </div>
                        <div className="usage-metrics">
                            <div className="metric">
                                <span className="label">New Tokens:</span>
                                <span className="value">{hybridUsage.pending.tokens.toLocaleString()}</span>
                            </div>
                            <div className="metric">
                                <span className="label">New Requests:</span>
                                <span className="value">{hybridUsage.pending.requests}</span>
                            </div>
                            <div className="metric">
                                <span className="label">Pending Bill:</span>
                                <span className="value pending-cost">
                                    ${(hybridUsage.pending?.cost || 0).toFixed(6)}
                                </span>
                            </div>
                        </div>
                        <div className="data-freshness">
                            Updated: {hybridUsage.dataFreshness.pending}
                        </div>
                        <div className="payment-note">
                            💡 Will be automatically paid when Flare confirms usage
                        </div>
                    </div>

                    {/* Already Paid */}
                    <div className="usage-card confirmed">
                        <div className="card-header">
                            <h5>💰 Already Paid</h5>
                            <span className="status-badge confirmed">PAID TO PROVIDER</span>
                        </div>
                        <div className="usage-metrics">
                            <div className="metric">
                                <span className="label">Paid Tokens:</span>
                                <span className="value">{hybridUsage.confirmed.tokens.toLocaleString()}</span>
                            </div>
                            <div className="metric">
                                <span className="label">Paid Requests:</span>
                                <span className="value">{hybridUsage.confirmed.requests}</span>
                            </div>
                            <div className="metric">
                                <span className="label">Amount Paid:</span>
                                <span className="value confirmed-cost">
                                    ${(hybridUsage.confirmed?.cost || 0).toFixed(6)} FLOW
                                </span>
                            </div>
                        </div>
                        {hybridUsage.confirmed.flareRoundId && (
                            <div className="oracle-info">
                                <span>Flare Round: #{hybridUsage.confirmed.flareRoundId}</span>
                            </div>
                        )}
                        <div className="data-freshness">
                            Attested: {hybridUsage.dataFreshness.confirmed}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Activity Indicator */}
            <div className="live-indicator">
                {hybridUsage.pending.tokens > 0 ? (
                    <div className="activity-active">
                        <span className="pulse"></span>
                        <span className="text">🔴 Live Activity Detected</span>
                    </div>
                ) : (
                    <div className="activity-idle">
                        <span className="text">⚪ No Recent Activity</span>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="info-box">
                <h6>ℹ️ How Real-Time Usage Works</h6>
                <ul>
                    <li><strong>Pending:</strong> Shows usage immediately as you make API calls (updated every 5 seconds)</li>
                    <li><strong>Confirmed:</strong> Oracle-verified usage that will be billed (updated every 5 minutes)</li>
                    <li><strong>Billing:</strong> Only confirmed usage is charged to your vault</li>
                </ul>
            </div>

            <style jsx>{`
                .realtime-usage-display {
                    padding: 20px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    margin-top: 20px;
                }

                .oracle-timer {
                    margin-bottom: 20px;
                    padding: 12px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                }

                .timer-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .timer-label {
                    font-weight: 600;
                    color: #374151;
                }

                .timer-countdown {
                    font-family: 'Monaco', monospace;
                    font-size: 16px;
                    font-weight: 700;
                    color: #3B82F6;
                }

                .timer-bar {
                    height: 4px;
                    background: #E5E7EB;
                    border-radius: 2px;
                    overflow: hidden;
                }

                .timer-progress {
                    height: 100%;
                    background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
                    transition: width 1s linear;
                }

                .usage-summary {
                    display: grid;
                    gap: 16px;
                }

                .usage-card {
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    padding: 16px;
                }

                .usage-card.total {
                    border-color: #3B82F6;
                    border-width: 2px;
                }

                .usage-card h4 {
                    margin: 0 0 12px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                }

                .usage-split {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .card-header h5 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.pending {
                    background: #FEF3C7;
                    color: #92400E;
                }

                .status-badge.confirmed {
                    background: #D1FAE5;
                    color: #065F46;
                }

                .usage-metrics {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .metric {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .metric .label {
                    font-size: 14px;
                    color: #6B7280;
                }

                .metric .value {
                    font-family: 'Monaco', monospace;
                    font-weight: 600;
                    color: #111827;
                }

                .value.estimated {
                    color: #F59E0B;
                }

                .pending-cost {
                    color: #F59E0B;
                    font-style: italic;
                }

                .confirmed-cost {
                    color: #059669;
                    font-weight: 700;
                }

                .data-freshness {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #E5E7EB;
                    font-size: 12px;
                    color: #6B7280;
                }

                .oracle-info {
                    margin-top: 8px;
                    font-size: 12px;
                    color: #6366F1;
                    font-weight: 500;
                }

                .live-indicator {
                    margin-top: 16px;
                    padding: 12px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    text-align: center;
                }

                .activity-active, .activity-idle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .pulse {
                    width: 8px;
                    height: 8px;
                    background: #EF4444;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
                    }
                }

                .info-box {
                    margin-top: 16px;
                    padding: 12px;
                    background: #EFF6FF;
                    border: 1px solid #BFDBFE;
                    border-radius: 8px;
                }

                .info-box h6 {
                    margin: 0 0 8px 0;
                    color: #1E40AF;
                    font-size: 14px;
                }

                .info-box ul {
                    margin: 0;
                    padding-left: 20px;
                    font-size: 13px;
                    color: #1E40AF;
                }

                .info-box li {
                    margin-bottom: 4px;
                }
                
                .payment-note {
                    margin-top: 8px;
                    padding: 6px 10px;
                    background: #FEF3C7;
                    border: 1px solid #F59E0B;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #92400E;
                    font-style: italic;
                }

                .usage-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 40px;
                }

                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #E5E7EB;
                    border-top-color: #3B82F6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .usage-split {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default RealtimeUsageDisplay;