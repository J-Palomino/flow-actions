/**
 * Health Check Endpoint
 * Required for cloud deployments to verify app is running
 */

export default function handler(req, res) {
    // Check if essential services are available
    const checks = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: {
            hasOracleConfig: !!(process.env.ORACLE_FLOW_ADDRESS && process.env.ORACLE_PRIVATE_KEY),
            hasLiteLLMKey: !!process.env.LITELLM_API_KEY,
            hasEncryptPassword: !!process.env.ENCRYPT_PASSWORD,
            flowNetwork: process.env.FLOW_NETWORK || 'mainnet'
        }
    };

    // Return 200 OK if healthy
    res.status(200).json(checks);
}