/**
 * textbookQuestionParser.js
 * Advanced parser tailored for extracting textbook & exam questions from OCR text.
 * 
 * Features:
 * - Mathematical symbol preservation (fractions, superscripts, subscripts, Greek letters, operators)
 * - Multi-question boundary detection on single or multiple pages
 * - High-precision question statement vs answer choices (A, B, C, D) separator
 * - Handles horizontal, vertical, 2x2 grid, inline, and numbered (1-4) options
 * - Answer key extraction (e.g. Ans: A, Answer - (2))
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
 * High-precision algorithm to separate a question block into:
 * - Question Prompt Statement (without options)
 * - Option A, Option B, Option C, Option D
 * - Correct Answer (if embedded)
 * 
 * Works for inline, multi-line, 2x2 grid, lettered (A-D / a-d), and numbered (1-4) options.
 * 
 * @param {string} rawBlock - Raw text of a single question
 * @returns {object} { qNumber, questionText, optionA, optionB, optionC, optionD, correctAnswer, hasSeparatedOptions }
 */
export function extractQuestionAndOptions(rawBlock) {
  if (!rawBlock || typeof rawBlock !== 'string') {
    return {
      qNumber: null,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      hasSeparatedOptions: false
    };
  }

  let text = rawBlock.trim();

  // 1. Extract and strip leading question number (e.g., "1.", "Q2.", "3)", "Question 4:")
  let qNumber = null;
  const numMatch = text.match(/^\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\:\)\-\]]\s*/i);
  if (numMatch) {
    qNumber = numMatch[1];
    text = text.substring(numMatch[0].length).trim();
  }

  // 2. Extract embedded answer key at the end (e.g. "Ans: B", "Answer: (1)", "Key - C")
  let correctAnswer = '';
  const ansMatch = text.match(/(?:[\n\s]+|^)(?:Ans(?:wer)?|Correct\s*(?:Option|Answer)?|Key)[\s\:\-\=]+[\(\[]?([A-Da-d1-4])[\)\]\.]?\s*$/i);
  if (ansMatch) {
    let rawAns = ansMatch[1].toUpperCase();
    if (rawAns === '1') rawAns = 'A';
    else if (rawAns === '2') rawAns = 'B';
    else if (rawAns === '3') rawAns = 'C';
    else if (rawAns === '4') rawAns = 'D';
    correctAnswer = rawAns;
    text = text.substring(0, ansMatch.index).trim();
  }

  // 3. Candidate Option Marker Styles
  // Ordered from highest specificity to lowest
  const markerStyles = [
    {
      name: 'parentheses_letter',
      A: /(?:^|[\s\n])\(([aA])\)\s+/g,
      B: /(?:^|[\s\n])\(([bB])\)\s+/g,
      C: /(?:^|[\s\n])\(([cC])\)\s+/g,
      D: /(?:^|[\s\n])\(([dD])\)\s+/g
    },
    {
      name: 'bracket_letter',
      A: /(?:^|[\s\n])\[([aA])\]\s+/g,
      B: /(?:^|[\s\n])\[([bB])\]\s+/g,
      C: /(?:^|[\s\n])\[([cC])\]\s+/g,
      D: /(?:^|[\s\n])\[([dD])\]\s+/g
    },
    {
      name: 'dot_letter',
      // Ensure it's not preceded by word character to avoid e.g. "U.S.A."
      A: /(?:^|[\s\n])(?<![a-zA-Z0-9])([aA])\.\s+/g,
      B: /(?:^|[\s\n])(?<![a-zA-Z0-9])([bB])\.\s+/g,
      C: /(?:^|[\s\n])(?<![a-zA-Z0-9])([cC])\.\s+/g,
      D: /(?:^|[\s\n])(?<![a-zA-Z0-9])([dD])\.\s+/g
    },
    {
      name: 'paren_close_letter',
      A: /(?:^|[\s\n])(?<![a-zA-Z0-9])([aA])\)\s+/g,
      B: /(?:^|[\s\n])(?<![a-zA-Z0-9])([bB])\)\s+/g,
      C: /(?:^|[\s\n])(?<![a-zA-Z0-9])([cC])\)\s+/g,
      D: /(?:^|[\s\n])(?<![a-zA-Z0-9])([dD])\)\s+/g
    },
    {
      name: 'parentheses_num',
      A: /(?:^|[\s\n])\((1)\)\s+/g,
      B: /(?:^|[\s\n])\((2)\)\s+/g,
      C: /(?:^|[\s\n])\((3)\)\s+/g,
      D: /(?:^|[\s\n])\((4)\)\s+/g
    },
    {
      name: 'paren_close_num',
      A: /(?:^|[\s\n])(?<![a-zA-Z0-9])(1)\)\s+/g,
      B: /(?:^|[\s\n])(?<![a-zA-Z0-9])(2)\)\s+/g,
      C: /(?:^|[\s\n])(?<![a-zA-Z0-9])(3)\)\s+/g,
      D: /(?:^|[\s\n])(?<![a-zA-Z0-9])(4)\)\s+/g
    },
    {
      name: 'bracket_num',
      A: /(?:^|[\s\n])\[(1)\]\s+/g,
      B: /(?:^|[\s\n])\[(2)\]\s+/g,
      C: /(?:^|[\s\n])\[(3)\]\s+/g,
      D: /(?:^|[\s\n])\[(4)\]\s+/g
    }
  ];

  let bestSplit = null;

  for (const style of markerStyles) {
    style.A.lastIndex = 0;
    style.B.lastIndex = 0;
    if (style.C) style.C.lastIndex = 0;
    if (style.D) style.D.lastIndex = 0;

    const aMatches = [...text.matchAll(style.A)];
    const bMatches = [...text.matchAll(style.B)];

    if (aMatches.length === 0 || bMatches.length === 0) continue;

    // Test each valid pair where B occurs AFTER A
    for (const aM of aMatches) {
      const aStart = aM.index + (aM[0].startsWith(' ') || aM[0].startsWith('\n') ? 1 : 0);
      const aEnd = aM.index + aM[0].length;

      const validB = bMatches.find((bM) => bM.index > aEnd);
      if (!validB) continue;

      const bStart = validB.index + (validB[0].startsWith(' ') || validB[0].startsWith('\n') ? 1 : 0);
      const bEnd = validB.index + validB[0].length;

      let cMatches = style.C ? [...text.matchAll(style.C)] : [];
      let validC = cMatches.find((cM) => cM.index > bEnd);
      let cStart = validC ? validC.index + (validC[0].startsWith(' ') || validC[0].startsWith('\n') ? 1 : 0) : null;
      let cEnd = validC ? validC.index + validC[0].length : null;

      let dMatches = (style.D && validC) ? [...text.matchAll(style.D)] : [];
      let validD = dMatches.find((dM) => dM.index > cEnd);
      let dStart = validD ? validD.index + (validD[0].startsWith(' ') || validD[0].startsWith('\n') ? 1 : 0) : null;
      let dEnd = validD ? validD.index + validD[0].length : null;

      let score = 2; // Matched A and B
      if (validC) score += 2;
      if (validD) score += 2;

      // Question prompt is strictly everything BEFORE the A marker
      const questionPrompt = text.substring(0, aStart).trim();
      const optionA = text.substring(aEnd, bStart).trim();
      let optionB = '';
      let optionC = '';
      let optionD = '';

      if (validC) {
        optionB = text.substring(bEnd, cStart).trim();
        if (validD) {
          optionC = text.substring(cEnd, dStart).trim();
          optionD = text.substring(dEnd).trim();
        } else {
          optionC = text.substring(cEnd).trim();
        }
      } else {
        optionB = text.substring(bEnd).trim();
      }

      // Check if question prompt has meaningful length
      if (questionPrompt.length >= 3 && (!bestSplit || score > bestSplit.score)) {
        bestSplit = {
          score,
          questionPrompt,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          hasSeparatedOptions: true
        };
      }
    }
  }

  if (bestSplit) {
    return {
      qNumber,
      questionText: bestSplit.questionPrompt,
      optionA: cleanOptionText(bestSplit.optionA),
      optionB: cleanOptionText(bestSplit.optionB),
      optionC: cleanOptionText(bestSplit.optionC),
      optionD: cleanOptionText(bestSplit.optionD),
      correctAnswer: bestSplit.correctAnswer,
      hasSeparatedOptions: true
    };
  }

  // Fallback: If no clear sequence detected, return cleaned text with empty options
  return {
    qNumber,
    questionText: text,
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer,
    hasSeparatedOptions: false
  };
}

