const fs = require('fs').promises;
const config = require('../config/env');

async function readUsers() {
  try {
    const data = await fs.readFile(config.usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeUsers(users) {
  await fs.writeFile(config.usersFile, JSON.stringify(users, null, 2));
}

module.exports = {
  readUsers,
  writeUsers
};
