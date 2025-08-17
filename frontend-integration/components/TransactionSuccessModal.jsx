import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const TransactionSuccessModal = ({ isOpen, onClose, transactionData }) => {
    useEffect(() => {
        if (isOpen && transactionData) {
            // Trigger confetti effect
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                
                // Fire confetti from multiple origins
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                }));
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                }));
            }, 250);

            // Additional burst of confetti
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }, 500);

            return () => clearInterval(interval);
        }
    }, [isOpen, transactionData]);

    if (!isOpen || !transactionData) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="success-icon">{transactionData.isTopUp ? '💰' : '🎉'}</div>
                    <h2>{transactionData.isTopUp ? 'Top-Up Successful!' : 'Subscription Created Successfully!'}</h2>
                    <p>{transactionData.isTopUp ? 
                        'Your subscription vault has been funded with additional FLOW tokens' : 
                        'Your FlareFlow.link subscription is now active and ready to use'
                    }</p>
                </div>

                <div className="modal-body">
                    <div className="transaction-details">
                        <h3>📋 Transaction Details</h3>
                        
                        <div className="detail-row">
                            <span className="detail-label">Vault ID:</span>
                            <div className="detail-value">
                                <code className="vault-id">{transactionData.vaultId}</code>
                                <button 
                                    onClick={() => copyToClipboard(transactionData.vaultId.toString())}
                                    className="copy-btn"
                                >
                                    📋
                                </button>
                            </div>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Funded Amount:</span>
                            <div className="detail-value">
                                <span className="amount">{transactionData.amount || transactionData.subscription?.balance} FLOW</span>
                                <span className="funding-source">from your wallet</span>
                            </div>
                        </div>

                        {transactionData.litellmKey && (
                            <div className="detail-row">
                                <span className="detail-label">LiteLLM API Key:</span>
                                <div className="detail-value">
                                    <code className="api-key">{transactionData.litellmKey?.slice(0, 20)}...</code>
                                    <button 
                                        onClick={() => copyToClipboard(transactionData.litellmKey)}
                                        className="copy-btn"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="detail-row">
                            <span className="detail-label">Transaction ID:</span>
                            <div className="detail-value">
                                <code className="tx-id">{transactionData.txId?.slice(0, 20)}...</code>
                                <button 
                                    onClick={() => copyToClipboard(transactionData.txId)}
                                    className="copy-btn"
                                >
                                    📋
                                </button>
                            </div>
                        </div>

                        {transactionData.blockId && (
                            <div className="detail-row">
                                <span className="detail-label">Block ID:</span>
                                <div className="detail-value">
                                    <code className="block-id">{transactionData.blockId?.slice(0, 20)}...</code>
                                    <button 
                                        onClick={() => copyToClipboard(transactionData.blockId)}
                                        className="copy-btn"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!transactionData.isTopUp && (
                        <div className="usage-info">
                            <h3>🚀 Start Using Your API Key</h3>
                        <div className="usage-example">
                            <div className="endpoint-info">
                                <strong>OpenAI-Compatible Endpoint:</strong>
                                <div className="endpoint-display">
                                    <code>https://llm.p10p.io</code>
                                    <button 
                                        onClick={() => copyToClipboard('https://llm.p10p.io')}
                                        className="copy-btn"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                            
                            <div className="quick-example">
                                <strong>Python Quick Start:</strong>
                                <div className="code-example">
                                    <code className="python-code">
{`from openai import OpenAI

client = OpenAI(
    api_key="${transactionData.litellmKey}",
    base_url="https://llm.p10p.io"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
                                    </code>
                                    <button 
                                        onClick={() => copyToClipboard(`from openai import OpenAI\n\nclient = OpenAI(\n    api_key="${transactionData.litellmKey}",\n    base_url="https://llm.p10p.io"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-3.5-turbo",\n    messages=[{"role": "user", "content": "Hello!"}]\n)`)}
                                        className="copy-code-btn"
                                    >
                                        📋 Copy Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="next-steps">
                        <h3>✨ What's Next?</h3>
                        <ul className="steps-list">
                            {transactionData.isTopUp ? (
                                <li>💰 Your vault balance has been increased with {transactionData.amount} FLOW</li>
                            ) : (
                                <li>💰 Your vault is funded and ready for usage-based billing</li>
                            )}
                            <li>📊 Monitor real-time usage and costs in your subscription tile</li>
                            <li>🔄 Top up your vault anytime with more FLOW tokens</li>
                            <li>🛠️ Use any OpenAI-compatible library or tool</li>
                            <li>📈 Scale your usage as needed with automatic tier pricing</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="action-buttons">
                        <a 
                            href={transactionData.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="explorer-btn"
                        >
                            🔍 View on FlowDiver
                        </a>
                        <button onClick={onClose} className="close-btn">
                            ✅ Got it, thanks!
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: modalSlideIn 0.3s ease-out;
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .modal-header {
                    text-align: center;
                    padding: 32px 24px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 16px 16px 0 0;
                }

                .success-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    animation: bounce 0.6s ease-in-out;
                }

                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }

                .modal-header h2 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 700;
                }

                .modal-header p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 16px;
                }

                .modal-body {
                    padding: 24px;
                }

                .transaction-details {
                    margin-bottom: 32px;
                    padding: 20px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                }

                .transaction-details h3 {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1E40AF;
                }

                .detail-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #E2E8F0;
                }

                .detail-row:last-child {
                    border-bottom: none;
                }

                .detail-label {
                    font-weight: 600;
                    color: #374151;
                    min-width: 120px;
                }

                .detail-value {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    justify-content: flex-end;
                }

                .detail-value code {
                    padding: 4px 8px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 4px;
                    font-family: 'Monaco', monospace;
                    font-size: 13px;
                }

                .amount {
                    font-weight: 700;
                    color: #059669;
                    font-size: 16px;
                }

                .funding-source {
                    font-size: 12px;
                    color: #6B7280;
                    font-style: italic;
                }

                .copy-btn {
                    padding: 4px 6px;
                    background: #3B82F6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s;
                }

                .copy-btn:hover {
                    background: #2563EB;
                }

                .usage-info {
                    margin-bottom: 32px;
                    padding: 20px;
                    background: #F0F9FF;
                    border: 1px solid #BAE6FD;
                    border-radius: 12px;
                }

                .usage-info h3 {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1E40AF;
                }

                .endpoint-info {
                    margin-bottom: 20px;
                }

                .endpoint-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                }

                .endpoint-display code {
                    flex: 1;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    font-family: 'Monaco', monospace;
                }

                .code-example {
                    position: relative;
                    margin-top: 8px;
                }

                .python-code {
                    display: block;
                    padding: 16px;
                    background: #1F2937;
                    color: #F9FAFB;
                    border-radius: 8px;
                    font-family: 'Monaco', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }

                .copy-code-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    padding: 6px 12px;
                    background: #059669;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }

                .copy-code-btn:hover {
                    background: #047857;
                }

                .next-steps {
                    padding: 20px;
                    background: #F0FDF4;
                    border: 1px solid #BBF7D0;
                    border-radius: 12px;
                }

                .next-steps h3 {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #15803D;
                }

                .steps-list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                .steps-list li {
                    padding: 8px 0;
                    color: #374151;
                    font-size: 14px;
                }

                .modal-footer {
                    padding: 24px;
                    border-top: 1px solid #E5E7EB;
                    background: #F9FAFB;
                    border-radius: 0 0 16px 16px;
                }

                .action-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .explorer-btn, .close-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .explorer-btn {
                    background: #6366F1;
                    color: white;
                }

                .explorer-btn:hover {
                    background: #4F46E5;
                    transform: translateY(-1px);
                }

                .close-btn {
                    background: #10B981;
                    color: white;
                }

                .close-btn:hover {
                    background: #059669;
                    transform: translateY(-1px);
                }

                @media (max-width: 768px) {
                    .modal-overlay {
                        padding: 12px;
                    }

                    .modal-content {
                        max-height: 95vh;
                    }

                    .modal-header {
                        padding: 24px 20px 20px;
                    }

                    .success-icon {
                        font-size: 40px;
                    }

                    .modal-header h2 {
                        font-size: 20px;
                    }

                    .modal-body {
                        padding: 20px;
                    }

                    .detail-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }

                    .detail-value {
                        justify-content: flex-start;
                        width: 100%;
                    }

                    .python-code {
                        font-size: 11px;
                        padding: 12px;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default TransactionSuccessModal;