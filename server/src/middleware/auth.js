const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aptitude-secret-jwt-key';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

const requireTeacher = (req, res, next) => {
  if (!req.user || req.user.role?.toUpperCase() !== 'TEACHER') {
    return res.status(403).json({ error: 'Access restricted to instructors only.' });
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role?.toUpperCase() !== 'STUDENT') {
    return res.status(403).json({ error: 'Access restricted to students only.' });
  }
  next();
};

module.exports = { authenticate, requireTeacher, requireStudent };
