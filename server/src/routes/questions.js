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

// POST /api/questions/bulk - Bulk add questions with duplicate detection
router.post('/bulk', async (req, res) => {
  try {
    const { questions, skipDuplicates = true, commonMetadata = {} } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required and cannot be empty' });
    }

    // Fetch teacher's existing questions to check duplicates
    const existingQuestions = await prisma.question.findMany({
      where: { createdBy: req.user.id },
      select: { id: true, questionText: true }
    });

    const normalizeText = (t) => (t || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const existingMap = new Map();
    existingQuestions.forEach(q => {
      existingMap.set(normalizeText(q.questionText), q.id);
    });

    const toInsert = [];
    const duplicates = [];
    const seenInBatch = new Set();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const normText = normalizeText(q.questionText);

      if (!normText) continue;

      const isDuplicate = existingMap.has(normText) || seenInBatch.has(normText);

      if (isDuplicate) {
        duplicates.push({
          index: i,
          questionText: q.questionText,
          existingId: existingMap.get(normText) || null
        });

        if (skipDuplicates) {
          continue;
        }
      }

      seenInBatch.add(normText);

      toInsert.push({
        questionText: q.questionText.trim(),
        optionA: (q.optionA || '').trim(),
        optionB: (q.optionB || '').trim(),
        optionC: (q.optionC || '').trim(),
        optionD: (q.optionD || '').trim(),
        correctAnswer: (q.correctAnswer || 'A').toUpperCase().trim(),
        marks: Number(q.marks) || Number(commonMetadata.marks) || 1,
        negativeMarks: Number(q.negativeMarks) || Number(commonMetadata.negativeMarks) || 0,
        topic: q.topic || commonMetadata.topic || 'Number System',
        difficulty: (q.difficulty || commonMetadata.difficulty || 'MEDIUM').toUpperCase(),
        sourceExam: q.sourceExam || commonMetadata.sourceExam || null,
        createdBy: req.user.id
      });
    }

    let createdCount = 0;
    if (toInsert.length > 0) {
      const result = await prisma.question.createMany({
        data: toInsert
      });
      createdCount = result.count;
    }

    res.status(201).json({
      message: `Successfully processed ${questions.length} questions. Added ${createdCount} new questions.`,
      addedCount: createdCount,
      skippedCount: duplicates.length && skipDuplicates ? duplicates.length : 0,
      duplicatesDetected: duplicates.length,
      duplicates
    });
  } catch (err) {
    console.error('Bulk question creation error:', err);
    res.status(500).json({ error: 'Failed to bulk create questions: ' + err.message });
  }
});

module.exports = router;

