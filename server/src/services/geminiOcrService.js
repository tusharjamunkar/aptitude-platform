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

CRITICAL RULES:
1. Detect each question's original number (e.g. 1, 2, Q3, etc.).
2. Extract the full question prompt text accurately. Preserve all mathematical symbols, equations, exponents (e.g. x², y³, 10⁻⁴), subscripts (e.g. a₁, log₁₀), fractions (e.g. 1/2 or ¾), Greek symbols (π, θ, α, β, λ), square roots (√), operators (±, ×, ÷, ≤, ≥, ≠), and chemical formulas.
3. Extract each option: Option A, Option B, Option C, Option D (and E if present). Remove option letter prefixes from option text.
4. Correct Answer: DO NOT guess or infer the correct answer. Only set correctAnswer if an answer key is explicitly printed on the page or circled/highlighted in the text. Otherwise, set correctAnswer to "".
5. Quality & Confidence:
   - Rate the overall image readability: "GOOD", "BLURRY", "DARK", "CROPPED", or "UNCERTAIN".
   - For each question, provide a confidence score between 0.0 and 1.0.
   - If a question is partially cropped, blurry, has unclear mathematical notation, or missing choices, set "needsReview": true and describe the reason in "uncertaintyReason".
6. If the image is completely illegible, not a textbook/exam page, or contains 0 questions, set "isReadable": false and provide an explanatory "errorMessage".

Respond strictly with a valid JSON object matching this schema:
{
  "isReadable": true,
  "detectedQuality": "GOOD",
  "pageSummary": "Textbook page containing X questions on ...",
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

  try {
    const modelName = options.model || 'gemini-1.5-flash';
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
        temperature: 0.2
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
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const resJson = await response.json();
    const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!candidateText) {
      throw new Error('Empty response received from Vision AI model.');
    }

    // Clean JSON markdown if wrapped in ```json ... ```
    let cleanJsonStr = candidateText.trim();
    if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    const parsedData = JSON.parse(cleanJsonStr);

    return {
      success: true,
      hasAiKey: true,
      data: parsedData
    };
  } catch (err) {
    console.error('Gemini OCR extraction failed:', err);
    return {
      success: false,
      hasAiKey: true,
      error: err.message || 'Vision AI processing failed'
    };
  }
}

module.exports = {
  extractQuestionsWithGemini
};
