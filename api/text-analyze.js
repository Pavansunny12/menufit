import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast, cheap, and capable
      messages: [
        {
          role: "system",
          content: "You are a helpful nutrition expert. Estimate the nutritional content of the requested food."
        },
        {
          role: "user",
          content: `Estimate the nutritional content for: "${query}". Return ONLY a valid JSON object in this exact format, with no markdown formatting or other text: {"name": "Food Name", "calories": 500, "protein": 30, "carbs": 40, "fat": 20}`
        }
      ],
      max_tokens: 150,
    });

    const resultText = response.choices[0].message.content;
    const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    res.status(200).json(result);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
}
