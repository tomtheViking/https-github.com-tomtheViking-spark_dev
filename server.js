/**
 * Spark Platform Production Entrypoint
 *
 * This file serves as the main entry point for AWS Elastic Beanstalk, EC2 PM2,
 * and other production environments that look for a root-level 'server.js' file.
 * It imports the high-performance compiled server bundle.
 */

import './dist/server.cjs';
