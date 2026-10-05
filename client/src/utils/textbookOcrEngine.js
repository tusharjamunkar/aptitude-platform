/**
 * textbookOcrEngine.js
 * Dual-engine OCR and AI Extraction pipeline for textbook pages.
 * 
 * Capabilities:
 * 1. Image preprocessing (canvas contrast boost, adaptive grayscale, resizing)
 * 2. 2-Column page slicing to prevent line mixing across columns
 * 3. Gemini Multimodal Vision AI extraction (via backend /api/questions/ocr-extract)
 * 4. In-browser Tesseract.js fallback for offline support
 * 5. Multi-image batch orchestration with per-page progress reporting
 */

// Tesseract.js is dynamically imported only if offline OCR is requested
async function getTesseractWorker() {
  const { createWorker } = await import('tesseract.js');
  return createWorker;
}
import api from '../api/axios';
import { parseTextbookQuestions, identifyDuplicateQuestions, extractQuestionAndOptions } from './textbookQuestionParser';

/**
 * Slices an image data URL vertically into Left Column and Right Column
 * with a slight central overlap so math symbols on boundaries aren't clipped.
 */
export async function sliceImageIntoColumns(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const leftW = Math.round(w * 0.52);
        const rightX = Math.round(w * 0.48);
        const rightW = w - rightX;

        const leftCanvas = document.createElement('canvas');
        leftCanvas.width = leftW;
        leftCanvas.height = h;
        const leftCtx = leftCanvas.getContext('2d');
        leftCtx.drawImage(img, 0, 0, leftW, h, 0, 0, leftW, h);

        const rightCanvas = document.createElement('canvas');
        rightCanvas.width = rightW;
        rightCanvas.height = h;
        const rightCtx = rightCanvas.getContext('2d');
        rightCtx.drawImage(img, rightX, 0, rightW, h, 0, 0, rightW, h);

        resolve({
          leftDataUrl: leftCanvas.toDataURL('image/jpeg', 0.95),
          rightDataUrl: rightCanvas.toDataURL('image/jpeg', 0.95)
        });
      } catch (err) {
        console.warn('Column slicing warning:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Preprocesses an image via HTML5 Canvas to enhance OCR readability and detect blur/lighting defects.
 * 
 * @param {File|string} imageSource - File object or Base64/data URL string
 * @returns {Promise<object>} { preprocessedDataUrl, originalDataUrl, quality: { isBlurry, isTooDark, isOverexposed, score, issues }, width, height }
 */
export async function preprocessAndAnalyzeImage(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxWidth = 2200;
        const maxHeight = 3000;
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
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          totalBrightness += luminance;

          const diff = luminance - prevBrightness;
          sumSquaredDiff += diff * diff;
          prevBrightness = luminance;

          // Apply slight contrast expansion for textbook OCR clarity
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
        const isBlurry = variance < 80;

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
          originalDataUrl: img.src,
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
        console.error('Preprocessing error:', err);
        resolve({
          preprocessedDataUrl: img.src,
          originalDataUrl: img.src,
          quality: { isAcceptable: true, issues: [] }
        });
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for preprocessing: ' + (err?.message || 'Invalid format')));
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
      reject(new Error('Unsupported image source type'));
    }
  });
}

/**
 * Extracts questions from a single textbook page image.
 * 
 * @param {object} pageItem - { id, file, dataUrl, pageNumber, pageName }
 * @param {object} options - { useAi, apiKey, isTwoColumn, defaultTopic, defaultDifficulty, onProgress }
 * @returns {Promise<object>} Extracted questions, engine used, metadata
 */
