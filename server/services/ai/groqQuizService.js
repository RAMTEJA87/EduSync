import { chatCompletion, safeParseJSON } from './groqClient.js';

export const generateQuizFromGroq = async ({ topic, difficulty, numQuestions, contextText }) => {
  const systemPrompt = `You are an expert AI educational content creator. You generate multiple choice quiz questions in strict JSON format. Never include markdown, conversational text, or explanations outside the JSON structure.`;

  const userPrompt = `Generate exactly ${numQuestions} multiple choice questions.
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
Ensure exactly 4 options per question. Each question should have a clear, unambiguous correct answer.`;

  try {
    const rawResponse = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 3000,
      jsonMode: true,
      requestType: 'quiz_generation',
    });

    const parsed = safeParseJSON(rawResponse, null);

    if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Groq API returned an invalid JSON schema");
    }

    return parsed.questions;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      service: 'groqQuizService',
      event: 'quiz_generation_failed',
      error: error.message,
    }));
    throw new Error("Failed to generate quiz from Groq API.");
  }
};
