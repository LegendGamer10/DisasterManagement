const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const localConfig = require('../config/local');
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Rule-based fallback if AI call fails for any reason.
function fallbackAnalyze(text, reason = '') {
  const normalized = text.toLowerCase();

  const highSignals = ['evacuate', 'critical', 'severe', 'massive', 'life-threatening'];
  const mediumSignals = ['warning', 'rising', 'spreading', 'moderate'];

  let risk_level = 'Low';
  if (highSignals.some((word) => normalized.includes(word))) {
    risk_level = 'High';
  } else if (mediumSignals.some((word) => normalized.includes(word))) {
    risk_level = 'Medium';
  }

  let disaster_type = 'General Incident';
  if (normalized.includes('flood') || normalized.includes('water')) disaster_type = 'Flood';
  else if (normalized.includes('fire') || normalized.includes('smoke')) disaster_type = 'Wildfire';
  else if (normalized.includes('tree') || normalized.includes('logging')) disaster_type = 'Deforestation';

  return {
    disaster_type,
    risk_level,
    confidence: '62%',
    summary: reason
      ? `Fallback analysis used because AI was unavailable (${reason}).`
      : 'Fallback analysis used due to AI service unavailability.'
  };
}

function parseErrorMessage(status, responseBody) {
  const message = responseBody?.error?.message || 'Unknown API error';
  if (status === 429) {
    return `rate limit/quota reached (${message})`;
  }
  return `API error ${status} (${message})`;
}

async function requestAIWithRetry(payload, apiKey, maxAttempts = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return response.json();
    }

    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch (error) {
      // Ignore parsing issues and use a generic message.
    }

    const reason = parseErrorMessage(response.status, errorBody);
    lastError = new Error(reason);

    const retryable = [429, 500, 502, 503, 504].includes(response.status);
    if (!retryable || attempt === maxAttempts) {
      throw lastError;
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after')) || 1;
    await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
  }

  throw lastError || new Error('Unknown AI request failure');
}

async function analyzeWithAI(text) {
  const apiKey = (process.env.OPENAI_API_KEY || localConfig.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured in .env or backend/config/local.js');
  }

  const prompt = `Analyze the following text and determine if it describes a disaster.\n\nReturn JSON with:\n- disaster_type (any relevant disaster)\n- risk_level (Low, Medium, High)\n- confidence (percentage)\n- summary (short explanation)\n\nText: "${text}"`;

  const payload = {
    model: DEFAULT_MODEL,
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'disaster_analysis',
        schema: {
          type: 'object',
          properties: {
            disaster_type: { type: 'string' },
            risk_level: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            confidence: { type: 'string' },
            summary: { type: 'string' }
          },
          required: ['disaster_type', 'risk_level', 'confidence', 'summary'],
          additionalProperties: false
        }
      }
    }
  };

  const data = await requestAIWithRetry(payload, apiKey);
  const outputText = data.output_text;
  const parsed = JSON.parse(outputText);

  return parsed;
}

async function analyzeDisasterText(text) {
  try {
    return await analyzeWithAI(text);
  } catch (error) {
    console.warn('AI analyze failed. Using fallback:', error.message);
    return fallbackAnalyze(text, error.message);
  }
}

async function getAIStatus() {
  const apiKey = (process.env.OPENAI_API_KEY || localConfig.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return {
      ok: false,
      reason: 'No API key configured (.env or backend/config/local.js).'
    };
  }

  try {
    await requestAIWithRetry(
      {
        model: DEFAULT_MODEL,
        input: 'Reply with JSON: {"ok":true}',
        max_output_tokens: 20
      },
      apiKey,
      1
    );

    return {
      ok: true,
      reason: `AI connected successfully using model ${DEFAULT_MODEL}.`
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.message
    };
  }
}

module.exports = {
  analyzeDisasterText,
  fallbackAnalyze,
  getAIStatus
};
