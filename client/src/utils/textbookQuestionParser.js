/**
 * textbookQuestionParser.js
 * Advanced parser tailored for extracting textbook & exam questions from OCR text.
 * 
 * Features:
 * - Mathematical symbol preservation (fractions, superscripts, subscripts, Greek letters, operators)
 * - Multi-question boundary detection on single or multiple pages
 * - Robust option detection (A, B, C, D, inline and block formats)
 * - OCR artifact cleanup and math normalization
 * - Confidence scoring & uncertainty flagging
 * - Duplicate similarity calculation (Levenshtein / Token Jaccard)
 */

/**
 * Normalizes mathematical characters and common OCR mistakes in textbook text.
 */
export function cleanTextbookMathAndText(text) {
  if (!text) return '';

  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    // Common OCR character misidentifications in math/options
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    // Mathematical symbols normalization
    .replace(/<=\s*/g, ' ≤ ')
    .replace(/>=\s*/g, ' ≥ ')
    .replace(/!=\s*/g, ' ≠ ')
    .replace(/\+\/-\s*/g, ' ± ')
    .replace(/\bpi\b/g, 'π')
    .replace(/\btheta\b/g, 'θ')
    .replace(/\balpha\b/g, 'α')
    .replace(/\bbeta\b/g, 'β')
    .replace(/\bsqrt\b\s*\(([^)]+)\)/gi, '√($1)')
    .replace(/\bsqrt\b/gi, '√')
    // Superscript numbers cleanup
    .replace(/\^0/g, '⁰')
    .replace(/\^1/g, '¹')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^4/g, '⁴')
    .replace(/\^5/g, '⁵')
    .replace(/\^6/g, '⁶')
    .replace(/\^7/g, '⁷')
    .replace(/\^8/g, '⁸')
    .replace(/\^9/g, '⁹')
    .replace(/\^-1/g, '⁻¹')
    .replace(/\^-2/g, '⁻²')
    .replace(/\^-3/g, '⁻³')
    // Clean trailing/multiple spaces
    .replace(/[ \t]+/g, ' ');

  return cleaned;
}

/**
 * Parses raw OCR text into structured question objects.
 * 
 * @param {string} rawText - OCR output text
 * @param {object} metadata - Default metadata (topic, difficulty, pageNumber, marks)
 * @returns {object} { questions: [...], rawCount, validCount, attentionCount }
 */
