import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function check() {
  try {
    console.log("Testing OpenAI key...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello!" }],
      max_tokens: 10,
    });
    console.log("Success! Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Error:", error.message);
  }
}
check();
