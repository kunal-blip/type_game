const validator = require('validator');

function sanitizeUsername(value) {
  if (typeof value !== 'string') return '';
  return validator.escape(value.trim());
}

function sanitizePassword(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

module.exports = {
  sanitizeUsername,
  sanitizePassword
};
