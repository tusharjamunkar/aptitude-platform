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

// GET /api/analytics/teacher/students - Complete student directory with filters
router.get('/teacher/students', requireTeacher, async (req, res) => {
  try {
    const { year, branch, search } = req.query;

    const whereClause = {
      role: 'STUDENT'
    };

    if (year && year !== 'All' && year !== 'All Years') {
      whereClause.studyYear = year;
    }

    if (branch && branch !== 'All' && branch !== 'All Branches') {
      whereClause.department = branch;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { rollNumber: { contains: q, mode: 'insensitive' } }
      ];
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        studyYear: true,
        department: true,
        createdAt: true,
        attempts: {
          select: {
            id: true,
            score: true,
            totalMarks: true,
            status: true,
            submittedAt: true,
            createdAt: true,
            test: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { studyYear: 'asc' },
        { department: 'asc' },
        { rollNumber: 'asc' }
      ]
    });

    // Compute student attempt performance summaries
    const studentList = students.map(student => {
      const completed = student.attempts.filter(a => a.status === 'COMPLETED');
      let totalScore = 0;
      let totalMarks = 0;

      completed.forEach(a => {
        totalScore += a.score;
        totalMarks += a.totalMarks;
      });

      const avgScore = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : null;
      const latestAttempt = student.attempts[0] || null;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber || 'N/A',
        studyYear: student.studyYear || 'Unspecified',
        department: student.department || 'General',
        createdAt: student.createdAt,
        totalAttempts: student.attempts.length,
        completedTests: completed.length,
        averageScore: avgScore,
        latestActivity: latestAttempt ? (latestAttempt.submittedAt || latestAttempt.createdAt) : null
      };
    });

    // Also compute distinct available years and branches across all students for dropdown options
    const allStudentYears = await prisma.user.findMany({
      where: { role: 'STUDENT', studyYear: { not: null } },
      select: { studyYear: true },
      distinct: ['studyYear']
    });

    const allStudentBranches = await prisma.user.findMany({
      where: { role: 'STUDENT', department: { not: null } },
      select: { department: true },
      distinct: ['department']
    });

    const availableYears = allStudentYears.map(s => s.studyYear).filter(Boolean);
    const availableBranches = allStudentBranches.map(s => s.department).filter(Boolean);

    res.json({
      students: studentList,
      totalCount: studentList.length,
      availableYears,
      availableBranches
    });
  } catch (err) {
    console.error('Error fetching teacher students directory:', err);
    res.status(500).json({ error: 'Failed to fetch student directory' });
  }
});

module.exports = router;
