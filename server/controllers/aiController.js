import { summarizeYoutubeVideo } from '../services/ai/youtubeSummarizerService.js';
import { solveDoubt } from '../services/ai/doubtSolverService.js';
import { generateRevisionPlan } from '../services/ai/smartRevisionService.js';
import { SUPPORTED_LANGUAGES } from '../services/ai/promptTemplates.js';

// ─── YouTube AI Summarizer ────────────────────────────────────────
export const summarizeYoutube = async (req, res) => {
  try {
    const { url, language } = req.body;
    const userId = req.user?._id?.toString() || 'unknown';

    const result = await summarizeYoutubeVideo({ url, language, userId });
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status < 500
      ? error.message
      : 'An error occurred while processing the video. Please try again.';
    res.status(status).json({ error: message });
  }
};

// ─── AI Doubt Solver ──────────────────────────────────────────────
export const doubtSolverChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?._id?.toString() || 'unknown';

    const result = await solveDoubt({ message, userId });
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status < 500
      ? error.message
      : 'An error occurred while processing your question. Please try again.';
    res.status(status).json({ error: message });
  }
};

// ─── Smart Revision Generator ─────────────────────────────────────
export const generateSmartRevision = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || 'unknown';
    const language = req.query.language || 'English';

    const result = await generateRevisionPlan({ userId, language });
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status < 500
      ? error.message
      : 'An error occurred while generating your revision plan. Please try again.';
    res.status(status).json({ error: message });
  }
};

// ─── Get Supported Languages ──────────────────────────────────────
export const getSupportedLanguages = (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
};
