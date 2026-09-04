const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticate);

router.post('/', async (req, res) => {
  try {
    const { testId } = req.body;
    const test = await prisma.test.findUnique({ 
      where: { id: testId },
      include: { questions: true }
    });
    
    if (!test || !test.isActive) return res.status(400).json({ error: 'Test not available' });
    if (test.deadline && new Date() > new Date(test.deadline)) return res.status(400).json({ error: 'Test deadline passed' });
    
    const existing = await prisma.testAttempt.findFirst({
      where: { testId, studentId: req.user.id, status: { in: ['COMPLETED', 'DISQUALIFIED'] } }
    });
    if (existing) return res.status(400).json({ error: 'Test already completed' });

    let attempt = await prisma.testAttempt.findFirst({
      where: { testId, studentId: req.user.id, status: 'IN_PROGRESS' }
    });

    if (!attempt) {
      attempt = await prisma.testAttempt.create({
        data: { studentId: req.user.id, testId }
      });
      
      const answerData = test.questions.map(q => ({
        attemptId: attempt.id,
        questionId: q.id
      }));
      await prisma.studentAnswer.createMany({ data: answerData });
    }

    const answers = await prisma.studentAnswer.findMany({
      where: { attemptId: attempt.id },
      include: { 
        question: {
          select: { id: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true, negativeMarks: true }
        }
      }
    });

    // Include test details for timer calculation (duration)
    const attemptWithTest = await prisma.testAttempt.findUnique({
      where: { id: attempt.id },
      include: { test: { select: { id: true, title: true, duration: true } } }
    });

    res.json({ attempt: attemptWithTest, answers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start attempt' });
  }
});

router.put('/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedAnswer } = req.body;

    const attempt = await prisma.testAttempt.findUnique({ where: { id } });
    if (!attempt || attempt.studentId !== req.user.id || attempt.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Cannot modify this attempt' });
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = selectedAnswer === question.correctAnswer;

    await prisma.studentAnswer.update({
      where: { attemptId_questionId: { attemptId: id, questionId } },
      data: { selectedAnswer, isCorrect }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: { answers: { include: { question: true } }, test: true }
    });

    if (!attempt || attempt.studentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Attempt already submitted' });

    let score = 0;
    let totalMarks = 0;

    for (const ans of attempt.answers) {
      totalMarks += ans.question.marks;
      if (ans.selectedAnswer === ans.question.correctAnswer) {
        score += ans.question.marks;
      } else if (ans.selectedAnswer) {
        score -= ans.question.negativeMarks;
      }
    }

    const updated = await prisma.testAttempt.update({
      where: { id },
      data: { status: 'COMPLETED', submittedAt: new Date(), score, totalMarks }
    });
    
    // Update milestones
    const studentTestsCount = await prisma.testAttempt.count({
      where: { studentId: req.user.id, status: 'COMPLETED' }
    });

    const milestones = await prisma.milestone.findMany();
    for (const ms of milestones) {
      if (studentTestsCount >= ms.requiredTestsCount) {
        await prisma.studentMilestone.upsert({
          where: { studentId_milestoneId: { studentId: req.user.id, milestoneId: ms.id } },
          update: { testsCompleted: studentTestsCount, isAchieved: true, achievedAt: new Date() },
          create: { studentId: req.user.id, milestoneId: ms.id, testsCompleted: studentTestsCount, isAchieved: true, achievedAt: new Date() }
        });
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
});

router.get('/', async (req, res) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId: req.user.id },
      include: { test: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: { 
        test: true,
        answers: { include: { question: true } }
      }
    });

    if (!attempt || attempt.studentId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Attempt still in progress' });

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempt details' });
  }
});

module.exports = router;
