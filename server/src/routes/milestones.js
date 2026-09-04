const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher, requireStudent } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticate);

router.post('/', requireTeacher, async (req, res) => {
  try {
    const { title, description, requiredTestsCount, badgeName, badgeIcon, minAverageScore } = req.body;
    const milestone = await prisma.milestone.create({
      data: { title, description, requiredTestsCount, badgeName, badgeIcon, minAverageScore }
    });
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

router.get('/', async (req, res) => {
  try {
    const milestones = await prisma.milestone.findMany();
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

router.delete('/:id', requireTeacher, async (req, res) => {
  try {
    await prisma.milestone.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

router.get('/my-progress', requireStudent, async (req, res) => {
  try {
    const allMilestones = await prisma.milestone.findMany();
    const studentMilestones = await prisma.studentMilestone.findMany({
      where: { studentId: req.user.id }
    });

    const progress = allMilestones.map(ms => {
      const sm = studentMilestones.find(s => s.milestoneId === ms.id);
      return {
        ...ms,
        testsCompleted: sm ? sm.testsCompleted : 0,
        isAchieved: sm ? sm.isAchieved : false,
        achievedAt: sm ? sm.achievedAt : null,
        progressPercentage: sm ? Math.min((sm.testsCompleted / ms.requiredTestsCount) * 100, 100) : 0
      };
    });

    res.json({ milestones: progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Init default milestones
async function initMilestones() {
  const count = await prisma.milestone.count();
  if (count === 0) {
    await prisma.milestone.createMany({
      data: [
        { title: 'Starter', description: 'Complete 1 test', requiredTestsCount: 1, badgeName: 'Starter', badgeIcon: '🌱' },
        { title: 'Consistent', description: 'Complete 5 tests', requiredTestsCount: 5, badgeName: 'Consistent', badgeIcon: '⭐' },
        { title: 'Scholar', description: 'Complete 10 tests', requiredTestsCount: 10, badgeName: 'Scholar', badgeIcon: '🎓' },
        { title: 'Champion', description: 'Complete 20 tests', requiredTestsCount: 20, badgeName: 'Champion', badgeIcon: '🏆' }
      ]
    });
  }
}
setTimeout(initMilestones, 5000);

module.exports = router;
