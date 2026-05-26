const config = require('./config/env');
const logger = require('./lib/logger');
const createApp = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`Server is running on http://localhost:${config.port}`);
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down server');
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