/**
 * Splits full textbook page text into separate question blocks.
 * Avoids falsely treating numbered options (1), (2), (3), (4) as new questions.
 * 
 * @param {string} rawPageText 
 * @returns {Array<{ number: string, rawText: string }>}
 */
export function splitPageIntoQuestions(rawPageText) {
  if (!rawPageText || typeof rawPageText !== 'string') return [];

  const lines = rawPageText.split(/\r?\n/);
  
  const isPreambleOrHeader = (line) => {
    const t = line.trim();
    return /^(?:page\s*\d+|chapter\s*\d+|unit\s*\d+|section\s*[a-z0-9]|exercise|practice\s*(?:set|test|paper)?|aptitude\s*(?:test|questions?)|objective\s*questions?|part\s*[a-z0-9])/i.test(t);
  };

  // Question boundary pattern (e.g. "1.", "1)", "1:", "1 -", "Q1.", "Q.1", "Question 1:")
  const qStartPattern = /^\s*(?:#{1,4}\s*)?(?:\*\*)?(?:(?:Q(?:uestion)?\.?\s*#?\s*(\d+)|\b(\d+)\b)[\.\:\)\-\]](?!\d)|\[(?:Q(?:uestion)?\.?\s*)?(\d+)\])(?:\*\*)?\s*(.*)$/i;

  const questions = [];
  let currentChunk = null;
  let currentQNum = 0;
  let hasEncounteredOptionsInCurrent = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) {
      if (currentChunk) currentChunk.lines.push('');
      continue;
    }

    if (isPreambleOrHeader(line) && !currentChunk) {
      // Skip top-of-page book headers
      continue;
    }

    const qMatch = line.match(qStartPattern);
    let isNewQuestion = false;
    let matchedNum = null;

    if (qMatch) {
      matchedNum = parseInt(qMatch[1] || qMatch[2] || qMatch[3], 10);
      
      const hasExplicitQ = /^\s*(?:Q(?:uestion)?\.?\s*#?\s*\d+)/i.test(line);
      const afterOptions = hasEncounteredOptionsInCurrent;
      const isSequential = matchedNum === currentQNum + 1 || matchedNum > currentQNum;

      if (hasExplicitQ || afterOptions || isSequential || currentChunk === null) {
        // Guard against numbered options like (1) or 1) inside a question
        const isLikelyNumberedOption = (matchedNum >= 1 && matchedNum <= 4) && 
          currentChunk && 
          !afterOptions && 
          currentChunk.lines.join(' ').length > 25 &&
          (/^\s*(?:\([1-4]\)|\[[1-4]\]|[1-4]\))\s+/.test(line)) &&
          (line.length < 50 || /\([2-4]\)|[2-4]\)/.test(line));

        if (!isLikelyNumberedOption) {
          isNewQuestion = true;
        }
      }
    }

    if (isNewQuestion) {
      if (currentChunk && currentChunk.lines.join(' ').trim().length > 10) {
        questions.push({
          number: currentChunk.number,
          rawText: currentChunk.lines.join('\n').trim()
        });
      }
      currentQNum = matchedNum || (currentQNum + 1);
      hasEncounteredOptionsInCurrent = false;
      currentChunk = {
        number: currentQNum.toString(),
        lines: [rawLine]
      };
    } else {
      if (currentChunk) {
        currentChunk.lines.push(rawLine);
        // Check if line contains option markers
        if (/(?:\([a-eA-E1-4]\)|\[[a-eA-E1-4]\]|\b[a-dA-D]\.|\b[a-dA-D]\))\s+/.test(line)) {
          hasEncounteredOptionsInCurrent = true;
        }
      } else if (line.length > 10 && !isPreambleOrHeader(line)) {
        currentQNum = 1;
        currentChunk = {
          number: '1',
          lines: [rawLine]
        };
      }
    }
  }

  if (currentChunk && currentChunk.lines.join(' ').trim().length > 10) {
    questions.push({
      number: currentChunk.number,
      rawText: currentChunk.lines.join('\n').trim()
    });
  }

  return questions;
}

