const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, requireStudent } = require('../middleware/auth');

const prisma = new PrismaClient();

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
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { score: 'desc' }
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
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate test' });
  }
});

// Student routes
router.get('/available', authenticate, requireStudent, async (req, res) => {
  try {
    const now = new Date();
    const tests = await prisma.test.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
          { OR: [{ deadline: null }, { deadline: { gte: now } }] },
        ],
        attempts: { none: { studentId: req.user.id, status: { in: ['COMPLETED', 'DISQUALIFIED'] } } }
      },
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tests);
  } catch (err) {
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
