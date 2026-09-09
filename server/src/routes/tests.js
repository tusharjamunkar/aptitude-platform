const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, requireStudent } = require('../middleware/auth');

const prisma = new PrismaClient();

// Ensure isDeleted column exists in PostgreSQL
prisma.$executeRawUnsafe('ALTER TABLE "Test" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;').catch(() => {});

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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Return all institutional tests for teachers, excluding deleted ones
    const tests = await prisma.test.findMany({
      where: {
        isDeleted: false
      },
      include: {
        _count: { select: { questions: true, attempts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

router.post('/', authenticate, requireTeacher, async (req, res) => {
  try {
    const { 
      title, 
      subject, 
      topic, 
      description, 
      duration, 
      scheduledAt, 
      deadline, 
      isMandatory, 
      warningsAllowed, 
      questionIds, 
      milestoneId,
      isActive 
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Assessment title is required' });
    }
    
    // Newly created tests are ACTIVE immediately by default unless explicitly set to false
    const initialActiveState = isActive !== undefined ? Boolean(isActive) : true;

    const test = await prisma.test.create({
      data: {
        title: title.trim(), 
        subject: subject ? subject.trim() : 'Quantitative & Logical Aptitude', 
        topic: topic ? topic.trim() : 'Comprehensive Assessment', 
        description: description ? description.trim() : null, 
        duration: parseInt(duration) || 45, 
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null, 
        deadline: deadline ? new Date(deadline) : null,
        isActive: initialActiveState,
        isMandatory: isMandatory ?? true, 
        warningsAllowed: warningsAllowed !== undefined ? parseInt(warningsAllowed) : 1, 
        createdBy: req.user.id, 
        milestoneId,
        questions: { connect: (questionIds || []).map(id => ({ id })) }
      },
      include: {
        _count: { select: { questions: true, attempts: true } },
        questions: {
          select: {
            id: true,
            questionText: true,
            marks: true,
            topic: true,
            difficulty: true,
            sourceExam: true
          }
        }
      }
    });

    invalidateTestCache();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(201).json(test);
  } catch (err) {
    console.error('Failed to create test:', err);
    res.status(500).json({ error: 'Failed to create test: ' + (err.message || 'Database error') });
  }
});

router.put('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      subject, 
      topic, 
      description, 
      duration, 
      scheduledAt, 
      deadline, 
      isMandatory, 
      warningsAllowed, 
      questionIds, 
      milestoneId,
      isActive 
    } = req.body;
    
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) {
      return res.status(404).json({ error: `Assessment not found with ID ${id}` });
    }
    if (test.createdBy !== req.user.id && req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this assessment' });
    }

    const updated = await prisma.test.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : test.title, 
        subject: subject !== undefined ? subject.trim() : test.subject, 
        topic: topic !== undefined ? topic.trim() : test.topic, 
        description: description !== undefined ? description.trim() : test.description, 
        duration: duration !== undefined ? parseInt(duration) : test.duration, 
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null, 
        deadline: deadline ? new Date(deadline) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : test.isActive,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : test.isMandatory, 
        warningsAllowed: warningsAllowed !== undefined ? parseInt(warningsAllowed) : test.warningsAllowed, 
        milestoneId: milestoneId !== undefined ? milestoneId : test.milestoneId,
        questions: questionIds ? { set: questionIds.map(qId => ({ id: qId })) } : undefined
      },
      include: {
        _count: { select: { questions: true, attempts: true } },
        questions: {
          select: {
            id: true,
            questionText: true,
            marks: true,
            topic: true,
            difficulty: true,
            sourceExam: true
          }
        }
      }
    });

    invalidateTestCache();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(updated);
  } catch (err) {
    console.error('Failed to update test:', err);
    res.status(500).json({ error: 'Failed to update test: ' + (err.message || 'Server error') });
  }
});

// Get single test with questions for editing (teacher only)
router.get('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            marks: true,
            topic: true,
            difficulty: true,
            sourceExam: true
          }
        },
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: `Assessment not found with ID: ${id}` });
    }

    if (test.createdBy !== req.user.id && req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view or edit this assessment' });
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(test);
  } catch (err) {
    console.error('Failed to fetch test details:', err);
    res.status(500).json({ error: 'Failed to fetch test details: ' + (err.message || 'Internal server error') });
  }
});

router.delete('/:id', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        _count: { select: { attempts: true } }
      }
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (test.createdBy !== req.user.id && req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const attemptCount = test._count?.attempts || 0;

    if (attemptCount > 0) {
      // Students have completed/attempted this test!
      // In order to preserve students' test history, marks, and topic analytics,
      // mark the test as deleted and inactive so it disappears from the teacher's dashboard
      // and cannot be started by new candidates, while students can permanently inspect their performance.
      await prisma.test.update({
        where: { id },
        data: {
          isDeleted: true,
          isActive: false
        }
      });
    } else {
      // No student has attempted this test yet; purge completely
      await prisma.test.update({
        where: { id },
        data: { questions: { set: [] } }
      }).catch(() => {});
      await prisma.test.delete({
        where: { id }
      });
    }

    invalidateTestCache();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Failed to delete test:', err);
    res.status(500).json({ error: err.message || 'Failed to delete test' });
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
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (test.createdBy !== req.user.id && req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.test.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
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
          isDeleted: false,
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