export function parseTextbookQuestions(rawText, metadata = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { questions: [], rawCount: 0, validCount: 0, attentionCount: 0 };
  }

  const cleaned = cleanTextbookMathAndText(rawText).trim();
  if (!cleaned) {
    return { questions: [], rawCount: 0, validCount: 0, attentionCount: 0 };
  }

  // Check for standalone answer keys at the bottom (e.g. Answers: 1. A, 2. C)
  const { bodyText, answerKeyMap } = extractEmbeddedAnswerKey(cleaned);

  const lines = bodyText.split('\n');

  // Question boundary regexes:
  // e.g.: "1.", "1)", "1:", "1 -", "(1)", "[1]", "Q1.", "Q.1", "Q 1", "Question 1:"
  const qStartRegex = /^(?:#{1,4}\s*)?(?:\*\*)?(?:(?:Q(?:uestion)?\.?\s*#?\s*(\d+)|\b(\d+)\b)[\.\:\)\-\]]|\((?:Q(?:uestion)?\.?\s*)?(\d+)\)|\[(?:Q(?:uestion)?\.?\s*)?(\d+)\])(?:\*\*)?\s*(.*)$/i;

  const rawChunks = [];
  let currentChunk = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed && !currentChunk) continue;

    const qMatch = trimmed.match(qStartRegex);

    if (qMatch) {
      const qNum = qMatch[1] || qMatch[2] || qMatch[3] || qMatch[4] || (rawChunks.length + 1).toString();
      const firstLineText = qMatch[5] || '';

      if (currentChunk && (currentChunk.lines.length > 0 || currentChunk.firstLine)) {
        rawChunks.push(currentChunk);
      }

      currentChunk = {
        number: qNum,
        firstLine: firstLineText,
        lines: firstLineText ? [firstLineText] : []
      };
    } else if (currentChunk) {
      currentChunk.lines.push(line);
    } else {
      // First preamble lines before question 1
      const isHeader = /^(?:page\s*\d+|chapter|unit|section|aptitude|exercise|sample|test|practice)/i.test(trimmed);
      if (!isHeader && trimmed.length > 5) {
        currentChunk = {
          number: '1',
          firstLine: line,
          lines: [line]
        };
      }
    }
  }

  if (currentChunk && currentChunk.lines.length > 0) {
    rawChunks.push(currentChunk);
  }

  // Fallback: If only 1 chunk was detected but there are double-newlines separating questions
  let parsedChunks = rawChunks;
  if (parsedChunks.length <= 1 && bodyText.includes('\n\n')) {
    const blocks = bodyText.split(/\n\s*\n+/).filter((b) => b.trim().length > 15);
    if (blocks.length > 1) {
      parsedChunks = blocks.map((blk, idx) => ({
        number: (idx + 1).toString(),
        lines: blk.split('\n')
      }));
    }
  }

  // Option regex patterns:
  // Option prefixes: A), A., (A), [A], a), (a), 1), (1)
  const optionPrefixRegex = /^(?:[\*\-\•\+]\s*)?(?:\*\*)?(?:[\(\[]?([A-Da-d])[\.\)\]\:\-]|(?:\b([1-4])[\.\)\]]))(?:\*\*)?\s*(.*)$/;
  const inlineOptionRegex = /(?:^|\s+)(?:[\(\[]?([A-Da-d])[\.\)\]\:\-]|\b([A-Da-d])\))\s+(.*?)(?=(?:\s+[\(\[]?[A-Da-d][\.\)\]\:\-]|\s+\b[A-Da-d]\)|$))/g;
  const inlineAnswerRegex = /^(?:[\*\-\•]\s*)?(?:\*\*)?(?:Correct\s*)?(?:Answer|Ans|Option|Key)\s*(?:is|\:|\-)?\s*(?:\*\*)?\s*(?:Option\s*)?[\(\[]?([A-Da-d1-4])[\)\]\.\s]?/i;

  const results = [];

  parsedChunks.forEach((chunk, index) => {
    const chunkLines = chunk.lines;
    let questionTextLines = [];
    let options = { A: '', B: '', C: '', D: '' };
    let correctAnswer = answerKeyMap[chunk.number] || answerKeyMap[(index + 1).toString()] || '';
    let readingOptions = false;
    let lastOptionKey = null;

    for (let j = 0; j < chunkLines.length; j++) {
      let rawLine = chunkLines[j];
      let line = rawLine.trim();
      if (!line) continue;

      // Check if line is an answer key line
      const ansMatch = line.match(inlineAnswerRegex);
      if (ansMatch) {
        let val = ansMatch[1].toUpperCase();
        if (val === '1') val = 'A';
        else if (val === '2') val = 'B';
        else if (val === '3') val = 'C';
        else if (val === '4') val = 'D';

        if (['A', 'B', 'C', 'D'].includes(val)) {
          correctAnswer = val;
        }
        continue;
      }

      // Check for inline options on single line (e.g. "(A) 12  (B) 15  (C) 18  (D) 24")
      const inlineMatches = [...line.matchAll(inlineOptionRegex)];
      if (inlineMatches.length >= 2) {
        inlineMatches.forEach((m) => {
          let letter = (m[1] || m[2]).toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(letter)) {
            options[letter] = cleanOptionText(m[3]);
          }
        });
        readingOptions = true;
        continue;
      }

      // Check for standard line-starting option (e.g. "A) 24 meters")
      const optMatch = line.match(optionPrefixRegex);
      if (optMatch) {
        let letter = (optMatch[1] || '').toUpperCase();
        let numIndex = optMatch[2];
        if (numIndex) {
          letter = numIndex === '1' ? 'A' : numIndex === '2' ? 'B' : numIndex === '3' ? 'C' : 'D';
        }

        if (['A', 'B', 'C', 'D'].includes(letter)) {
          readingOptions = true;
          lastOptionKey = letter;
          options[letter] = cleanOptionText(optMatch[3] || '');
          continue;
        }
      }

      // If we are already in options mode and this line doesn't start with a new option, append to last option
      if (readingOptions && lastOptionKey) {
        options[lastOptionKey] = (options[lastOptionKey] + ' ' + cleanOptionText(line)).trim();
      } else {
        // Still part of question prompt text
        questionTextLines.push(line);
      }
    }

    const questionText = cleanQuestionText(questionTextLines.join(' '));

    // Evaluate confidence and identify potential extraction issues
    const issues = [];
    const hasOptions = Boolean(options.A && options.B);
    const hasAllOptions = Boolean(options.A && options.B && options.C && options.D);
    const hasText = questionText.length > 5;
    const hasAnswer = Boolean(correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer));

    if (!hasText) {
      issues.push('Question prompt is empty or unclear');
    }
    if (!hasOptions) {
      issues.push('Missing answer options');
    } else if (!hasAllOptions) {
      const foundCount = Object.values(options).filter(Boolean).length;
      issues.push(`Found ${foundCount}/4 options`);
    }

    if (!hasAnswer) {
      issues.push('Teacher needs to select correct answer');
    }

    // Check for math uncertainty (e.g., unmatched brackets, rogue question marks)
    if (/\?{2,}/.test(questionText) || /[\uFFFD]/.test(questionText)) {
      issues.push('Unclear characters detected in math formula');
    }

    const needsReview = issues.length > 0;
    const confidence = !hasText ? 0.2 : !hasOptions ? 0.4 : !hasAllOptions ? 0.7 : hasAnswer ? 0.95 : 0.85;

    results.push({
      id: 'tb_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
      displayIndex: index + 1,
      originalNumber: chunk.number,
      questionText: questionText,
      optionA: options.A || '',
      optionB: options.B || '',
      optionC: options.C || '',
      optionD: options.D || '',
      optionsList: [
        { key: 'A', text: options.A || '' },
        { key: 'B', text: options.B || '' },
        { key: 'C', text: options.C || '' },
        { key: 'D', text: options.D || '' }
      ],
      correctAnswer: correctAnswer || '',
      marks: Number(metadata.marks) || 1,
      negativeMarks: Number(metadata.negativeMarks) || 0,
      topic: metadata.topic || 'Quantitative Aptitude',
      difficulty: (metadata.difficulty || 'MEDIUM').toUpperCase(),
      sourceExam: metadata.sourceExam || (metadata.pageName ? `Textbook ${metadata.pageName}` : 'Textbook Capture'),
      pageNumber: metadata.pageNumber || 1,
      pageName: metadata.pageName || `Page ${metadata.pageNumber || 1}`,
      pageImage: metadata.pageImage || null,
      confidence,
      needsReview,
      issues,
      isSelected: true,
      isDuplicate: false,
      duplicateOf: null
    });
  });

  const validCount = results.filter((q) => !q.needsReview).length;
  const attentionCount = results.filter((q) => q.needsReview).length;

  return {
    questions: results,
    rawCount: results.length,
    validCount,
    attentionCount
  };
}

