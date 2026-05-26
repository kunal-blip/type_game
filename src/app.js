const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pinoHttp = require('pino-http');

const config = require('./config/env');
const logger = require('./lib/logger');
const authenticateToken = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { sanitizeUsername, sanitizePassword } = require('./utils/sanitize');
const { readUsers, writeUsers } = require('./services/userStore');

function createCorsOptions() {
  if (config.corsOrigin === '*') {
    return { origin: true };
  }

  const allowedOrigins = config.corsOrigin.split(',').map((origin) => origin.trim());

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    }
  };
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: '10kb' }));
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            id: req.id
          };
        }
      }
    })
  );

  app.use(express.static('public'));

  app.post('/api/signup', async (req, res, next) => {
    try {
      const username = sanitizeUsername(req.body.username);
      const password = sanitizePassword(req.body.password);

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const users = await readUsers();

      if (users[username]) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      users[username] = {
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      await writeUsers(users);

      const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '7d' });

      return res.status(201).json({
        message: 'User created successfully',
        token,
        username
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/login', async (req, res, next) => {
    try {
      const username = sanitizeUsername(req.body.username);
      const password = sanitizePassword(req.body.password);

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const users = await readUsers();

      if (!users[username]) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const validPassword = await bcrypt.compare(password, users[username].password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '7d' });

      return res.json({
        message: 'Login successful',
        token,
        username
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({
      valid: true,
      username: req.user.username
    });
  });

  app.get('/api/profile', authenticateToken, async (req, res, next) => {
    try {
      const users = await readUsers();
      const userProfile = users[req.user.username];

      if (!userProfile) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profileData = { ...userProfile };
      delete profileData.password;

      return res.json({
        username: req.user.username,
        ...profileData
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
