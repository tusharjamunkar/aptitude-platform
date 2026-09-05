const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireStudent, requireTeacher } = require('../middleware/auth');
const { calculateTopicPerformance, calculateWeakTopics } = require('../services/analyticsService');

const prisma = new PrismaClient();

router.use(authenticate);

router.get('/student', requireStudent, async (req, res) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId: req.user.id },
      include: { test: true, answers: { include: { question: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.status === 'COMPLETED');
    const totalCompleted = completedAttempts.length;
    const totalDisqualified = attempts.filter(a => a.status === 'DISQUALIFIED').length;
    
    let totalScore = 0;
    let totalPossible = 0;
    
    const testHistory = attempts.map(a => {
      const percentage = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (a.status === 'COMPLETED') {
        totalScore += a.score;
        totalPossible += a.totalMarks;
      }
      return {
        id: a.id,
        testId: a.testId,
        testTitle: a.test.title,
        topic: a.test.topic,
        attemptNumber: a.attemptNumber || 1,
        score: a.score,
        totalMarks: a.totalMarks,
        percentage,
        date: a.createdAt,
        submittedAt: a.submittedAt,
        status: a.status
      };
    });

    // Calculate improvement delta for tests that have multiple attempts
    // Group completed attempts by testId sorted chronologically
    const attemptsByTest = {};
    [...completedAttempts].reverse().forEach(a => {
      if (!attemptsByTest[a.testId]) attemptsByTest[a.testId] = [];
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      attemptsByTest[a.testId].push(pct);
    });

    const testImprovements = {};
    for (const [tId, scores] of Object.entries(attemptsByTest)) {
      if (scores.length >= 2) {
        const first = scores[0];
        const latest = scores[scores.length - 1];
        testImprovements[tId] = {
          firstScore: first,
          latestScore: latest,
          delta: latest - first
        };
      }
    }

    const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    
    const allAnswers = attempts.flatMap(a => a.answers);
    const topicPerformance = calculateTopicPerformance(allAnswers);
    
    // Sort weak topics ascending by avgPercentage so the weakest topic comes first
    const weakTopicObjs = calculateWeakTopics(topicPerformance).sort((a, b) => a.avgPercentage - b.avgPercentage);
    const weakTopics = weakTopicObjs.map(t => t.topic);
    const strongTopics = topicPerformance.filter(t => t.avgPercentage >= 80).map(t => t.topic);

    res.json({
      totalAttempts,
      totalCompleted,
      totalDisqualified,
      averageScore,
      testHistory,
      testImprovements,
      topicPerformance,
      weakTopics,
      weakTopicDetails: weakTopicObjs,
      strongTopics,
      recentTests: testHistory.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student analytics' });
  }
});

router.get('/teacher', requireTeacher, async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { createdBy: req.user.id },
      include: { attempts: { include: { answers: { include: { question: true } } } } }
    });

    let totalStudents = new Set();
    let classTotalScore = 0;
    let classTotalMarks = 0;

    const testBreakdown = tests.map(test => {
      const testAttempts = test.attempts.filter(a => a.status === 'COMPLETED');
      const disqualified = test.attempts.filter(a => a.status === 'DISQUALIFIED');
      
      let testTotalScore = 0;
      let testTotalMarks = 0;
      let passes = 0;

      testAttempts.forEach(a => {
        totalStudents.add(a.studentId);
        testTotalScore += a.score;
        testTotalMarks += a.totalMarks;
        classTotalScore += a.score;
        classTotalMarks += a.totalMarks;
        if (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.5) passes++;
      });

      const avgScore = testTotalMarks > 0 ? (testTotalScore / testTotalMarks) * 100 : 0;
      const passRate = testAttempts.length > 0 ? (passes / testAttempts.length) * 100 : 0;

      return {
        testId: test.id, title: test.title, totalAttempts: testAttempts.length,
        avgScore, passRate, disqualifiedCount: disqualified.length
      };
    });

    const averageClassScore = classTotalMarks > 0 ? (classTotalScore / classTotalMarks) * 100 : 0;

    res.json({
      totalStudents: totalStudents.size,
      totalTests: tests.length,
      averageClassScore,
      testBreakdown,
      topPerformers: [], 
      atRiskStudents: [], 
      topicWeakness: []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher analytics' });
  }
});

module.exports = router;
