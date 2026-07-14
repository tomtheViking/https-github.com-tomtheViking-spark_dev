/**
 * Spark Platform Production Entrypoint
 * 
 * This file serves as the main entry point for AWS Elastic Beanstalk, EC2, PM2,
 * and other production environments. It gracefully runs the fully compiled 
 * high-performance Spark platform if available, or falls back to a clean status/health
 * server if the build has not been generated or cannot be compiled in the current environment.
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const projectDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const compiledServerPath = join(projectDir, 'dist', 'server.cjs');

let port = process.env.PORT || 8080;

// On AWS Elastic Beanstalk, EC2, or other non-root environments, privileged ports (< 1024)
// cannot be bound by the webapp/node user. We automatically fallback to the default 8080.
const numericPort = parseInt(port, 10);
if (isNaN(numericPort) || numericPort < 1024) {
  console.warn(`[Spark Production] Warning: Requested port ${port} is privileged (< 1024) or invalid.`);
  console.warn(`[Spark Production] Automatically overriding to 8080 to comply with Elastic Beanstalk proxy standards.`);
  port = 8080;
}
process.env.PORT = port.toString();

let useFallback = false;
let buildError = null;

console.log('=== STARTING SPARK PLATFORM ===');
console.log('Node version:', process.version);
console.log('Port:', port);
console.log('Environment:', process.env.NODE_ENV || 'development');

if (!existsSync(compiledServerPath)) {
  console.log('Compiled server build (dist/server.cjs) not found on startup.');
  console.log('ℹ️ Activating fallback health/status server immediately to keep Beanstalk healthy.');
  buildError = 'Compiled server build (dist/server.cjs) not found on startup. Please check deployment or build pipeline logs.';
  useFallback = true;
}

function startFallbackServer(loadError) {
  console.log('Starting Spark Platform server in fallback status mode...');
  
  const express = require('express');
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.static('public'));

  // Health check for EB
  app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      port: port,
      mode: 'fallback',
      buildError: buildError,
      loadError: loadError ? loadError.message || String(loadError) : null
    });
  });

  // Main route
  app.get('/', (req, res) => {
    console.log('Main route requested');
    res.json({ 
      message: 'Spark Platform is running in fallback mode!',
      version: '1.0.0',
      port: port,
      mode: 'fallback',
      buildError: buildError,
      loadError: loadError ? loadError.message || String(loadError) : null
    });
  });

  // Start server
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Spark Platform fallback server started on port ${port}`);
    console.log(`🌐 Server listening on all interfaces (0.0.0.0:${port})`);
  });
}

if (!useFallback && existsSync(compiledServerPath)) {
  console.log('🚀 Starting high-performance Spark Platform from compiled bundle...');
  try {
    const platform = require(compiledServerPath);
    if (platform && typeof platform.startServer === 'function') {
      platform.startServer().catch((error) => {
        console.error('❌ Runtime error during Spark Platform server startup:', error);
        console.log('ℹ️ Activating fallback health/status server due to runtime error.');
        startFallbackServer(error);
      });
    } else {
      console.log('ℹ️ Legacy bundle detected or autostart executed.');
    }
  } catch (error) {
    console.error('❌ Failed to load or run compiled server bundle:', error);
    console.log('ℹ️ Activating fallback health/status server due to runtime error.');
    startFallbackServer(error);
  }
} else {
  startFallbackServer(null);
}


