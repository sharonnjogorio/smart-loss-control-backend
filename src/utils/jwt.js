const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '12h' // 12-hour session as per PRD
  });
};

// Generate OTP (4-digit, cryptographically secure)
const generateOTP = () => {
  // Always use crypto-secure random 4-digit OTP
  return crypto.randomInt(1000, 9999).toString();
};

module.exports = { 
  generateToken, 
  generateOTP 
};
