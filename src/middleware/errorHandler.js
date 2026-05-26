const logger = require('../lib/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(error, req, res, next) {
  logger.error({ err: error }, 'Unhandled server error');

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.statusCode || 500).json({
    error: error.expose ? error.message : 'Internal server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
