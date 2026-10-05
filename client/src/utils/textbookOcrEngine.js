/**
 * textbookOcrEngine.js
 * Dual-engine OCR and AI Extraction pipeline for textbook pages.
 * 
 * Capabilities:
 * 1. Image preprocessing (canvas contrast boost, adaptive grayscale, resizing)
 * 2. Image quality verification (blur detection, dark image detection, readability score)
 * 3. Gemini Vision AI multimodal extraction (via backend /api/questions/ocr-extract)
 * 4. In-browser Tesseract.js fallback for 100% offline / no-API-key support
 * 5. Multi-image batch orchestration with per-page progress reporting
 */

import { createWorker } from 'tesseract.js';
import api from '../api/axios';
import { parseTextbookQuestions, identifyDuplicateQuestions } from './textbookQuestionParser';

/**
 * Preprocesses an image via HTML5 Canvas to enhance OCR readability and detect blur/lighting defects.
 * 
 * @param {File|string} imageSource - File object or Base64/data URL string
 * @returns {Promise<object>} { preprocessedDataUrl, quality: { isBlurry, isTooDark, isOverexposed, score, issues }, width, height }
 */
export async function preprocessAndAnalyzeImage(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxWidth = 1800;
        const maxHeight = 2400;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Scale down if extremely large to prevent browser crash and speed up OCR
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        ctx.drawImage(img, 0, 0, width, height);

        // Analyze image pixel data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const pixelCount = width * height;

        let totalBrightness = 0;
        let sumSquaredDiff = 0;
        let prevBrightness = 128;

        for (let i = 0; i < data.length; i += 4) {
          // Standard ITU-R BT.601 luminance
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          totalBrightness += luminance;

          // Simple edge / contrast delta calculation
          const diff = luminance - prevBrightness;
          sumSquaredDiff += diff * diff;
          prevBrightness = luminance;

          // Apply slight contrast expansion for textbook OCR clarity
          // Target text to stand out boldly against page background
          let enhanced = (luminance - 128) * 1.35 + 128;
          if (enhanced < 0) enhanced = 0;
          if (enhanced > 255) enhanced = 255;

          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);

        const avgBrightness = totalBrightness / pixelCount;
        const variance = sumSquaredDiff / pixelCount;

        const isTooDark = avgBrightness < 45;
        const isOverexposed = avgBrightness > 240;
        const isBlurry = variance < 80; // Low edge variance typically indicates out of focus or motion blur

        const qualityIssues = [];
        if (isTooDark) qualityIssues.push('Photo is too dark (turn on flash or improve room lighting)');
        if (isOverexposed) qualityIssues.push('Photo is washed out / overexposed');
        if (isBlurry) qualityIssues.push('Text appears blurry or out of focus');

        let qualityScore = 1.0;
        if (isBlurry) qualityScore -= 0.4;
        if (isTooDark) qualityScore -= 0.3;
        if (isOverexposed) qualityScore -= 0.3;
        qualityScore = Math.max(0.1, qualityScore);

        const preprocessedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        resolve({
          preprocessedDataUrl,
          width,
          height,
          quality: {
            avgBrightness: Math.round(avgBrightness),
            variance: Math.round(variance),
            isTooDark,
            isOverexposed,
            isBlurry,
            score: qualityScore,
            issues: qualityIssues,
            isAcceptable: !isBlurry && !isTooDark
          }
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image file into canvas for processing.'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error('Invalid image source provided.'));
    }
  });
}

/**
 * Extracts questions from a single textbook page image.
 * Uses Gemini Vision API if enabled/configured, otherwise falls back to in-browser Tesseract.js.
 * 
 * @param {object} pageItem - { id, file, dataUrl, pageNumber, pageName }
 * @param {object} options - { useAi, apiKey, defaultTopic, defaultDifficulty, onProgress }
 * @returns {Promise<object>} Extracted questions, confidence, and status
 */