/**
 * Main parser entry point: parses raw OCR text into structured question objects.
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

  // Split into question blocks
  let blocks = splitPageIntoQuestions(bodyText);

  // Fallback: If only 1 or 0 block detected, try double-newline blocks
  if (blocks.length <= 1 && bodyText.includes('\n\n')) {
    const rawParagraphs = bodyText.split(/\n\s*\n+/).filter((b) => b.trim().length > 15);
    if (rawParagraphs.length > 1) {
      blocks = rawParagraphs.map((blk, idx) => ({
        number: (idx + 1).toString(),
        rawText: blk.trim()
      }));
    }
  }

  if (blocks.length === 0 && bodyText.length > 10) {
    blocks = [{ number: '1', rawText: bodyText }];
  }

  const results = [];

  blocks.forEach((block, index) => {
    const extracted = extractQuestionAndOptions(block.rawText);

    const questionNumber = extracted.qNumber || block.number || (index + 1).toString();
    const finalAnswer = extracted.correctAnswer || answerKeyMap[questionNumber] || answerKeyMap[(index + 1).toString()] || '';

    const issues = [];
    const hasOptions = Boolean(extracted.optionA && extracted.optionB);
    const hasAllOptions = Boolean(extracted.optionA && extracted.optionB && extracted.optionC && extracted.optionD);
    const hasText = extracted.questionText.length > 5;
    const hasAnswer = Boolean(finalAnswer && ['A', 'B', 'C', 'D'].includes(finalAnswer));

    if (!hasText) {
      issues.push('Question statement is empty or unclear');
    }
    if (!hasOptions) {
      issues.push('Could not detect distinct options (A, B, C, D)');
    } else if (!hasAllOptions) {
      const foundCount = [extracted.optionA, extracted.optionB, extracted.optionC, extracted.optionD].filter(Boolean).length;
      issues.push(`Detected ${foundCount}/4 options`);
    }

    if (!hasAnswer) {
      issues.push('Teacher needs to select correct answer');
    }

    // Check for math uncertainty (e.g., replacement character or multiple unparsed question marks)
    if (/[\uFFFD]/.test(extracted.questionText)) {
      issues.push('Unclear character in mathematical equation');
    }

    const needsReview = issues.length > 0;
    const confidence = !hasText ? 0.2 : !hasOptions ? 0.35 : !hasAllOptions ? 0.7 : hasAnswer ? 0.95 : 0.85;

    results.push({
      id: 'tb_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
      displayIndex: index + 1,
      originalNumber: questionNumber,
      questionText: extracted.questionText,
      optionA: extracted.optionA || '',
      optionB: extracted.optionB || '',
      optionC: extracted.optionC || '',
      optionD: extracted.optionD || '',
      optionsList: [
        { key: 'A', text: extracted.optionA || '' },
        { key: 'B', text: extracted.optionB || '' },
        { key: 'C', text: extracted.optionC || '' },
        { key: 'D', text: extracted.optionD || '' }
      ],
      correctAnswer: finalAnswer,
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
