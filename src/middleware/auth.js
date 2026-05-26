const jwt = require('jsonwebtoken');
const config = require('../config/env');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  return jwt.verify(token, config.jwtSecret, (error, user) => {
    if (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    return next();
  });
}

module.exports = authenticateToken;