export async function processSingleTextbookPage(pageItem, options = {}) {
  const {
    useAi = true,
    apiKey = null,
    defaultTopic = 'Quantitative Aptitude',
    defaultDifficulty = 'MEDIUM',
    onProgress = () => {}
  } = options;

  onProgress({ status: 'Analyzing image quality...', percent: 10 });

  // 1. Preprocess & analyze image quality
  let preprocessed;
  try {
    preprocessed = await preprocessAndAnalyzeImage(pageItem.dataUrl || pageItem.file);
  } catch (err) {
    console.warn('Canvas preprocessing warning, using raw image:', err);
    preprocessed = {
      preprocessedDataUrl: pageItem.dataUrl,
      quality: { isAcceptable: true, issues: [] }
    };
  }

  const imageQuality = preprocessed.quality;
  const targetImage = preprocessed.preprocessedDataUrl || pageItem.dataUrl;

  // 2. Try Gemini Vision AI if requested
  if (useAi) {
    try {
      onProgress({ status: 'Running Vision AI extraction...', percent: 40 });

      const res = await api.post('/questions/ocr-extract', {
        image: targetImage,
        apiKey: apiKey || undefined,
        pageNumber: pageItem.pageNumber
      });

      if (res.data?.success && res.data?.data) {
        onProgress({ status: 'Formatting extracted questions...', percent: 90 });
        const aiData = res.data.data;
        const aiQuestions = aiData.questions || [];

        // Format into standard assessment question objects
        const formatted = aiQuestions.map((q, idx) => ({
          id: 'tb_ai_' + Date.now() + '_' + pageItem.pageNumber + '_' + idx,
          displayIndex: idx + 1,
          originalNumber: q.originalNumber || (idx + 1).toString(),
          questionText: q.questionText || '',
          optionA: q.optionA || '',
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          optionsList: [
            { key: 'A', text: q.optionA || '' },
            { key: 'B', text: q.optionB || '' },
            { key: 'C', text: q.optionC || '' },
            { key: 'D', text: q.optionD || '' }
          ],
          correctAnswer: q.correctAnswer || '',
          marks: 1,
          negativeMarks: 0,
          topic: defaultTopic,
          difficulty: defaultDifficulty,
          sourceExam: `Textbook Page ${pageItem.pageNumber}`,
          pageNumber: pageItem.pageNumber,
          pageName: pageItem.pageName,
          confidence: q.confidence ?? 0.95,
          needsReview: Boolean(q.needsReview || !q.correctAnswer),
          issues: q.needsReview && q.uncertaintyReason ? [q.uncertaintyReason] : !q.correctAnswer ? ['Teacher needs to select correct answer'] : [],
          isSelected: true,
          isDuplicate: false,
          duplicateOf: null
        }));

        onProgress({ status: 'Completed', percent: 100 });
        return {
          success: true,
          engine: 'Gemini Vision AI',
          pageNumber: pageItem.pageNumber,
          pageName: pageItem.pageName,
          imageQuality,
          questions: formatted,
          rawCount: formatted.length,
          detectedCount: formatted.length,
          needsReviewCount: formatted.filter((q) => q.needsReview).length
        };
      }
    } catch (aiErr) {
      console.warn('Gemini Vision AI failed or no API key, falling back to client OCR:', aiErr);
      // Fall through to Tesseract.js
    }
  }

  // 3. Fallback: In-browser Tesseract.js OCR
  onProgress({ status: 'Initializing built-in OCR engine...', percent: 30 });

  let worker = null;
  try {
    worker = await createWorker('eng');

    onProgress({ status: 'Recognizing textbook characters & math...', percent: 55 });

    const ret = await worker.recognize(targetImage);
    const rawOcrText = ret.data.text || '';

    onProgress({ status: 'Parsing questions & mathematical symbols...', percent: 85 });

    const parsed = parseTextbookQuestions(rawOcrText, {
      topic: defaultTopic,
      difficulty: defaultDifficulty,
      pageNumber: pageItem.pageNumber,
      pageName: pageItem.pageName,
      pageImage: targetImage
    });

    await worker.terminate();
    worker = null;

    onProgress({ status: 'Completed', percent: 100 });

    return {
      success: true,
      engine: 'Built-in Smart OCR (Tesseract)',
      pageNumber: pageItem.pageNumber,
      pageName: pageItem.pageName,
      imageQuality,
      questions: parsed.questions,
      rawCount: parsed.rawCount,
      detectedCount: parsed.questions.length,
      needsReviewCount: parsed.attentionCount
    };
  } catch (ocrErr) {
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    console.error('Tesseract OCR error:', ocrErr);
    return {
      success: false,
      engine: 'Failed',
      pageNumber: pageItem.pageNumber,
      pageName: pageItem.pageName,
      error: ocrErr.message || 'Character recognition failed for this page',
      imageQuality,
      questions: []
    };
  }
}

/**
 * Orchestrates batch processing of multiple textbook pages with duplicate detection.
 * 
 * @param {Array} pages - List of { id, file, dataUrl, pageNumber, pageName }
 * @param {object} options - Configuration and callbacks
 * @param {Array} existingQuestions - Questions currently in database to check duplicates
 * @returns {Promise<object>} Combined questions, per-page statuses, duplicate summary
 */
export async function processAllTextbookPages(pages, options = {}, existingQuestions = []) {
  const { onPageStatusUpdate = () => {} } = options;
  const pageStatuses = {};
  let allExtractedQuestions = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    pageStatuses[page.id] = {
      id: page.id,
      pageNumber: page.pageNumber,
      pageName: page.pageName,
      status: 'PROCESSING',
      statusText: 'Processing page...',
      progressPercent: 10,
      detectedCount: 0,
      needsReview: false
    };
    onPageStatusUpdate({ ...pageStatuses });

    const pageResult = await processSingleTextbookPage(page, {
      ...options,
      onProgress: (p) => {
        pageStatuses[page.id] = {
          ...pageStatuses[page.id],
          status: 'PROCESSING',
          statusText: p.status,
          progressPercent: p.percent
        };
        onPageStatusUpdate({ ...pageStatuses });
      }
    });

    if (pageResult.success && pageResult.questions.length > 0) {
      pageStatuses[page.id] = {
        ...pageStatuses[page.id],
        status: 'PROCESSED',
        statusText: `Processed — ${pageResult.questions.length} questions detected`,
        progressPercent: 100,
        detectedCount: pageResult.questions.length,
        needsReview: pageResult.needsReviewCount > 0,
        engine: pageResult.engine
      };
      allExtractedQuestions.push(...pageResult.questions);
    } else {
      pageStatuses[page.id] = {
        ...pageStatuses[page.id],
        status: 'WARNING',
        statusText: pageResult.error || '0 questions detected (Check image clarity)',
        progressPercent: 100,
        detectedCount: 0,
        needsReview: true
      };
    }

    onPageStatusUpdate({ ...pageStatuses });
  }

  // Renumber all combined questions in sequential order
  const renumbered = allExtractedQuestions.map((q, idx) => ({
    ...q,
    displayIndex: idx + 1
  }));

  // Run duplicate detection across the combined batch and against existing questions
  const withDuplicates = identifyDuplicateQuestions(renumbered, existingQuestions);

  return {
    questions: withDuplicates,
    pageStatuses,
    totalDetected: withDuplicates.length,
    duplicateCount: withDuplicates.filter((q) => q.isDuplicate).length,
    needsReviewCount: withDuplicates.filter((q) => q.needsReview).length
  };
}
