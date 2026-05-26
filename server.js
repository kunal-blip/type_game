require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML/CSS/JS files from 'public' folder

// Helper function to read users from file
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty object
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

// Helper function to write users to file
async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Read existing users
        const users = await readUsers();

        // Check if user already exists
        if (users[username]) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user
        users[username] = {
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        await writeUsers(users);

        // Generate JWT token
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User created successfully',
            token,
            username
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Read users
        const users = await readUsers();

        // Check if user exists
        if (!users[username]) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, users[username].password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint (optional - for checking if user is still logged in)
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        username: req.user.username
    });
});

// Protected route example - Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const userProfile = users[req.user.username];

        if (!userProfile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't send password back
        const { password, ...profileData } = userProfile;

        res.json({
            username: req.user.username,
            ...profileData
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});