import Groq from 'groq-sdk';
import User from '../models/User.js';

export const summarizeYoutube = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: "URL is required" });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Mock extract transcript since we can't easily get the true transcript without youtube-transcript API
        // For production, a youtube transcript extractor would be used.
        // We will just prompt Groq to summarize the entity described in the URL (which usually works for popular videos)
        const prompt = `You are an AI educational assistant. Analyze this YouTube video URL: ${url}. 
        Provide a comprehensive summary of what the topic of this video likely represents, assuming it is an educational video.
        Respond STRICTLY in JSON with this format:
        {
          "title": "A relevant title for this video topic",
          "summary": "A detailed 2-3 paragraph summary of the topic",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"]
        }`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const rawJsonContent = response.choices[0]?.message?.content || '{}';
        res.json(JSON.parse(rawJsonContent));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const doubtSolverChat = async (req, res) => {
    try {
        const { message } = req.body;
        const user = await User.findById(req.user._id);

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const weaknessContext = user?.weakTopics?.map(t => t.topicName).join(', ') || 'General Studies';

        const prompt = `You are a helpful 24/7 AI academic doubt solver contextually aware of the student.
        The student's current weak topics are: ${weaknessContext}. 
        Answer the following student query concisely (max 3 sentences) but thoroughly:
        Student: ${message}`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5
        });

        res.json({ reply: response.choices[0]?.message?.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const generateSmartRevision = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const weaknesses = user?.weakTopics?.map(t => t.topicName).join(', ');

        const prompt = `You are a Smart Revision Engine. Create targeted flash-notes for a student whose current weak areas are: ${weaknesses || 'Computer Science fundamentals'}.
        Generate exactly 3 specific, actionable revision notes targeted to help them overcome these weaknesses.
        Respond STRICTLY in JSON format:
        {
          "notes": [
            { "title": "Note Title", "content": "Detailed explanation and tips (around 3 sentences)" }
          ]
        }`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const rawJsonContent = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawJsonContent);

        res.json(parsed.notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
