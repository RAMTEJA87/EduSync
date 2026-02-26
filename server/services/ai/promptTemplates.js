// ─── Centralized Prompt Templates for EduSync AI ──────────────────
// All prompts enforce structured JSON output, academic tone,
// grade-level adaptation, and anti-hallucination directives.

const SUPPORTED_LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish'];

const validateLanguage = (lang) => {
  if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) return 'English';
  return lang;
};

// ─── System Preamble ──────────────────────────────────────────────
const SYSTEM_PREAMBLE = `You are an expert educational AI assistant for the EduSync learning platform.
You MUST respond strictly in valid JSON format. Do not include any text, explanation, or commentary outside the JSON object.
Maintain a professional academic tone at all times.
Only provide factually accurate information. If uncertain, state it explicitly within your structured response.
Never fabricate citations, statistics, or references.`;

// ─── YouTube Summarizer ───────────────────────────────────────────
export const buildYoutubeSummaryPrompt = ({ transcript, language = 'English' }) => {
  const lang = validateLanguage(language);
  const langDirective = lang !== 'English'
    ? `\nGenerate the entire response in ${lang}. Maintain academic terminology accurately.`
    : '';

  return {
    system: `${SYSTEM_PREAMBLE}
You specialize in analyzing educational video transcripts and producing structured summaries.${langDirective}`,
    user: `Analyze the following educational video transcript and produce a comprehensive structured summary.

TRANSCRIPT:
"""
${transcript}
"""

Respond STRICTLY in this JSON format. No extra text outside JSON:
{
  "title": "A descriptive title for the video content",
  "summary": "A comprehensive 2-3 paragraph summary of the entire video content",
  "keyConcepts": [
    {
      "concept": "Name of the concept",
      "explanation": "Clear 1-2 sentence explanation"
    }
  ],
  "detailedNotes": [
    {
      "topic": "Section topic",
      "content": "Detailed notes for this section"
    }
  ],
  "practiceQuestions": [
    {
      "question": "A practice question based on the content",
      "hint": "A brief hint for the answer"
    }
  ],
  "timestamps": []
}

Rules:
- Provide 4-6 key concepts
- Provide 3-5 detailed note sections
- Generate 3-5 practice questions
- The timestamps array can be empty if not inferable from transcript
- All content must be factually derived from the transcript
- Do NOT hallucinate or add information not present in the transcript`
  };
};

// ─── Doubt Solver ─────────────────────────────────────────────────
export const buildDoubtSolverPrompt = ({ question, weakTopics = [], gradeContext = '', recentPerformance = '' }) => {
  const weaknessStr = weakTopics.length > 0
    ? `Known weak topics: ${weakTopics.join(', ')}.`
    : 'No specific weak topics identified.';

  const gradeStr = gradeContext ? `Academic context: ${gradeContext}.` : '';
  const perfStr = recentPerformance ? `Recent performance: ${recentPerformance}.` : '';

  return {
    system: `${SYSTEM_PREAMBLE}
You are a patient, step-by-step academic tutor. You explain concepts thoroughly, adapting to the student's level.
${gradeStr}
${weaknessStr}
${perfStr}
Tailor your explanation considering the student's known weaknesses.
Always encourage understanding over memorization.`,
    user: `Student's question: "${question}"

Respond STRICTLY in this JSON format. No extra text outside JSON:
{
  "answer": "A clear, comprehensive answer to the question (2-4 sentences)",
  "explanationSteps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "relatedConcepts": [
    {
      "concept": "Related concept name",
      "relevance": "Why this is relevant to the question"
    }
  ],
  "suggestedPractice": [
    "A practice exercise or question to reinforce understanding"
  ]
}

Rules:
- Provide 3-5 explanation steps
- Provide 2-4 related concepts
- Provide 2-3 suggested practice items
- Be accurate and educational
- Do NOT hallucinate facts
- If you don't know something, say so in the answer field`
  };
};

// ─── Smart Revision Planner ───────────────────────────────────────
export const buildSmartRevisionPrompt = ({ weakTopics = [], riskLevel = 'LOW', recentQuizScores = [], language = 'English' }) => {
  const lang = validateLanguage(language);
  const langDirective = lang !== 'English'
    ? `\nGenerate the entire response in ${lang}. Maintain academic terminology accurately.`
    : '';

  const topicsStr = weakTopics.length > 0
    ? weakTopics.map(t => `${t.topicName} (failed ${t.failureCount} times)`).join(', ')
    : 'General review needed';

  const scoresStr = recentQuizScores.length > 0
    ? recentQuizScores.map(s => `${s.accuracy}% accuracy`).join(', ')
    : 'No recent quiz data';

  return {
    system: `${SYSTEM_PREAMBLE}
You are an expert study planner that creates personalized 7-day revision strategies.
Adapt the intensity based on the student's risk level and weak areas.${langDirective}`,
    user: `Create a personalized 7-day revision plan for a student with the following profile:

Weak Topics: ${topicsStr}
Risk Level: ${riskLevel}
Recent Quiz Performance: ${scoresStr}

Respond STRICTLY in this JSON format. No extra text outside JSON:
{
  "overview": "A brief 2-3 sentence overview of the revision strategy",
  "days": [
    {
      "day": 1,
      "focusTopics": ["Topic 1", "Topic 2"],
      "subtopics": ["Subtopic detail 1", "Subtopic detail 2"],
      "recommendedPractice": ["Practice activity 1", "Practice activity 2"],
      "timeAllocation": "2 hours"
    }
  ],
  "revisionStrategy": "Overall strategy tips and motivation (2-3 sentences)"
}

Rules:
- Generate exactly 7 days
- Each day should have 1-3 focus topics
- Prioritize weak topics with highest failure counts in early days
- HIGH risk students get more intensive plans
- LOW risk students get maintenance/reinforcement plans
- Be specific with practice recommendations
- Time allocations should be realistic (1-3 hours per day)
- Do NOT hallucinate topic names — only use the weak topics provided`
  };
};

// ─── Quiz Explanation (Future-Proof) ──────────────────────────────
export const buildQuizExplanationPrompt = ({ question, options, correctIndex, studentAnswer }) => {
  return {
    system: `${SYSTEM_PREAMBLE}
You explain quiz answers clearly and educationally.`,
    user: `Explain this quiz question result:

Question: ${question}
Options: ${JSON.stringify(options)}
Correct Answer: Option ${correctIndex + 1} (${options[correctIndex]})
Student's Answer: Option ${studentAnswer + 1} (${options[studentAnswer]})

Respond STRICTLY in this JSON format:
{
  "explanation": "Clear explanation of the correct answer",
  "whyCorrect": "Why the correct option is right",
  "whyWrong": "Why the student's choice was incorrect (skip if they got it right)",
  "conceptToReview": "The key concept to review"
}`
  };
};

// ─── Multilingual Wrapper ─────────────────────────────────────────
export const wrapMultilingual = (prompt, language) => {
  const lang = validateLanguage(language);
  if (lang === 'English') return prompt;
  return `${prompt}\n\nIMPORTANT: Generate the entire response in ${lang}. Maintain academic terminology with accurate translations. Ensure all JSON keys remain in English.`;
};

export { SUPPORTED_LANGUAGES, validateLanguage };
