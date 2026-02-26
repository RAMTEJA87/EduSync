import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

export const generateQuizFromGroq = async ({ topic, difficulty, numQuestions, contextText }) => {
  // Note: Initialize Groq here so it picks up the latest PROCESS.ENV (incase user adds it dynamically via .env)
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_missing_key' });

  const prompt = `You are an expert AI educational content creator.
Generate exactly ${numQuestions} multiple choice questions.
Topic: ${topic}
Difficulty level: ${difficulty}

${contextText ? `Use the following reference material to strictly base your questions on:\n"""${contextText}"""\n` : ''}

Output STRICTLY in JSON format as a SINGLE object matching this exact structure containing a "questions" array:
{
  "questions": [
    {
      "questionText": "What is ...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "topicTag": "${topic}"
    }
  ]
}
No markdown formatting or conversational text. Only return the raw JSON block. Ensure exactly 4 options per question.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const rawJsonContent = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawJsonContent);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Groq API returned an invalid JSON schema");
    }

    return parsed.questions;
  } catch (error) {
    console.error("Groq API inference failed:", error);
    throw new Error("Failed to generate quiz from Groq API.");
  }
};
