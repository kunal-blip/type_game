const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

describe('API', () => {
  let app;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'type-game-test-'));
    process.env.USERS_FILE = path.join(tempDir, 'users.json');
    process.env.JWT_SECRET = 'test-secret';
    jest.resetModules();
    app = require('../src/app')();
  });

  afterEach(() => {
    delete process.env.USERS_FILE;
    delete process.env.JWT_SECRET;
  });

  test('signup validates missing fields', async () => {
    const response = await request(app).post('/api/signup').send({ username: '', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username and password are required');
  });

  test('signup sanitizes username and returns token', async () => {
    const response = await request(app)
      .post('/api/signup')
      .send({ username: ' <alice> ', password: 'securepass' });

    expect(response.status).toBe(201);
    expect(response.body.username).toBe('&lt;alice&gt;');
    expect(typeof response.body.token).toBe('string');
  });

  test('protected route requires token', async () => {
    const response = await request(app).get('/api/profile');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token required');
  });
});
