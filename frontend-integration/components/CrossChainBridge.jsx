import React, { useState, useEffect } from 'react';
import layerZeroService from '../services/layerZeroService';

const CrossChainBridge = ({ subscription, onBridgeComplete }) => {
    const [fromChain, setFromChain] = useState('ethereum');
    const [selectedToken, setSelectedToken] = useState(null);
    const [bridgeAmount, setBridgeAmount] = useState('');
    const [supportedTokens, setSupportedTokens] = useState([]);
    const [bridgeQuote, setBridgeQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState(null);

    const SUPPORTED_CHAINS = [
        { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
        { id: 'polygon', name: 'Polygon', icon: '🟣' },
        { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
        { id: 'base', name: 'Base', icon: '🔷' }
    ];

    useEffect(() => {
        loadSupportedTokens();
    }, [fromChain]);

    useEffect(() => {
        if (selectedToken && bridgeAmount && bridgeAmount > 0) {
            getBridgeQuote();
        }
    }, [selectedToken, bridgeAmount, fromChain]);

    const loadSupportedTokens = async () => {
        try {
            const tokens = await layerZeroService.getSupportedTokens(fromChain);
            setSupportedTokens(tokens);
            if (tokens.length > 0) {
                setSelectedToken(tokens[0]); // Default to first token
            }
        } catch (error) {
            console.error('Error loading tokens:', error);
        }
    };

    const getBridgeQuote = async () => {
        if (!selectedToken || !bridgeAmount) return;

        try {
            setIsLoading(true);
            const quote = await layerZeroService.getBridgeQuote(
                fromChain,
                'flow',
                selectedToken.address,
                bridgeAmount
            );
            setBridgeQuote(quote);
        } catch (error) {
            console.error('Error getting quote:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBridge = async () => {
        if (!selectedToken || !bridgeAmount || !subscription) return;

        try {
            setIsLoading(true);
            setBridgeStatus('initiating');

            const result = await layerZeroService.bridgeToFlow(
                fromChain,
                selectedToken.address,
                bridgeAmount,
                subscription.vaultId,
                subscription.owner
            );

            if (result.success) {
                setBridgeStatus('monitoring');
                
                // Monitor transaction
                const monitorInterval = setInterval(async () => {
                    try {
                        const status = await layerZeroService.monitorBridgeTransaction(
                            result.txHash,
                            fromChain
                        );

                        if (status.status === 'delivered') {
                            setBridgeStatus('completed');
                            clearInterval(monitorInterval);
                            onBridgeComplete && onBridgeComplete(result);
                        } else if (status.status === 'failed') {
                            setBridgeStatus('failed');
                            clearInterval(monitorInterval);
                        }
                    } catch (error) {
                        console.error('Error monitoring bridge:', error);
                    }
                }, 10000); // Check every 10 seconds

                // Cleanup after 30 minutes
                setTimeout(() => clearInterval(monitorInterval), 30 * 60 * 1000);
            } else {
                setBridgeStatus('failed');
            }
        } catch (error) {
            console.error('Bridge failed:', error);
            setBridgeStatus('failed');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        return minutes > 0 ? `~${minutes} min` : `~${seconds} sec`;
    };

    return (
        <div className="cross-chain-bridge">
            <div className="bridge-header">
                <h3>🌉 Cross-Chain Top-Up</h3>
                <p>Bridge tokens from any chain to fund your Flow subscription</p>
            </div>

            {/* Chain Selection */}
            <div className="form-group">
                <label>From Chain:</label>
                <div className="chain-selector">
                    {SUPPORTED_CHAINS.map(chain => (
                        <button
                            key={chain.id}
                            onClick={() => setFromChain(chain.id)}
                            className={`chain-button ${fromChain === chain.id ? 'active' : ''}`}
                        >
                            {chain.icon} {chain.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Token Selection */}
            <div className="form-group">
                <label>Token:</label>
                <select 
                    value={selectedToken?.address || ''} 
                    onChange={(e) => {
                        const token = supportedTokens.find(t => t.address === e.target.value);
                        setSelectedToken(token);
                    }}
                    className="token-select"
                >
                    {supportedTokens.map(token => (
                        <option key={token.address} value={token.address}>
                            {token.symbol} - {token.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Amount Input */}
            <div className="form-group">
                <label>Amount:</label>
                <div className="amount-input">
                    <input
                        type="number"
                        value={bridgeAmount}
                        onChange={(e) => setBridgeAmount(e.target.value)}
                        placeholder="0.0"
                        className="amount-field"
                    />
                    <span className="token-symbol">{selectedToken?.symbol}</span>
                </div>
            </div>

            {/* Bridge Quote */}
            {bridgeQuote && (
                <div className="bridge-quote">
                    <h4>Bridge Quote</h4>
                    <div className="quote-details">
                        <div className="quote-line">
                            <span>Bridge Fee:</span>
                            <span>{bridgeQuote.nativeFee} ETH</span>
                        </div>
                        <div className="quote-line">
                            <span>Estimated Time:</span>
                            <span>{formatTime(bridgeQuote.estimatedTime)}</span>
                        </div>
                        <div className="quote-line">
                            <span>You'll Receive:</span>
                            <span>{bridgeAmount} FLOW (estimated)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bridge Status */}
            {bridgeStatus && (
                <div className={`bridge-status ${bridgeStatus}`}>
                    {bridgeStatus === 'initiating' && (
                        <div>
                            <div className="status-icon">⏳</div>
                            <div>Initiating bridge transaction...</div>
                        </div>
                    )}
                    {bridgeStatus === 'monitoring' && (
                        <div>
                            <div className="status-icon">🔄</div>
                            <div>Monitoring cross-chain transfer...</div>
                            <div className="status-sub">This may take a few minutes</div>
                        </div>
                    )}
                    {bridgeStatus === 'completed' && (
                        <div>
                            <div className="status-icon">✅</div>
                            <div>Bridge completed successfully!</div>
                            <div className="status-sub">Your Flow subscription has been topped up</div>
                        </div>
                    )}
                    {bridgeStatus === 'failed' && (
                        <div>
                            <div className="status-icon">❌</div>
                            <div>Bridge transaction failed</div>
                            <div className="status-sub">Please try again or contact support</div>
                        </div>
                    )}
                </div>
            )}

            {/* Bridge Button */}
            <button
                onClick={handleBridge}
                disabled={isLoading || !selectedToken || !bridgeAmount || bridgeAmount <= 0}
                className="bridge-button"
            >
                {isLoading ? '⏳ Processing...' : `🌉 Bridge ${bridgeAmount || '0'} ${selectedToken?.symbol || ''} to Flow`}
            </button>

            {/* Bridge Benefits */}
            <div className="bridge-benefits">
                <h4>Why Bridge to Flow?</h4>
                <ul>
                    <li>💰 <strong>Lower Fees:</strong> Flow transactions cost ~$0.001</li>
                    <li>⚡ <strong>Fast Settlement:</strong> 2-3 second finality</li>
                    <li>🔄 <strong>Auto Top-Up:</strong> Funds directly added to subscription</li>
                    <li>📊 <strong>Unified Tracking:</strong> All usage on one blockchain</li>
                </ul>
            </div>

            <style jsx>{`
                .cross-chain-bridge {
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 24px;
                    border: 1px solid #e1e5e9;
                    border-radius: 12px;
                    background: white;
                }

                .bridge-header {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .bridge-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    color: #1a1a1a;
                }

                .bridge-header p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                }

                .chain-selector {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }

                .chain-button {
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                }

                .chain-button:hover {
                    border-color: #3b82f6;
                }

                .chain-button.active {
                    border-color: #3b82f6;
                    background: #eff6ff;
                    color: #1d4ed8;
                }

                .token-select {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .amount-input {
                    display: flex;
                    align-items: center;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .amount-field {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    font-size: 16px;
                    outline: none;
                }

                .token-symbol {
                    padding: 12px 16px;
                    background: #f3f4f6;
                    color: #6b7280;
                    font-weight: 500;
                    border-left: 1px solid #d1d5db;
                }

                .bridge-quote {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                }

                .bridge-quote h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: #1e293b;
                }

                .quote-details {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .quote-line {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                }

                .quote-line span:first-child {
                    color: #64748b;
                }

                .quote-line span:last-child {
                    font-weight: 600;
                    color: #1e293b;
                }

                .bridge-status {
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .bridge-status.initiating {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                }

                .bridge-status.monitoring {
                    background: #dbeafe;
                    border: 1px solid #3b82f6;
                }

                .bridge-status.completed {
                    background: #dcfce7;
                    border: 1px solid #16a34a;
                }

                .bridge-status.failed {
                    background: #fee2e2;
                    border: 1px solid #dc2626;
                }

                .status-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                }

                .status-sub {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 4px;
                }

                .bridge-button {
                    width: 100%;
                    padding: 16px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-bottom: 20px;
                }

                .bridge-button:hover:not(:disabled) {
                    background: #2563eb;
                }

                .bridge-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .bridge-benefits {
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    border-radius: 8px;
                    padding: 16px;
                }

                .bridge-benefits h4 {
                    margin: 0 0 12px 0;
                    color: #0c4a6e;
                    font-size: 14px;
                }

                .bridge-benefits ul {
                    margin: 0;
                    padding-left: 0;
                    list-style: none;
                }

                .bridge-benefits li {
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: #0c4a6e;
                }

                .bridge-benefits li:last-child {
                    margin-bottom: 0;
                }
            `}</style>
        </div>
    );
};

export default CrossChainBridge;