// src/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  // حاول تأخذ التوكن من الهيدر Authorization
  let token = null;
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    // إذا ما في هيدر، خذ التوكن من query param
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
