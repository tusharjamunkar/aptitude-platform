const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

const generateToken = (user) => jwt.sign(
  {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    studyYear: user.studyYear,
    department: user.department,
    rollNumber: user.rollNumber
  },
  process.env.JWT_SECRET || 'aptitude-secret-jwt-key',
  { expiresIn: '7d' }
);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studyYear, department, rollNumber } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const normalizedRole = role ? role.toUpperCase() : 'STUDENT';
    if (!['TEACHER', 'STUDENT'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Role must be TEACHER or STUDENT' });
    }

    // Additional validations for student accounts
    if (normalizedRole === 'STUDENT') {
      if (!studyYear || !studyYear.trim()) {
        return res.status(400).json({ error: 'Study Year is required for students' });
      }
      if (!department || !department.trim()) {
        return res.status(400).json({ error: 'Department is required for students' });
      }
      if (!rollNumber || !rollNumber.trim()) {
        return res.status(400).json({ error: 'Roll Number is required for students' });
      }
    }
    
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        role: normalizedRole,
        studyYear: studyYear ? studyYear.trim() : null,
        department: department ? department.trim() : null,
        rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : null
      }
    });
    
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studyYear: user.studyYear,
        department: user.department,
        rollNumber: user.rollNumber
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studyYear: user.studyYear,
        department: user.department,
        rollNumber: user.rollNumber
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studyYear: true,
        department: true,
        rollNumber: true,
        createdAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