export async function processSingleTextbookPage(pageItem, options = {}) {
  const {
    useAi = true,
    apiKey,
    isTwoColumn = false,
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
      originalDataUrl: pageItem.dataUrl,
      quality: { isAcceptable: true, issues: [] }
    };
  }

  const imageQuality = preprocessed.quality;
  const originalImage = preprocessed.originalDataUrl || pageItem.dataUrl;
  const targetImage = preprocessed.preprocessedDataUrl || pageItem.dataUrl;

  let aiAttempted = false;
  let aiFailureReason = null;

  // 2. Try Gemini Vision AI if requested (send clean original image for best neural vision perception)
  if (useAi) {
    aiAttempted = true;
    try {
      onProgress({ status: 'Running Google Gemini Vision AI...', percent: 40 });

      const res = await api.post('/questions/ocr-extract', {
        image: originalImage,
        apiKey: apiKey || undefined,
        pageNumber: pageItem.pageNumber
      });

      if (res.data?.success && res.data?.data) {
        onProgress({ status: 'Formatting & verifying question boundaries...', percent: 90 });
        const aiData = res.data.data;
        const aiQuestions = aiData.questions || [];

        // Format into standard assessment question objects with strict question vs option boundary verification
        const formatted = aiQuestions.map((q, idx) => {
          let qText = q.questionText || '';
          let optA = q.optionA || '';
          let optB = q.optionB || '';
          let optC = q.optionC || '';
          let optD = q.optionD || '';
          let ans = q.correctAnswer || '';

          // Double check: If options were left blank or questionText still contains embedded option markers, separate them!
          if ((!optA || !optB) || /(?:\([a-eA-E1-4]\)|\[[a-eA-E1-4]\]|\b[a-dA-D]\.|\b[a-dA-D]\))\s+/.test(qText)) {
            const sep = extractQuestionAndOptions(qText);
            if (sep.hasSeparatedOptions) {
              qText = sep.questionText;
              if (!optA) optA = sep.optionA;
              if (!optB) optB = sep.optionB;
              if (!optC) optC = sep.optionC;
              if (!optD) optD = sep.optionD;
              if (!ans && sep.correctAnswer) ans = sep.correctAnswer;
            }
          }

          const hasAllOpts = Boolean(optA && optB && optC && optD);
          const issues = [];
          if (!hasAllOpts) {
            const count = [optA, optB, optC, optD].filter(Boolean).length;
            issues.push(`Detected ${count}/4 options`);
          }
          if (q.needsReview && q.uncertaintyReason) {
            issues.push(q.uncertaintyReason);
          }
          if (!ans) {
            issues.push('Teacher needs to select correct answer');
          }

          return {
            id: 'tb_ai_' + Date.now() + '_' + pageItem.pageNumber + '_' + idx,
            displayIndex: idx + 1,
            originalNumber: q.originalNumber || (idx + 1).toString(),
            questionText: qText,
            optionA: optA,
            optionB: optB,
            optionC: optC,
            optionD: optD,
            optionsList: [
              { key: 'A', text: optA },
              { key: 'B', text: optB },
              { key: 'C', text: optC },
              { key: 'D', text: optD }
            ],
            correctAnswer: ans,
            marks: 1,
            negativeMarks: 0,
            topic: defaultTopic,
            difficulty: defaultDifficulty,
            sourceExam: `Textbook Page ${pageItem.pageNumber}`,
            pageNumber: pageItem.pageNumber,
            pageName: pageItem.pageName,
            confidence: q.confidence ?? (hasAllOpts ? 0.95 : 0.7),
            needsReview: issues.length > 0,
            issues,
            isSelected: true,
            isDuplicate: false,
            duplicateOf: null
          };
        });

        onProgress({ status: 'Completed', percent: 100 });
        return {
          success: true,
          engine: 'Gemini Vision AI (Neural OCR)',
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
      aiFailureReason = aiErr.response?.data?.error || aiErr.message || 'Vision AI key not configured';
      console.warn('Gemini Vision AI failed or no API key, falling back to client OCR:', aiFailureReason);
      // Fall through to Tesseract.js
    }
  }

  // 3. Fallback: In-browser Tesseract.js OCR
  onProgress({
    status: aiAttempted
      ? 'Vision AI unavailable. Running offline Smart OCR...'
      : 'Initializing offline OCR engine...',
    percent: 30
  });

  let worker = null;
  try {
    const createWorker = await getTesseractWorker();
    worker = await createWorker('eng');

    let rawOcrText = '';

    // Check if 2-column textbook slicing is active
    if (isTwoColumn) {
      onProgress({ status: 'Processing 2-Column page (Column 1 of 2)...', percent: 45 });
      const cols = await sliceImageIntoColumns(targetImage);
      if (cols) {
        const ret1 = await worker.recognize(cols.leftDataUrl);
        onProgress({ status: 'Processing 2-Column page (Column 2 of 2)...', percent: 65 });
        const ret2 = await worker.recognize(cols.rightDataUrl);
        rawOcrText = (ret1.data.text || '') + '\n\n' + (ret2.data.text || '');
      } else {
        const ret = await worker.recognize(targetImage);
        rawOcrText = ret.data.text || '';
      }
    } else {
      onProgress({ status: 'Recognizing textbook characters & math...', percent: 55 });
      const ret = await worker.recognize(targetImage);
      rawOcrText = ret.data.text || '';
    }

    onProgress({ status: 'Parsing questions & separating options...', percent: 85 });

    const parsed = parseTextbookQuestions(rawOcrText, {
      topic: defaultTopic,
      difficulty: defaultDifficulty,
      pageNumber: pageItem.pageNumber,
      pageName: pageItem.pageName,
      pageImage: originalImage
    });

    await worker.terminate();
    worker = null;

    onProgress({ status: 'Completed', percent: 100 });

    const fallbackEngineName = aiAttempted
      ? 'Offline OCR (Fallback — Gemini Key Required for 99% accuracy)'
      : 'Built-in Smart OCR (Offline)';

    return {
      success: true,
      engine: fallbackEngineName,
      warning: aiFailureReason,
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
      detectedCount: 0
    };
    onPageStatusUpdate({ ...pageStatuses });

    const result = await processSingleTextbookPage(page, {
      ...options,
      onProgress: ({ status, percent }) => {
        pageStatuses[page.id] = {
          ...pageStatuses[page.id],
          status: 'PROCESSING',
          statusText: status,
          percent
        };
        onPageStatusUpdate({ ...pageStatuses });
      }
    });

    if (result.success && result.questions.length > 0) {
      pageStatuses[page.id] = {
        ...pageStatuses[page.id],
        status: 'PROCESSED',
        statusText: `Detected ${result.detectedCount} questions (${result.engine})`,
        detectedCount: result.detectedCount,
        needsReviewCount: result.needsReviewCount,
        warning: result.warning
      };
      allExtractedQuestions = [...allExtractedQuestions, ...result.questions];
    } else {
      pageStatuses[page.id] = {
        ...pageStatuses[page.id],
        status: 'WARNING',
        statusText: result.error || '0 questions recognized',
        detectedCount: 0
      };
    }
    onPageStatusUpdate({ ...pageStatuses });
  }

  // Cross-page duplicate detection
  const deduplicatedQuestions = identifyDuplicateQuestions(allExtractedQuestions, existingQuestions);

  // Recalculate sequential display indices
  const finalQuestions = deduplicatedQuestions.map((q, idx) => ({
    ...q,
    displayIndex: idx + 1
  }));

  return {
    questions: finalQuestions,
    pageStatuses,
    totalPages: pages.length,
    totalExtracted: finalQuestions.length,
    duplicateCount: finalQuestions.filter((q) => q.isDuplicate).length,
    needsReviewCount: finalQuestions.filter((q) => q.needsReview).length
  };
}
