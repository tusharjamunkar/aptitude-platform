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
    .replace(/\u00A0/g, ' ')
    .trim();

  if (!normalized) {
    return { questions: [], rawCount: 0, validCount: 0, attentionCount: 0 };
  }

  // Extract global answer key at bottom if present (e.g. Answers: 1. A, 2. B, ...)
  const { cleanedText, globalAnswers } = extractGlobalAnswerKey(normalized);

  const lines = cleanedText.split('\n');

  // Matches 1., 1), 1:, 1-, (1), [1], Q1., Q1:, Q.1, Q 1, Question 1:, Question 1., Question #1:
  // With optional markdown like **1.**, **Question 1:**, ### Question 1, ## 1.
  const questionStartRegex = /^(?:#{1,4}\s*)?(?:\*\*)?(?:(?:Q(?:uestion)?\.?\s*#?\s*(\d+)|\b(\d+)\b)[\.\:\)\-\]]|\((?:Q(?:uestion)?\.?\s*)?(\d+)\)|\[(?:Q(?:uestion)?\.?\s*)?(\d+)\])(?:\*\*)?\s*(.*)$/i;

  const rawChunks = [];
  let currentChunk = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!currentChunk && !trimmed) continue;

    const qMatch = line.match(questionStartRegex);

    if (qMatch) {
      const qNum = qMatch[1] || qMatch[2] || qMatch[3] || qMatch[4] || (rawChunks.length + 1).toString();
      const firstLineText = qMatch[5] || '';

      if (currentChunk && (currentChunk.lines.length > 0 || currentChunk.questionText)) {
        rawChunks.push(currentChunk);
      }

      currentChunk = {
        number: qNum,
        lines: firstLineText ? [firstLineText] : []
      };
    } else if (currentChunk) {
      currentChunk.lines.push(line);
    } else {
      const looksLikePreamble = /^(?:here\s+are|questions?\s*on|exam\s*paper|quiz|assessment|instructions?|multiple\s*choice)/i.test(trimmed);
      if (!looksLikePreamble && trimmed) {
        currentChunk = {
          number: '1',
          lines: [line]
        };
      }
    }
  }

  if (currentChunk && currentChunk.lines.length > 0) {
    rawChunks.push(currentChunk);
  }

  let parsedChunks = rawChunks;
  if (parsedChunks.length <= 1 && cleanedText.includes('\n\n')) {
    const blocks = cleanedText.split(/\n\s*\n+/).filter((b) => b.trim().length > 0);
    if (blocks.length > 1) {
      parsedChunks = blocks.map((blk, idx) => ({
        number: (idx + 1).toString(),
        lines: blk.split('\n')
      }));
    }
  }

  const optionStartRegex = /^(?:[\*\-\•\+]\s*)?(?:\*\*)?(?:[\(\[]?([A-Da-d])[\.\)\]\:\-]|(?:\b([1-4])[\.\)\]]))(?:\*\*)?\s*(.*)$/;
  const answerRegex = /^(?:[\*\-\•]\s*)?(?:\*\*)?(?:Correct\s*)?(?:Answer|Ans|Option|Key)\s*(?:is|\:|\-)?\s*(?:\*\*)?\s*(?:Option\s*)?[\(\[]?([A-Da-d1-4])[\)\]\.\s]?/i;

  const parsedQuestions = [];

  parsedChunks.forEach((chunk, index) => {
    const chunkLines = chunk.lines;
    let questionTextLines = [];
    let options = { A: '', B: '', C: '', D: '' };
    let correctAnswer = globalAnswers[chunk.number] || globalAnswers[(index + 1).toString()] || null;
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

      // Check for inline options on single line
      const inlineOptions = extractInlineOptions(line);
      if (inlineOptions) {
        options = { ...options, ...inlineOptions };
        readingOptions = true;
        continue;
      }

      const cleanedOptionCandidate = line.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '').trim();
      const optMatch = cleanedOptionCandidate.match(optionStartRegex);

      if (optMatch) {
        let letter = (optMatch[1] || '').toUpperCase();
        let numIndex = optMatch[2];

        if (numIndex) {
          letter = numIndex === '1' ? 'A' : numIndex === '2' ? 'B' : numIndex === '3' ? 'C' : 'D';
        }

        if (['A', 'B', 'C', 'D'].includes(letter)) {
          readingOptions = true;
          lastOptionLetter = letter;
          options[letter] = cleanOptionText(optMatch[3] || '');
          continue;
        }
      }

      if (readingOptions && lastOptionLetter) {
        options[lastOptionLetter] += ' ' + cleanOptionText(line);
      } else {
        questionTextLines.push(cleanQuestionText(line));
      }
    }

    const questionText = questionTextLines.join(' ').replace(/\s+/g, ' ').trim();

    const hasOptions = Boolean(options.A && options.B);
    const hasAllOptions = Boolean(options.A && options.B && options.C && options.D);
    const hasAnswer = Boolean(correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer));

    const issues = [];
    if (!questionText) issues.push('Missing question text');
    if (!hasOptions) issues.push('Missing options');
    else if (!hasAllOptions) issues.push(`Found ${Object.values(options).filter(Boolean).length}/4 options`);
    if (!hasAnswer) issues.push('Correct answer not selected');

    const needsAttention = issues.length > 0;

    parsedQuestions.push({
      id: 'bulk_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
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
      topic: defaultMetadata.topic || 'Quantitative Aptitude',
      difficulty: (defaultMetadata.difficulty || 'MEDIUM').toUpperCase(),
      sourceExam: defaultMetadata.sourceExam || '',
      isSelected: true,
      needsAttention,
      issues
    });
  });

  const validCount = parsedQuestions.filter((q) => !q.needsAttention).length;
  const attentionCount = parsedQuestions.filter((q) => q.needsAttention).length;

  return {
    questions: parsedQuestions,
    rawCount: parsedQuestions.length,
    validCount,
    attentionCount
  };
}

