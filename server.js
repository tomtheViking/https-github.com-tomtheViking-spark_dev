/**
 * Spark Platform Production Entrypoint
 *
 * This file serves as the main entry point for AWS Elastic Beanstalk, EC2 PM2,
 * and other production environments that look for a root-level 'server.js' file.
 * It imports the high-performance compiled server bundle.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const compiledServerPath = join(__dirname, 'dist', 'server.cjs');

if (!existsSync(compiledServerPath)) {
  console.log('Compiled server build not found. Triggering automated build pipeline...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Failed to run build process during start:', error);
    process.exit(1);
  }
}

// Load the compiled server
await import('./dist/server.cjs');
