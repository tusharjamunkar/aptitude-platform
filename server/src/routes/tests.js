const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, requireStudent } = require('../middleware/auth');

const prisma = new PrismaClient();

// In-memory test cache with TTL to protect database pool from concurrency spikes
let cachedActiveTests = null;
let cachedActiveTestsTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

function invalidateTestCache() {
  cachedActiveTests = null;
  cachedActiveTestsTime = 0;
}

// Teacher routes
router.get('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { createdBy: req.user.id },
      include: {
        _count: { select: { questions: true, attempts: true } }
      }
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

router.post('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const { title, subject, topic, description, duration, scheduledAt, deadline, isMandatory, warningsAllowed, questionIds, milestoneId } = req.body;
    
    const test = await prisma.test.create({
      data: {
        title, subject, topic, description, duration, 
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null, 
        deadline: deadline ? new Date(deadline) : null,
        isMandatory, warningsAllowed, createdBy: req.user.id, milestoneId,
        questions: { connect: (questionIds || []).map(id => ({ id })) }
      }
    });
    invalidateTestCache();
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create test' });
  }
});

router.put('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, topic, description, duration, scheduledAt, deadline, isMandatory, warningsAllowed, questionIds, milestoneId } = req.body;
    
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test || test.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.test.update({
      where: { id },
      data: {
        title, subject, topic, description, duration, 
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null, 
        deadline: deadline ? new Date(deadline) : null,
        isMandatory, warningsAllowed, milestoneId,
        questions: { set: (questionIds || []).map(qId => ({ id: qId })) }
      }
    });
    invalidateTestCache();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

router.delete('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test || test.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.test.delete({ where: { id } });
    invalidateTestCache();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

router.get('/:id/results', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await prisma.testAttempt.findMany({
      where: { testId: id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNumber: true,
            department: true,
            studyYear: true
          }
        },
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            topic: true,
            duration: true
          }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                topic: true,
                marks: true,
                correctAnswer: true
              }
            }
          }
        }
      },
      orderBy: [
        { studentId: 'asc' },
        { attemptNumber: 'asc' }
      ]
    });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.patch('/:id/activate', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test || test.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.test.update({
      where: { id },
      data: { isActive }
    });
    invalidateTestCache();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate test' });
  }
});

// Student routes
router.get('/available', authenticate, requireStudent, async (req, res) => {
  try {
    const now = new Date();
    const nowMs = Date.now();

    // 1. Fetch or reuse cached active test definitions (re-evaluates every 15s or on teacher mutation)
    if (!cachedActiveTests || (nowMs - cachedActiveTestsTime) > CACHE_TTL_MS) {
      cachedActiveTests = await prisma.test.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
            { OR: [{ deadline: null }, { deadline: { gte: now } }] },
          ]
        },
        include: { 
          _count: { select: { questions: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      cachedActiveTestsTime = nowMs;
    }

    if (!cachedActiveTests.length) {
      return res.json([]);
    }

    // 2. Fetch only the requesting student's attempts for these active tests (fast indexed lookup)
    const testIds = cachedActiveTests.map(t => t.id);
    const studentAttempts = await prisma.testAttempt.findMany({
      where: {
        studentId: req.user.id,
        testId: { in: testIds }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        testId: true,
        attemptNumber: true,
        score: true,
        totalMarks: true,
        status: true,
        createdAt: true
      }
    });

    // Group attempts by testId
    const attemptsByTestId = new Map();
    for (const att of studentAttempts) {
      if (!attemptsByTestId.has(att.testId)) {
        attemptsByTestId.set(att.testId, []);
      }
      attemptsByTestId.get(att.testId).push(att);
    }

    const merged = cachedActiveTests.map(test => ({
      ...test,
      attempts: attemptsByTestId.get(test.id) || []
    }));

    res.json(merged);
  } catch (err) {
    console.error('Available tests error:', err);
    res.status(500).json({ error: 'Failed to fetch available tests' });
  }
});

router.get('/upcoming', authenticate, requireStudent, async (req, res) => {
  try {
    const now = new Date();
    const tests = await prisma.test.findMany({
      where: { scheduledAt: { gt: now } },
      orderBy: { scheduledAt: 'asc' }
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming tests' });
  }
});

module.exports = router;
