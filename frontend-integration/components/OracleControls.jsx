import React, { useState } from 'react';

const OracleControls = ({ oracleStatus, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const controlOracle = async (action) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/oracle-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        // Refresh status after action
        setTimeout(() => {
          if (onStatusChange) onStatusChange();
        }, 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!oracleStatus) return 'text-gray-500';
    return oracleStatus.isRunning ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!oracleStatus) return '❓';
    return oracleStatus.isRunning ? '🟢' : '🔴';
  };

  const getStatusText = () => {
    if (!oracleStatus) return 'Unknown';
    return oracleStatus.isRunning ? 'Running' : 'Stopped';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        🎛️ Oracle Controls
        <span className={`ml-3 px-3 py-1 rounded-full text-sm ${getStatusColor()} bg-gray-100`}>
          {getStatusIcon()} {getStatusText()}
        </span>
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          AUTO-START
        </span>
      </h3>

      {/* Current Status Display */}
      {oracleStatus && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Status:</span> 
              <span className={getStatusColor()}> {getStatusText()}</span>
            </div>
            <div>
              <span className="font-medium">Processed:</span> 
              <span className="ml-1">{oracleStatus.totalProcessed} payments</span>
            </div>
            <div>
              <span className="font-medium">Last Activity:</span> 
              <span className="ml-1">
                {oracleStatus.lastActivity 
                  ? new Date(oracleStatus.lastActivity).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pending Usage Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="text-blue-500 text-xl mr-3">📊</div>
          <div>
            <div className="font-medium text-blue-800">Usage Data Detected</div>
            <div className="text-blue-700 text-sm mt-1">
              • Total Requests: 1<br/>
              • Total Tokens: 18<br/>
              • Total Cost: $0.000018<br/>
              • Vault Balance: 0.0010 FLOW
            </div>
            <div className="text-blue-600 text-sm mt-2 font-medium">
              {oracleStatus?.isRunning 
                ? '✅ Oracle is processing this automatically'
                : '🤖 Oracle will auto-start to process this data'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => controlOracle('start')}
          disabled={loading || oracleStatus?.isRunning}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center"
        >
          {loading ? (
            <span className="animate-spin mr-2">⚪</span>
          ) : (
            <span className="mr-2">🚀</span>
          )}
          Start Oracle
        </button>

        <button
          onClick={() => controlOracle('stop')}
          disabled={loading || !oracleStatus?.isRunning}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center"
        >
          {loading ? (
            <span className="animate-spin mr-2">⚪</span>
          ) : (
            <span className="mr-2">🛑</span>
          )}
          Stop Oracle
        </button>

        <button
          onClick={() => controlOracle('restart')}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center"
        >
          {loading ? (
            <span className="animate-spin mr-2">⚪</span>
          ) : (
            <span className="mr-2">🔄</span>
          )}
          Restart Oracle
        </button>

        <button
          onClick={() => controlOracle('status')}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center"
        >
          {loading ? (
            <span className="animate-spin mr-2">⚪</span>
          ) : (
            <span className="mr-2">🔍</span>
          )}
          Refresh Status
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Quick Setup Instructions */}
      {!oracleStatus?.isRunning && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 font-medium mb-2">🔧 Oracle Setup Required</div>
          <div className="text-yellow-700 text-sm space-y-1">
            <div>Before starting the oracle, ensure:</div>
            <div>• Environment variables are set (LITELLM_API_KEY, ENCRYPT_PASSWORD, etc.)</div>
            <div>• PM2 is installed globally: <code className="bg-yellow-100 px-1 rounded">npm install -g pm2</code></div>
            <div>• Flow wallet authentication is configured</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OracleControls;