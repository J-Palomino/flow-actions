import React, { useState, useEffect } from 'react';
import OracleControls from './OracleControls';

const PaymentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/payment-dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-start oracle and refresh data
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-start oracle if not running
    const autoStartOracle = async () => {
      try {
        const response = await fetch('/api/admin/oracle-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status' })
        });
        
        const statusData = await response.json();
        
        // If oracle is not running, start it automatically
        if (statusData.success && !statusData.isRunning) {
          console.log('🚀 Auto-starting oracle...');
          
          const startResponse = await fetch('/api/admin/oracle-control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start' })
          });
          
          const startData = await startResponse.json();
          if (startData.success) {
            console.log('✅ Oracle auto-started successfully');
            // Refresh dashboard after starting
            setTimeout(fetchDashboardData, 3000);
          }
        }
      } catch (error) {
        console.log('⚠️ Auto-start failed:', error.message);
      }
    };
    
    // Start oracle check after initial load
    setTimeout(autoStartOracle, 2000);
    
    const interval = autoRefresh ? setInterval(fetchDashboardData, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading payment dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="flex items-center">
          <div className="text-red-500 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Dashboard Error</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { payments, oracleStatus, networkStats, budgetInfo } = dashboardData;
  
  // Calculate statistics
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const successfulPayments = payments.filter(p => p.status === 'success').length;
  const successRate = totalPayments > 0 ? (successfulPayments / totalPayments * 100).toFixed(1) : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            💰 Payment Dashboard
            <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              LIVE
            </span>
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              🤖 AUTO-ORACLE
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Real-time FLOW payment monitoring with automatic oracle startup</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Payments"
          value={totalPayments}
          icon="📊"
          color="bg-blue-50 border-blue-200"
        />
        
        <StatCard
          title="Total Amount"
          value={`${totalAmount.toFixed(6)} FLOW`}
          icon="💰"
          color="bg-green-50 border-green-200"
        />
        
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon="✅"
          color="bg-emerald-50 border-emerald-200"
        />
        
        <StatCard
          title="Contract Balance"
          value={`${networkStats.contractBalance.toFixed(6)} FLOW`}
          subtitle={`$${networkStats.contractBalanceUSD.toFixed(2)} USD`}
          icon="🏦"
          color="bg-purple-50 border-purple-200"
        />
      </div>

      {/* Budget Overview */}
      {budgetInfo && (
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              💵 Budget & Spending Overview
              <span className="ml-3 text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                ${budgetInfo.monthlyBudgetUSD}/month
              </span>
            </h2>
            
            {/* Budget Alerts */}
            {budgetInfo.alerts.length > 0 && (
              <div className="mb-6 space-y-2">
                {budgetInfo.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border flex items-center ${
                      alert.type === 'error' 
                        ? 'bg-red-50 border-red-200 text-red-800' 
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}
                  >
                    <span className="text-lg mr-3">{alert.icon}</span>
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm">{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Budget Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  ${budgetInfo.totalSpentUSD.toFixed(2)}
                </div>
                <div className="text-sm text-blue-700">Total Spent</div>
                <div className="text-xs text-blue-600 mt-1">
                  {budgetInfo.totalSpentFLOW.toFixed(6)} FLOW
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  ${budgetInfo.remainingBudgetUSD.toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Remaining Budget</div>
                <div className="text-xs text-green-600 mt-1">
                  {budgetInfo.remainingBudgetFLOW.toFixed(6)} FLOW
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">
                  ${budgetInfo.spent24hUSD.toFixed(2)}
                </div>
                <div className="text-sm text-orange-700">24h Spending</div>
                <div className="text-xs text-orange-600 mt-1">
                  Daily budget: ${budgetInfo.dailyBudgetUSD.toFixed(2)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  {budgetInfo.budgetUtilization.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700">Budget Used</div>
                <div className="text-xs text-purple-600 mt-1">
                  This month
                </div>
              </div>
            </div>
            
            {/* Vault Spending Breakdown */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Vault Spending Breakdown:</h3>
              {Object.entries(budgetInfo.vaultSpending).map(([vaultId, vault]) => (
                <div key={vaultId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="font-mono text-sm bg-gray-200 px-2 py-1 rounded mr-3">
                      {vaultId}
                    </div>
                    <div>
                      <div className="font-medium">{vault.name}</div>
                      <div className="text-sm text-gray-600">
                        ${vault.spentUSD.toFixed(2)} of ${vault.budgetUSD.toFixed(2)} budget
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {vault.utilization.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {vault.paymentCount} payments
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Oracle Controls */}
      <OracleControls 
        oracleStatus={oracleStatus} 
        onStatusChange={fetchDashboardData}
      />

      {/* Oracle Status */}
      <div className="bg-white rounded-lg shadow-sm border mb-8 mt-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🤖 Oracle Status
            <span className={`ml-3 px-3 py-1 rounded-full text-sm ${
              oracleStatus.isRunning 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {oracleStatus.isRunning ? 'Running' : 'Stopped'}
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{oracleStatus.totalProcessed}</div>
              <div className="text-sm text-gray-600">Payments Processed</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{oracleStatus.vaultsMonitored}</div>
              <div className="text-sm text-gray-600">Vaults Monitored</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {(oracleStatus.successRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Network Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem label="Network" value={networkStats.network} />
            <InfoItem label="FLOW Price" value={`$${networkStats.flowPriceUSD.toFixed(6)}`} />
            <InfoItem label="Block Height" value={networkStats.blockHeight.toLocaleString()} />
            <InfoItem label="Contract" value={`${networkStats.contractAddress.substring(0, 8)}...`} />
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">💸 Recent Payments</h2>
          
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">⏳</div>
                <div className="text-lg font-medium">No Real Payments Yet</div>
                <div className="text-sm">Waiting for oracle to process actual LiteLLM usage...</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left max-w-md mx-auto">
                <div className="text-blue-800 font-medium mb-2">🤖 To see payments here:</div>
                <div className="text-blue-700 text-sm space-y-1">
                  <div>1. Start the secure oracle</div>
                  <div>2. Oracle processes real LiteLLM usage</div>
                  <div>3. Payments appear here automatically</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Vault ID</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Usage</th>
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">TX Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono">{payment.vaultId}</td>
                      <td className="p-3 font-mono">{payment.amount.toFixed(6)} FLOW</td>
                      <td className="p-3 text-sm">
                        {payment.usageData.tokens} tokens<br/>
                        {payment.usageData.apiCalls} calls
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(payment.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'success' ? '✅ Success' : '❌ Failed'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        <a 
                          href={`https://flowscan.org/transaction/${payment.transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          {payment.transactionId.substring(0, 8)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()} 
        {autoRefresh && <span className="ml-2">• Auto-refreshing every 10s</span>}
        <span className="ml-2">• 🤖 Oracle auto-starts when needed</span>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className={`p-6 rounded-lg border ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="text-center p-3 bg-gray-50 rounded-lg">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="font-mono font-medium text-gray-900">{value}</div>
  </div>
);

export default PaymentDashboard;