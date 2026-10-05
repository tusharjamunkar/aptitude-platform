/**
 * geminiOcrService.js
 * Native fetch-based Google Gemini Vision AI service.
 * Zero external SDK dependencies, compatible with Node 18+ and all cloud PaaS environments (Render, etc.).
 */

/**
 * Extracts questions from textbook page image using Gemini Multimodal Vision API.
 * 
 * @param {string} imageInput - Base64 string or data URL (e.g. data:image/jpeg;base64,...)
 * @param {object} options - { apiKey, mimeType, topic, model }
 * @returns {Promise<object>} Extracted questions, quality metadata, confidence
 */
async function extractQuestionsWithGemini(imageInput, options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      hasAiKey: false,
      error: 'GEMINI_API_KEY is not configured on server or in client request.'
    };
  }

  let mimeType = options.mimeType || 'image/jpeg';
  let base64Data = imageInput;

  // If input is data URL (e.g. data:image/png;base64,xxxx), parse mime and clean base64
  if (imageInput.startsWith('data:')) {
    const matches = imageInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      const commaIdx = imageInput.indexOf(',');
      if (commaIdx !== -1) {
        base64Data = imageInput.substring(commaIdx + 1);
      }
    }
  }

  const prompt = `You are an expert textbook question digitizer and OCR assistant for academic assessments.
Analyze this textbook/exam page image carefully.

Extract every single question and its answer choices (A, B, C, D) appearing on this page.

CRITICAL RULES FOR DISTINGUISHING QUESTIONS FROM OPTIONS:
1. STRICT BOUNDARY SEPARATION:
   - "questionText" must contain ONLY the question statement / problem statement / passage / formula prompt.
   - NEVER include the answer choices (A, B, C, D) or option text inside "questionText".
   - If options appear on the same line as the question in the textbook (e.g. "Find x if 2x = 10. (A) 2 (B) 5 (C) 8 (D) 10"), you MUST DETACH the options completely from questionText. Put only "Find x if 2x = 10." in questionText, and put "2" in optionA, "5" in optionB, etc.
   - Do NOT include question numbers (like "1.", "Q2.", "3)") inside "questionText". Put the number in "originalNumber".

2. OPTIONS DETECTION:
   - Extract optionA, optionB, optionC, optionD.
   - Completely strip all letter and number labels like "(A)", "A.", "A)", "[A]", "(a)", "a.", "(1)", "1.", "1)" from the option values. Put ONLY the clean choice content / math expression in optionA-optionD.
   - If textbook options are numbered (1), (2), (3), (4) or 1, 2, 3, 4, map: (1)->optionA, (2)->optionB, (3)->optionC, (4)->optionD.
   - Textbooks often print options in two columns (e.g., A & B on left/right, C & D below) or horizontally. Scan carefully across lines to identify all 4 options.

3. PRESERVE MATHEMATICS & FORMULAS:
   - Accurately preserve equations, exponents (x², y³, 10⁻⁴), subscripts (a₁, log₁₀), fractions (½, 7/15), Greek letters (π, θ, α, β, λ), square roots (√), operators (±, ×, ÷, ≤, ≥, ≠), and chemical formulas.

4. MULTIPLE QUESTIONS DETECTION:
   - Identify where one question ends and the next question begins by detecting new question numbers (e.g. 1, 2, 3... or Q.1, Q.2...).
   - Do NOT merge two different questions into one. Return every detected question as an individual item.

5. CORRECT ANSWER:
   - DO NOT guess or hallucinate the correct answer.
   - Only set "correctAnswer" to "A", "B", "C", or "D" if an answer key is explicitly printed on the page or circled/highlighted. Otherwise leave "correctAnswer": "".

Respond strictly with a valid JSON object matching this schema:
{
  "isReadable": true,
  "detectedQuality": "GOOD",
  "pageSummary": "Textbook page containing X questions",
  "questions": [
    {
      "originalNumber": "1",
      "questionText": "If x + 1/x = 5, find the value of x² + 1/x².",
      "optionA": "23",
      "optionB": "25",
      "optionC": "27",
      "optionD": "20",
      "correctAnswer": "",
      "confidence": 0.95,
      "needsReview": false,
      "uncertaintyReason": ""
    }
  ]
}`;

  // Candidate models with fallback
  const modelsToTry = [
    options.model || 'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
  ].filter(Boolean);

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini model ${modelName} returned status ${response.status}:`, errText);
        lastError = new Error(`Gemini API error (${response.status}): ${errText}`);
        continue; // Try fallback model
      }

      const resJson = await response.json();
      const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!candidateText) {
        lastError = new Error('Empty response received from Vision AI model.');
        continue;
      }

      // Clean JSON markdown if wrapped
      let cleanJsonStr = candidateText.trim();
      if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      const parsedData = JSON.parse(cleanJsonStr);

      return {
        success: true,
        hasAiKey: true,
        modelUsed: modelName,
        data: parsedData
      };
    } catch (err) {
      console.warn(`Gemini model ${modelName} attempt failed:`, err.message);
      lastError = err;
    }
  }

  console.error('All Gemini OCR model attempts failed:', lastError);
  return {
    success: false,
    hasAiKey: true,
    error: lastError?.message || 'Vision AI processing failed'
  };
}

module.exports = {
  extractQuestionsWithGemini
};
