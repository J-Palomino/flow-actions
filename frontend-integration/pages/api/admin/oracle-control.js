// API endpoint for controlling the oracle from the web interface

import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action } = req.body;

    try {
        switch (action) {
            case 'start':
                startOracle(req, res);
                break;
            case 'stop':
                stopOracle(req, res);
                break;
            case 'status':
                getOracleStatus(req, res);
                break;
            case 'restart':
                restartOracle(req, res);
                break;
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Oracle control error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to control oracle: ' + error.message 
        });
    }
}

function startOracle(req, res) {
    console.log('🚀 Starting oracle from web interface...');
    
    const oracleDir = path.join(process.cwd(), '../scripts/fdc-integration');
    
    // Check if environment variables are set up (production uses env vars, not .env file)
    if (!process.env.ORACLE_FLOW_ADDRESS || !process.env.ORACLE_PRIVATE_KEY || !process.env.LITELLM_API_KEY) {
        return res.status(400).json({
            success: false,
            error: 'Required environment variables not set. Please configure ORACLE_FLOW_ADDRESS, ORACLE_PRIVATE_KEY, and LITELLM_API_KEY.'
        });
    }

    // Start oracle using PM2
    const startCommand = `cd "${oracleDir}" && pm2 start secure-litellm-oracle-production.js --name "secure-oracle-web" --env production`;
    
    exec(startCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to start oracle:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to start oracle: ' + error.message,
                details: stderr
            });
        }
        
        res.json({
            success: true,
            message: 'Oracle started successfully',
            output: stdout,
            processName: 'secure-oracle-web'
        });
    });
}

function stopOracle(req, res) {
    console.log('🛑 Stopping oracle from web interface...');
    
    const stopCommand = 'pm2 stop secure-oracle-web && pm2 delete secure-oracle-web';
    
    exec(stopCommand, (error, stdout, stderr) => {
        if (error && !error.message.includes('process name not found')) {
            console.error('Failed to stop oracle:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to stop oracle: ' + error.message,
                details: stderr
            });
        }
        
        res.json({
            success: true,
            message: 'Oracle stopped successfully',
            output: stdout
        });
    });
}

function restartOracle(req, res) {
    console.log('🔄 Restarting oracle from web interface...');
    
    const restartCommand = 'pm2 restart secure-oracle-web || (pm2 stop secure-oracle-web && pm2 delete secure-oracle-web)';
    
    exec(restartCommand, (error, stdout, stderr) => {
        if (error) {
            // If restart fails, try to start fresh
            return startOracle(req, res);
        }
        
        res.json({
            success: true,
            message: 'Oracle restarted successfully',
            output: stdout
        });
    });
}

function getOracleStatus(req, res) {
    const statusCommand = 'pm2 list --no-color';
    
    exec(statusCommand, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Failed to get oracle status: ' + error.message
            });
        }
        
        const isRunning = stdout.includes('secure-oracle-web') && stdout.includes('online');
        const logPath = path.join(process.cwd(), '../scripts/fdc-integration/logs/secure-oracle.log');
        
        let lastActivity = null;
        let totalProcessed = 0;
        
        try {
            if (fs.existsSync(logPath)) {
                const logs = fs.readFileSync(logPath, 'utf8');
                const lines = logs.split('\n').filter(line => line.trim());
                
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1];
                    const timeMatch = lastLine.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
                    if (timeMatch) lastActivity = timeMatch[1];
                }
                
                totalProcessed = (logs.match(/automatic payment triggered/g) || []).length;
            }
        } catch (logError) {
            console.error('Error reading logs:', logError);
        }
        
        res.json({
            success: true,
            isRunning: isRunning,
            lastActivity: lastActivity,
            totalProcessed: totalProcessed,
            pm2Output: stdout,
            logExists: fs.existsSync(logPath)
        });
    });
}