import React, { useState, useEffect } from 'react';
import * as fcl from "@onflow/fcl";
import { CONTRACTS } from '../config/flowConfig';

const AdminPricingControls = ({ account, onPricingUpdate }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    // Pricing configuration state
    const [globalMarkup, setGlobalMarkup] = useState(100); // 100% = 2x markup
    const [basePricing, setBasePricing] = useState({
        starter: 0.020,
        growth: 0.015,
        scale: 0.010,
        enterprise: 0.008
    });
    
    // Model-specific multipliers
    const [modelMultipliers, setModelMultipliers] = useState({
        gpt4: 1.5,
        gpt35: 0.8,
        claude: 1.2,
        llama: 0.6,
        gemini: 1.0,
        palm: 0.9
    });
    
    // Volume discounts
    const [volumeDiscounts, setVolumeDiscounts] = useState({
        starter: 0.0,
        growth: 0.1,
        scale: 0.2,
        enterprise: 0.3
    });

    // Check if current user is admin (contract deployer)
    useEffect(() => {
        if (account) {
            // In production, this would check admin privileges from the contract
            // For demo, the contract deployer is admin
            setIsAdmin(account === '0x6daee039a7b9c2f0');
        }
    }, [account]);

    const updateGlobalPricing = async () => {
        if (!isAdmin) {
            setError('Admin privileges required');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // For demo purposes, simulate the admin pricing update
            console.log('🔧 ADMIN: Updating global pricing configuration');
            console.log('📊 Global markup:', globalMarkup + '%');
            console.log('💰 Tier pricing (base rates):', basePricing);
            console.log('🤖 Model multipliers:', modelMultipliers);
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const mockTxId = `demo_${Date.now()}`;
            setSuccessMessage(`Pricing configuration updated! Demo Transaction: ${mockTxId}`);
            
            // Notify parent component
            if (onPricingUpdate) {
                onPricingUpdate({
                    globalMarkup,
                    basePricing,
                    modelMultipliers,
                    volumeDiscounts,
                    txId
                });
            }

        } catch (err) {
            setError(`Failed to update pricing: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const calculateFinalPrice = (tierPrice, markup, modelMultiplier, volumeDiscount = 0) => {
        const withMarkup = tierPrice * (1 + markup / 100);
        const withModelMultiplier = withMarkup * modelMultiplier;
        const withVolumeDiscount = withModelMultiplier * (1 - volumeDiscount);
        return withVolumeDiscount;
    };

    const resetToDefaults = () => {
        setGlobalMarkup(100);
        setBasePricing({
            starter: 0.020,
            growth: 0.015,
            scale: 0.010,
            enterprise: 0.008
        });
        setModelMultipliers({
            gpt4: 1.5,
            gpt35: 0.8,
            claude: 1.2,
            llama: 0.6,
            gemini: 1.0,
            palm: 0.9
        });
        setVolumeDiscounts({
            starter: 0.0,
            growth: 0.1,
            scale: 0.2,
            enterprise: 0.3
        });
    };

    if (!isAdmin) {
        return (
            <div className="admin-access-denied">
                <div className="access-denied-content">
                    <h3>🔒 Admin Access Required</h3>
                    <p>Only the contract administrator can modify pricing parameters.</p>
                    <p>Current account: {account}</p>
                    <p>Admin account: 0x6daee039a7b9c2f0</p>
                </div>
                
                <style jsx>{`
                    .admin-access-denied {
                        padding: 24px;
                        text-align: center;
                        border: 2px solid #FEE2E2;
                        border-radius: 12px;
                        background: #FEF2F2;
                    }
                    
                    .access-denied-content h3 {
                        color: #DC2626;
                        margin: 0 0 16px 0;
                    }
                    
                    .access-denied-content p {
                        color: #6B7280;
                        margin: 8px 0;
                        font-family: 'Monaco', monospace;
                        font-size: 14px;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-pricing-controls">
            <div className="admin-header">
                <h2>🔧 Admin Pricing Controls</h2>
                <div className="admin-badge">Administrator Panel</div>
            </div>

            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {successMessage && (
                <div className="success-message">
                    <strong>Success:</strong> {successMessage}
                </div>
            )}

            <div className="pricing-sections">
                {/* Global Markup */}
                <section className="pricing-section">
                    <h3>📊 Global Markup Configuration</h3>
                    <div className="control-group">
                        <label>Global Markup Percentage</label>
                        <div className="slider-control">
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="5"
                                value={globalMarkup}
                                onChange={(e) => setGlobalMarkup(Number(e.target.value))}
                                className="slider"
                            />
                            <div className="slider-value">{globalMarkup}%</div>
                        </div>
                        <div className="control-help">
                            Multiplier: ×{(1 + globalMarkup/100).toFixed(2)}
                        </div>
                    </div>
                </section>

                {/* Base Tier Pricing */}
                <section className="pricing-section">
                    <h3>💰 Base Tier Pricing (FLOW per 1K tokens)</h3>
                    <div className="tier-pricing-grid">
                        {Object.entries(basePricing).map(([tier, price]) => (
                            <div key={tier} className="tier-control">
                                <label>{tier.charAt(0).toUpperCase() + tier.slice(1)}</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setBasePricing(prev => ({
                                        ...prev,
                                        [tier]: Number(e.target.value)
                                    }))}
                                    min="0.001"
                                    max="1.0"
                                    step="0.001"
                                    className="price-input"
                                />
                                <div className="tier-volume-discount">
                                    Volume Discount: {(volumeDiscounts[tier] * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Model Multipliers */}
                <section className="pricing-section">
                    <h3>🤖 Model-Specific Multipliers</h3>
                    <div className="model-multipliers-grid">
                        {Object.entries(modelMultipliers).map(([model, multiplier]) => (
                            <div key={model} className="model-control">
                                <label>{model.toUpperCase()}</label>
                                <div className="multiplier-control">
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="3.0"
                                        step="0.1"
                                        value={multiplier}
                                        onChange={(e) => setModelMultipliers(prev => ({
                                            ...prev,
                                            [model]: Number(e.target.value)
                                        }))}
                                        className="multiplier-slider"
                                    />
                                    <div className="multiplier-value">×{multiplier.toFixed(1)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Pricing Preview */}
                <section className="pricing-section">
                    <h3>🔍 Pricing Preview</h3>
                    <div className="pricing-preview">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    <th>Tier</th>
                                    <th>GPT-4</th>
                                    <th>GPT-3.5</th>
                                    <th>Claude</th>
                                    <th>Llama</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(basePricing).map(([tier, basePrice]) => (
                                    <tr key={tier}>
                                        <td className="tier-name">{tier.charAt(0).toUpperCase() + tier.slice(1)}</td>
                                        <td className="price-cell">
                                            {calculateFinalPrice(basePrice, globalMarkup, modelMultipliers.gpt4, volumeDiscounts[tier]).toFixed(6)}
                                        </td>
                                        <td className="price-cell">
                                            {calculateFinalPrice(basePrice, globalMarkup, modelMultipliers.gpt35, volumeDiscounts[tier]).toFixed(6)}
                                        </td>
                                        <td className="price-cell">
                                            {calculateFinalPrice(basePrice, globalMarkup, modelMultipliers.claude, volumeDiscounts[tier]).toFixed(6)}
                                        </td>
                                        <td className="price-cell">
                                            {calculateFinalPrice(basePrice, globalMarkup, modelMultipliers.llama, volumeDiscounts[tier]).toFixed(6)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="preview-note">
                            All prices in FLOW per 1,000 tokens (including markup and volume discounts)
                        </div>
                    </div>
                </section>

                {/* Control Actions */}
                <section className="pricing-section">
                    <h3>⚡ Actions</h3>
                    <div className="action-buttons">
                        <button 
                            onClick={updateGlobalPricing}
                            disabled={loading}
                            className="update-button primary"
                        >
                            {loading ? '⏳ Updating...' : '✅ Update Global Pricing'}
                        </button>
                        
                        <button 
                            onClick={resetToDefaults}
                            disabled={loading}
                            className="reset-button secondary"
                        >
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .admin-pricing-controls {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                    font-family: 'Inter', sans-serif;
                }

                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #E5E7EB;
                }

                .admin-header h2 {
                    margin: 0;
                    color: #111827;
                    font-size: 28px;
                    font-weight: 700;
                }

                .admin-badge {
                    padding: 8px 16px;
                    background: #DC2626;
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .error-message, .success-message {
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .error-message {
                    background: #FEF2F2;
                    border: 1px solid #FECACA;
                    color: #DC2626;
                }

                .success-message {
                    background: #F0FDF4;
                    border: 1px solid #BBF7D0;
                    color: #15803D;
                }

                .pricing-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .pricing-section {
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 24px;
                }

                .pricing-section h3 {
                    margin: 0 0 20px 0;
                    color: #111827;
                    font-size: 20px;
                    font-weight: 600;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .control-group label {
                    font-size: 16px;
                    font-weight: 500;
                    color: #374151;
                }

                .slider-control {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .slider {
                    flex: 1;
                    height: 8px;
                    border-radius: 4px;
                    background: #E5E7EB;
                    outline: none;
                    -webkit-appearance: none;
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #3B82F6;
                    cursor: pointer;
                }

                .slider-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #3B82F6;
                    min-width: 60px;
                    text-align: center;
                }

                .control-help {
                    font-size: 14px;
                    color: #6B7280;
                }

                .tier-pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }

                .tier-control {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .tier-control label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    text-transform: capitalize;
                }

                .price-input {
                    padding: 12px;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    font-size: 16px;
                    font-family: 'Monaco', monospace;
                }

                .tier-volume-discount {
                    font-size: 12px;
                    color: #059669;
                    font-weight: 500;
                }

                .model-multipliers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                }

                .model-control {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .model-control label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    text-align: center;
                }

                .multiplier-control {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .multiplier-slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #E5E7EB;
                    outline: none;
                    -webkit-appearance: none;
                }

                .multiplier-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #059669;
                    cursor: pointer;
                }

                .multiplier-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #059669;
                    font-family: 'Monaco', monospace;
                }

                .pricing-preview {
                    overflow-x: auto;
                }

                .preview-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: 'Monaco', monospace;
                }

                .preview-table th,
                .preview-table td {
                    padding: 12px;
                    text-align: center;
                    border-bottom: 1px solid #E5E7EB;
                }

                .preview-table th {
                    background: #F9FAFB;
                    font-weight: 600;
                    color: #374151;
                }

                .tier-name {
                    text-transform: capitalize;
                    font-weight: 500;
                    text-align: left !important;
                }

                .price-cell {
                    font-size: 14px;
                    color: #059669;
                    font-weight: 500;
                }

                .preview-note {
                    margin-top: 12px;
                    font-size: 12px;
                    color: #6B7280;
                    text-align: center;
                }

                .action-buttons {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .update-button,
                .reset-button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 200px;
                }

                .primary {
                    background: #3B82F6;
                    color: white;
                }

                .primary:hover:not(:disabled) {
                    background: #2563EB;
                }

                .secondary {
                    background: #F3F4F6;
                    color: #374151;
                    border: 1px solid #D1D5DB;
                }

                .secondary:hover:not(:disabled) {
                    background: #E5E7EB;
                }

                .update-button:disabled,
                .reset-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .admin-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: flex-start;
                    }

                    .tier-pricing-grid,
                    .model-multipliers-grid {
                        grid-template-columns: 1fr;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .update-button,
                    .reset-button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminPricingControls;