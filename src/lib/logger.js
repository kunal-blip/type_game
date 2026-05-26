const pino = require('pino');
const config = require('../config/env');

const logger = pino({
  level: config.logLevel,
  redact: ['req.headers.authorization']
});

module.exports = logger;
