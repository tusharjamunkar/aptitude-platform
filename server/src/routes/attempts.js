const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticate);

router.post('/', async (req, res) => {
  try {
    const { testId, isRetake } = req.body;
    if (!testId) {
      return res.status(400).json({ error: 'Assessment ID is required' });
    }

    let test = await prisma.test.findUnique({ 
      where: { id: testId },
      include: { questions: true }
    });

    // Check if testId was actually an attemptId passed directly in the URL
    if (!test) {
      const existingAttempt = await prisma.testAttempt.findUnique({
        where: { id: testId },
        include: { test: { include: { questions: true } } }
      });
      if (existingAttempt) {
        test = existingAttempt.test;
      }
    }
    
    // Legitimate 404 for non-existent assessment URLs
    if (!test) {
      return res.status(404).json({ error: 'Assessment not found. This test link does not exist or has been removed.' });
    }

    if (!test.isActive) {
      return res.status(403).json({ error: 'This assessment is currently inactive and not available for taking.' });
    }

    if (test.deadline && new Date() > new Date(test.deadline)) {
      return res.status(403).json({ error: 'The deadline for this assessment has passed.' });
    }

    // 1. Check if there is an in-progress attempt for this student & test
    let attempt = await prisma.testAttempt.findFirst({
      where: { testId: test.id, studentId: req.user.id, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Prevent duplicate attempt creation on refresh if already submitted and not explicitly retaking
    if (!attempt && !isRetake) {
      const completedAttempt = await prisma.testAttempt.findFirst({
        where: { testId: test.id, studentId: req.user.id, status: 'COMPLETED' },
        orderBy: { submittedAt: 'desc' }
      });

      if (completedAttempt) {
        const answers = await prisma.studentAnswer.findMany({
          where: { attemptId: completedAttempt.id },
          include: { 
            question: {
              select: { id: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true, negativeMarks: true, topic: true, sourceExam: true }
            }
          }
        });

        const attemptWithTest = await prisma.testAttempt.findUnique({
          where: { id: completedAttempt.id },
          include: { test: { select: { id: true, title: true, duration: true } } }
        });

        return res.json({ 
          attempt: attemptWithTest, 
          answers, 
          isAlreadyCompleted: true 
        });
      }
    }

    // 3. If no in-progress attempt, create a new attempt
    if (!attempt) {
      // Calculate attempt number
      const previousAttemptsCount = await prisma.testAttempt.count({
        where: { testId: test.id, studentId: req.user.id }
      });
      const nextAttemptNumber = previousAttemptsCount + 1;

      attempt = await prisma.testAttempt.create({
        data: {
          studentId: req.user.id,
          testId: test.id,
          attemptNumber: nextAttemptNumber,
          startedAt: new Date()
        }
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
          select: { id: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true, negativeMarks: true, topic: true, sourceExam: true }
        }
      }
    });

    // Include test details for timer calculation (duration)
    const attemptWithTest = await prisma.testAttempt.findUnique({
      where: { id: attempt.id },
      include: { test: { select: { id: true, title: true, duration: true } } }
    });

    res.json({ attempt: attemptWithTest, answers, isAlreadyCompleted: false });
  } catch (err) {
    console.error('Failed to start or resume attempt:', err);
    res.status(500).json({ error: 'Failed to start or resume attempt' });
  }
});

router.put('/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedAnswer } = req.body;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: { test: true }
    });
    if (!attempt || attempt.studentId !== req.user.id || attempt.status !== 'IN_PROGRESS') {
      return res.status(403).json({ error: 'Cannot modify this attempt' });
    }

    // Backend time validation: ensure elapsed time has not exceeded allowed duration (+30s buffer)
    const durationMinutes = attempt.test?.duration || 45;
    const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
    const maxAllowedMs = (durationMinutes * 60 + 30) * 1000;
    if (elapsedMs > maxAllowedMs) {
      return res.status(400).json({ error: 'Time limit reached. Answers can no longer be updated.' });
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
    
    // Calculate topic-wise breakdown for this attempt
    const topicStats = {};
    for (const ans of attempt.answers) {
      const top = ans.question.topic || 'General';
      if (!topicStats[top]) {
        topicStats[top] = { total: 0, correct: 0, incorrect: 0, marksObtained: 0, maxMarks: 0 };
      }
      topicStats[top].total++;
      topicStats[top].maxMarks += ans.question.marks;
      if (ans.selectedAnswer === ans.question.correctAnswer) {
        topicStats[top].correct++;
        topicStats[top].marksObtained += ans.question.marks;
      } else {
        topicStats[top].incorrect++;
        if (ans.selectedAnswer) {
          topicStats[top].marksObtained -= ans.question.negativeMarks;
        }
      }
    }

    const attemptTopicPerformance = Object.entries(topicStats).map(([topic, stats]) => {
      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return {
        topic,
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        incorrectAnswers: stats.incorrect,
        percentage,
        isWeak: percentage < 60
      };
    }).sort((a, b) => a.percentage - b.percentage);

    const weakTopics = attemptTopicPerformance.filter(t => t.isWeak).map(t => t.topic);

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

    res.json({
      ...updated,
      topicPerformance: attemptTopicPerformance,
      weakTopics
    });
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
