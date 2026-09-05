require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const testRoutes = require('./routes/tests');
const attemptRoutes = require('./routes/attempts');
const analyticsRoutes = require('./routes/analytics');
const milestoneRoutes = require('./routes/milestones');
const youtubeRoutes = require('./routes/youtube');

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Export io for use in controllers
app.set('io', io);
app.set('prisma', prisma);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/youtube', youtubeRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io - Tab Switch Detection
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('join-attempt', (attemptId) => {
    socket.join(`attempt-${attemptId}`);
    socket.data.attemptId = attemptId;
  });

  socket.on('leave-attempt', (attemptId) => {
    if (attemptId) {
      socket.leave(`attempt-${attemptId}`);
    }
  });
  
  socket.on('tab-switch', async (data) => {
    const { attemptId, studentId } = data || {};
    if (!attemptId || !studentId) return;

    try {
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
        include: { test: true }
      });
      
      // If attempt is null, or already completed/disqualified, ignore any tab-switch signals
      if (!attempt || attempt.status !== 'IN_PROGRESS') return;
      if (attempt.studentId !== studentId) return;
      
      const warningsAllowed = attempt.test?.warningsAllowed ?? 1;
      
      if (!attempt.warningGiven && warningsAllowed > 0) {
        // Give warning
        await prisma.testAttempt.update({
          where: { id: attemptId },
          data: { tabSwitchCount: { increment: 1 }, warningGiven: true }
        });
        socket.emit('tab-warning', { message: 'Warning: Tab switching detected! Next violation will disqualify you.' });
      } else {
        // Disqualify
        await prisma.testAttempt.update({
          where: { id: attemptId },
          data: {
            status: 'DISQUALIFIED',
            tabSwitchCount: { increment: 1 },
            disqualifiedAt: new Date(),
            submittedAt: new Date(),
            disqualReason: 'Tab switching detected'
          }
        });
        socket.emit('disqualified', { message: 'You have been disqualified for switching tabs.' });
      }
    } catch (err) {
      console.error('Tab switch error:', err);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Serve static React frontend in production or if build exists
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    // Don't rewrite requests for static asset files that have an extension
    if (path.extname(req.path)) {
      return res.status(404).end();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Seed default milestones if none exist
async function seedMilestones() {
  try {
    const count = await prisma.milestone.count();
    if (count === 0) {
      await prisma.milestone.createMany({
        data: [
          { title: 'Starter', description: 'Complete your first test', requiredTestsCount: 1, badgeName: 'First Steps', badgeIcon: '🌱', minAverageScore: 0 },
          { title: 'Consistent', description: 'Complete 5 tests', requiredTestsCount: 5, badgeName: 'On a Roll', badgeIcon: '⭐', minAverageScore: 0 },
          { title: 'Scholar', description: 'Complete 10 tests with average score ≥ 70%', requiredTestsCount: 10, badgeName: 'Top Scholar', badgeIcon: '🎓', minAverageScore: 70 },
          { title: 'Champion', description: 'Complete 20 tests with average score ≥ 80%', requiredTestsCount: 20, badgeName: 'Champion', badgeIcon: '🏆', minAverageScore: 80 },
        ]
      });
      console.log('✅ Default milestones seeded');
    }
  } catch (err) {
    console.error('Milestone seeding error:', err.message);
  }
}

const { seedDefaultData } = require('./services/seedData');

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await seedMilestones();
  await seedDefaultData(prisma);
});
