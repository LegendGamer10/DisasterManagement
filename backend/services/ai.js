const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const localConfig = require('../config/local');

// Rule-based fallback if AI call fails for any reason.
function fallbackAnalyze(text) {
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
    summary: 'Fallback analysis used due to AI service unavailability.'
  };
}

async function analyzeWithAI(text) {
  const apiKey = process.env.OPENAI_API_KEY || localConfig.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured in .env or backend/config/local.js');
  }

  const prompt = `Analyze the following text and determine if it describes a disaster.\n\nReturn JSON with:\n- disaster_type (any relevant disaster)\n- risk_level (Low, Medium, High)\n- confidence (percentage)\n- summary (short explanation)\n\nText: "${text}"`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
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
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const outputText = data.output_text;
  const parsed = JSON.parse(outputText);

  return parsed;
}

async function analyzeDisasterText(text) {
  try {
    return await analyzeWithAI(text);
  } catch (error) {
    console.warn('AI analyze failed. Using fallback:', error.message);
    return fallbackAnalyze(text);
  }
}

module.exports = {
  analyzeDisasterText,
  fallbackAnalyze
};
