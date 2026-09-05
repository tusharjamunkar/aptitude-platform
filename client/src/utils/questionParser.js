/**
 * questionParser.js
 * Robust parser for Bulk Question Entry.
 * 
 * Supports:
 * 1. Numbered questions: 1. / 1) / Q1. / Question 1: / Q.1
 * 2. Options: A) / A. / (A) / [A] / a) / a. / 1) / 1.
 * 3. Answers: Answer: B / Ans: B / Correct Answer: (B) / Ans - C / **Answer:** B
 * 4. Markdown formatted AI text: **1. What is...** - A) ... **Answer: B**
 * 5. Questions WITHOUT answers (e.g. from textbooks) -> marked as needing answer selection
 * 6. Questions WITHOUT options -> marked as needing options
 * 7. Common metadata override (Topic, Difficulty, Marks, Source)
 */

export function parseBulkQuestions(rawText, defaultMetadata = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { questions: [], rawCount: 0, validCount: 0, attentionCount: 0 };
  }

  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ');

  const lines = normalized.split('\n');

  // Matches 1., 1), 1:, Q1., Q1:, Q.1, Question 1:, Question 1., **1.**, **Q1.**
  const questionStartRegex = /^\s*(?:\*\*)?(?:Q(?:uestion)?\.?\s*(\d+)|\b(\d+)\b)[\.\:\)\-]\s*(?:\*\*)?\s*(.*)$/i;

  // Option regex: matches A), A., (A), [A], A -, - A), a., a)
  const optionRegex = /^\s*(?:[\*\-\•]\s*)?(?:\*\*)?(?:[\(\[]?([A-Da-d])[\.\)\]\:\-]|(?:\b([1-4])[\.\)\]]))(?:\*\*)?\s*(.*)$/;

  // Answer regex: matches Answer: A, Ans: B, Correct Answer: C, Ans - D, **Answer:** A
  const answerRegex = /(?:\*\*)?(?:Correct\s*)?(?:Answer|Ans)\s*(?:is|\:|\-)?\s*(?:\*\*)?\s*[\(\[]?([A-Da-d1-4])[\)\]\.\s]?/i;

  const rawChunks = [];
  let currentChunk = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const qMatch = line.match(questionStartRegex);

    if (qMatch) {
      if (currentChunk && currentChunk.lines.length > 0) {
        rawChunks.push(currentChunk);
      }
      currentChunk = {
        number: qMatch[1] || qMatch[2] || (rawChunks.length + 1).toString(),
        firstLineContent: qMatch[3] || '',
        lines: [line]
      };
    } else if (currentChunk) {
      currentChunk.lines.push(line);
    } else if (trimmed.length > 0) {
      if (!currentChunk && trimmed.length > 0) {
        currentChunk = {
          number: '1',
          firstLineContent: trimmed,
          lines: [line]
        };
      }
    }
  }

  if (currentChunk && currentChunk.lines.length > 0) {
    rawChunks.push(currentChunk);
  }

  let parsedChunks = rawChunks;
  if (parsedChunks.length <= 1 && normalized.includes('\n\n')) {
    const blocks = normalized.split(/\n\s*\n+/).filter(b => b.trim().length > 0);
    if (blocks.length > 1) {
      parsedChunks = blocks.map((blk, idx) => ({
        number: (idx + 1).toString(),
        firstLineContent: blk.split('\n')[0],
        lines: blk.split('\n')
      }));
    }
  }

  const parsedQuestions = [];

  parsedChunks.forEach((chunk, index) => {
    const chunkLines = chunk.lines;
    let questionTextLines = [];
    let options = { A: '', B: '', C: '', D: '' };
    let correctAnswer = null;
    let readingOptions = false;
    let lastOptionLetter = null;

    for (let j = 0; j < chunkLines.length; j++) {
      let rawLine = chunkLines[j];
      let line = rawLine.trim();

      if (!line) continue;

      const ansMatch = line.match(answerRegex);
      if (ansMatch) {
        let matchedVal = ansMatch[1].toUpperCase();
        if (matchedVal === '1') matchedVal = 'A';
        else if (matchedVal === '2') matchedVal = 'B';
        else if (matchedVal === '3') matchedVal = 'C';
        else if (matchedVal === '4') matchedVal = 'D';

        if (['A', 'B', 'C', 'D'].includes(matchedVal)) {
          correctAnswer = matchedVal;
        }
        continue;
      }

      const cleanedOptionCandidate = line.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '').trim();
      const optMatch = cleanedOptionCandidate.match(optionRegex);

      if (optMatch) {
        readingOptions = true;
        let letter = (optMatch[1] || '').toUpperCase();
        let numIndex = optMatch[2];

        if (numIndex) {
          letter = numIndex === '1' ? 'A' : numIndex === '2' ? 'B' : numIndex === '3' ? 'C' : 'D';
        }

        if (['A', 'B', 'C', 'D'].includes(letter)) {
          lastOptionLetter = letter;
          options[letter] = (optMatch[3] || '').replace(/\*\*/g, '').trim();
          continue;
        }
      }

      if (readingOptions && lastOptionLetter) {
        options[lastOptionLetter] += ' ' + line.replace(/\*\*/g, '').trim();
      } else {
        if (j === 0) {
          const stripped = line.replace(/^\s*(?:\*\*)?(?:Q(?:uestion)?\.?\s*\d+|\b\d+\b)[\.\:\)\-]\s*(?:\*\*)?\s*/i, '');
          questionTextLines.push(stripped.replace(/\*\*/g, '').trim());
        } else {
          questionTextLines.push(line.replace(/\*\*/g, '').trim());
        }
      }
    }

    const questionText = questionTextLines.join(' ').replace(/\s+/g, ' ').trim();

    const hasOptions = options.A && options.B;
    const hasAllOptions = options.A && options.B && options.C && options.D;
    const hasAnswer = Boolean(correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer));

    const needsAttention = !hasAllOptions || !hasAnswer || !questionText;

    const issues = [];
    if (!questionText) issues.push('Missing question text');
    if (!hasOptions) issues.push('Missing options');
    else if (!hasAllOptions) issues.push('Only ' + Object.values(options).filter(Boolean).length + ' options found');
    if (!hasAnswer) issues.push('Correct answer not provided (select one)');

    parsedQuestions.push({
      id: 'bulk_' + Date.now() + '_' + index,
      displayIndex: index + 1,
      originalNumber: chunk.number,
      questionText: questionText || '',
      optionA: options.A || '',
      optionB: options.B || '',
      optionC: options.C || '',
      optionD: options.D || '',
      correctAnswer: correctAnswer || '',
      marks: Number(defaultMetadata.marks) || 1,
      negativeMarks: Number(defaultMetadata.negativeMarks) || 0,
      topic: defaultMetadata.topic || 'Number System',
      difficulty: (defaultMetadata.difficulty || 'MEDIUM').toUpperCase(),
      sourceExam: defaultMetadata.sourceExam || '',
      needsAttention,
      issues
    });
  });

  const validCount = parsedQuestions.filter(q => !q.needsAttention).length;
  const attentionCount = parsedQuestions.filter(q => q.needsAttention).length;

  return {
    questions: parsedQuestions,
    rawCount: parsedQuestions.length,
    validCount,
    attentionCount
  };
}
