/**
 * Calls OpenAI text completion to estimate nutrition from a text description.
 * Falls back to direct browser fetch when serverless /api routes are unavailable.
 */
export async function analyzeTextNutrition(query: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  // Try the serverless API route first (works in production / vercel dev)
  try {
    const res = await fetch('/api/text-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (res.ok) {
      const text = await res.text();
      if (text) return JSON.parse(text);
    }
  } catch (_) {
    // Serverless route unavailable — fall through to direct call
  }

  // Direct OpenAI call from the browser (dev only — key is VITE_ prefixed)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Estimate nutritional content of food items.',
        },
        {
          role: 'user',
          content: `Estimate the nutritional content for: "${query}". Return ONLY a valid JSON object with no markdown: {"name":"Food Name","calories":200,"protein":5,"carbs":40,"fat":3}`,
        },
      ],
      max_tokens: 120,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'OpenAI API error');
  }

  const data = await res.json();
  const raw = data.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Calls OpenAI vision to analyze a food image (base64 data URL).
 */
export async function analyzeImageNutrition(base64DataUrl: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  // Try serverless first
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64DataUrl }),
    });
    if (res.ok) {
      const text = await res.text();
      if (text) return JSON.parse(text);
    }
  } catch (_) {
    // fall through
  }

  // Direct browser call
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Estimate the nutritional content of the food in this image. Return ONLY a valid JSON object: {"name":"Food Name","calories":500,"protein":30,"carbs":40,"fat":20}',
            },
            { type: 'image_url', image_url: { url: base64DataUrl } },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'OpenAI API error');
  }

  const data = await res.json();
  const raw = data.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}
