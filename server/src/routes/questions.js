const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireTeacher } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticate, requireTeacher);

router.get('/', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { createdBy: req.user.id }
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, topic, difficulty, negativeMarks } = req.body;
    const question = await prisma.question.create({
      data: {
        questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, topic, difficulty, negativeMarks,
        createdBy: req.user.id
      }
    });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, topic, difficulty, negativeMarks } = req.body;
    
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question || question.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.question.update({
      where: { id },
      data: { questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, topic, difficulty, negativeMarks }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question || question.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.question.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;