/**
 * Cleans option text removing surrounding markers
 */
function cleanOptionText(text) {
  if (!text) return '';
  return text
    .replace(/^[\*\-\•\:\.\)\s]+/, '')
    .replace(/[\*\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans question prompt text removing question numbers at the start
 */
function cleanQuestionText(text) {
  if (!text) return '';
  return text
    .replace(/^\s*(?:#{1,4}\s*)?(?:\*\*)?(?:(?:Q(?:uestion)?\.?\s*#?\s*\d+|\b\d+\b)[\.\:\)\-\]]|\((?:Q(?:uestion)?\.?\s*)?\d+\)|\[(?:Q(?:uestion)?\.?\s*)?\d+\])(?:\*\*)?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts embedded answer keys like "Answer Key: 1-A, 2-C, 3-D"
 */
function extractEmbeddedAnswerKey(text) {
  const answerKeyHeaderRegex = /(?:\n\s*|\A)(?:Answer\s*Key|Answers|Keys|Solutions?)\s*[\:\-]?\s*\n([\s\S]*)$/i;
  const match = text.match(answerKeyHeaderRegex);

  if (!match) {
    return { bodyText: text, answerKeyMap: {} };
  }

  const bodyText = text.substring(0, match.index).trim();
  const answerBlock = match[1];
  const answerKeyMap = {};

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
      answerKeyMap[num] = ans;
    }
  }

  return { bodyText, answerKeyMap };
}

/**
 * Compares two questions to check if they are duplicates.
 * Uses token-based Jaccard similarity and normalized string match.
 */
export function calculateQuestionSimilarity(textA, textB) {
  if (!textA || !textB) return 0;

  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const normA = normalize(textA);
  const normB = normalize(textB);

  if (normA === normB) return 1.0;
  if (normA.includes(normB) || normB.includes(normA)) {
    const lenRatio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
    if (lenRatio > 0.8) return lenRatio;
  }

  const tokensA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const tokensB = new Set(normB.split(' ').filter((w) => w.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detects duplicates across extracted questions and against existing repository questions.
 * 
 * @param {Array} questions - Newly extracted questions
 * @param {Array} existingQuestions - Questions already in the database
 * @param {number} threshold - Similarity threshold (default 0.75 / 75%)
 * @returns {Array} Updated questions with isDuplicate and duplicateOf flags
 */
export function identifyDuplicateQuestions(questions, existingQuestions = [], threshold = 0.75) {
  const updated = [...questions];

  for (let i = 0; i < updated.length; i++) {
    const current = updated[i];
    let foundDup = false;

    // 1. Check against earlier questions in the same batch
    for (let j = 0; j < i; j++) {
      const prior = updated[j];
      const sim = calculateQuestionSimilarity(current.questionText, prior.questionText);
      if (sim >= threshold) {
        current.isDuplicate = true;
        current.duplicateReason = `Overlaps with Question #${prior.displayIndex} (${Math.round(sim * 100)}% match)`;
        current.duplicateOf = prior.id;
        foundDup = true;
        break;
      }
    }

    if (foundDup) continue;

    // 2. Check against database existing questions
    for (let k = 0; k < existingQuestions.length; k++) {
      const dbQ = existingQuestions[k];
      const sim = calculateQuestionSimilarity(current.questionText, dbQ.questionText);
      if (sim >= threshold) {
        current.isDuplicate = true;
        current.duplicateReason = `Already exists in Question Bank (${Math.round(sim * 100)}% match)`;
        current.duplicateOf = dbQ.id;
        break;
      }
    }
  }

  return updated;
}
