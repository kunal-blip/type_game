const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const defaultSecret = 'change-this-secret-in-production';
const jwtSecret = process.env.JWT_SECRET || defaultSecret;

if (process.env.NODE_ENV === 'production' && jwtSecret === defaultSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  usersFile: process.env.USERS_FILE || path.resolve(process.cwd(), 'users.json')
});

module.exports = config;