function extractInlineOptions(line) {
  const inlinePattern = /(?:^|\s+)(?:[\(\[]?([A-Da-d])[\.\)\]\:\-]|\b([A-Da-d])\))\s+(.*?)(?=(?:\s+[\(\[]?[A-Da-d][\.\)\]\:\-]|\s+\b[A-Da-d]\)|$))/g;
  const matches = [...line.matchAll(inlinePattern)];

  if (matches.length >= 2) {
    const opts = {};
    matches.forEach((m) => {
      const letter = (m[1] || m[2]).toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(letter)) {
        opts[letter] = cleanOptionText(m[3]);
      }
    });
    if (opts.A && opts.B) {
      return opts;
    }
  }
  return null;
}

function extractGlobalAnswerKey(text) {
  const answerKeyHeaderRegex = /(?:\n\s*|\A)(?:Answer\s*Key|Answers|Keys|Solutions?)\s*[\:\-]?\s*\n([\s\S]*)$/i;
  const match = text.match(answerKeyHeaderRegex);

  if (!match) {
    return { cleanedText: text, globalAnswers: {} };
  }

  const cleanedText = text.substring(0, match.index).trim();
  const answerBlock = match[1];
  const globalAnswers = {};

  const itemPattern = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\:\)\-\s]+\s*[\(\[]?([A-Da-d1-4])[\)\]]?/gi;
  let itemMatch;
  while ((itemMatch = itemPattern.exec(answerBlock)) !== null) {
    const num = itemMatch[1];
    let ans = itemMatch[2].toUpperCase();
    if (ans === '1') ans = 'A';
    else if (ans === '2') ans = 'B';
    else if (ans === '3') ans = 'C';
    else if (ans === '4') ans = 'D';

    if (['A', 'B', 'C', 'D'].includes(ans)) {
      globalAnswers[num] = ans;
    }
  }

  return { cleanedText, globalAnswers };
}

function cleanOptionText(text) {
  if (!text) return '';
  return text
    .replace(/^\*{1,2}/, '')
    .replace(/\*{1,2}$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanQuestionText(text) {
  if (!text) return '';
  return text
    .replace(/^\s*(?:#{1,4}\s*)?(?:\*\*)?(?:(?:Q(?:uestion)?\.?\s*#?\s*\d+|\b\d+\b)[\.\:\)\-\]]|\((?:Q(?:uestion)?\.?\s*)?\d+\)|\[(?:Q(?:uestion)?\.?\s*)?\d+\])(?:\*\*)?\s*/i, '')
    .replace(/\*\*/g, '')
    .trim();
}
