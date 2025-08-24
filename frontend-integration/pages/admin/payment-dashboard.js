import React, { useEffect, useState } from 'react';
import PaymentDashboard from '../../components/PaymentDashboard';

export default function AdminPaymentDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Simple password protection for admin page
  const ADMIN_PASSWORD = 'admin2025'; // In production, use proper authentication

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🔒 Admin Access</h1>
            <p className="text-gray-600">Enter password to access payment dashboard</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Access Dashboard
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>💡 Default password: admin2025</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">🔧 Admin Panel</h1>
          <span className="ml-3 px-2 py-1 bg-blue-500 rounded-full text-xs">PAYMENT DASHBOARD</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <a 
            href="/" 
            className="hover:text-blue-200 transition-colors text-sm"
          >
            ← Back to App
          </a>
          
          <button
            onClick={() => setIsAuthorized(false)}
            className="hover:text-blue-200 transition-colors text-sm"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <PaymentDashboard />
      
      {/* Admin Footer */}
      <div className="bg-gray-800 text-white p-4 text-center text-sm">
        <div className="flex justify-center items-center space-x-6">
          <a 
            href="https://flowscan.org/account/0x6daee039a7b9c2f0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-300 transition-colors"
          >
            🔗 View on FlowScan
          </a>
          
          <span>•</span>
          
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Oracle Status: Active
          </div>
          
          <span>•</span>
          
          <div>Network: Flow Mainnet</div>
        </div>
      </div>
    </div>
  );
}