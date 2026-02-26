import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import Material from '../models/Material.js';
import { protect, roleGuard } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, roleGuard('STUDENT'), async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('academicContext');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all quiz results for the student
        const allQuizResults = await QuizResult.find({ studentId: userId }).sort({ createdAt: 1 }).populate('quizId', 'title');

        // 1. Learning Progression (Last 5 quiz scores)
        const progressionResults = allQuizResults.slice(-5);
        const progressionData = progressionResults.map((qr, index) => ({
            name: `Quiz ${index + 1}`,
            score: qr.accuracyPercentage
        }));

        // Detailed Quiz History
        const quizHistory = allQuizResults.slice(-5).reverse().map(qr => ({
            id: qr._id,
            title: qr.quizId ? qr.quizId.title : 'AI Quiz',
            score: qr.accuracyPercentage,
            date: qr.createdAt
        }));

        const attemptedQuizIds = allQuizResults.map(qr => qr.quizId ? qr.quizId._id : null).filter(Boolean);

        if (progressionData.length === 0) {
            progressionData.push({ name: 'Start Learning', score: 0 });
        }

        // 2. Available Quizzes (Filter out attempted)
        let availableQuizzes = [];
        if (user.academicContext) {
            availableQuizzes = await Quiz.find({
                targetAudience: user.academicContext._id,
                status: 'PUBLISHED',
                _id: { $nin: attemptedQuizIds }
            }).select('title baseDifficulty').limit(3);
        } else {
            availableQuizzes = await Quiz.find({
                status: 'PUBLISHED',
                _id: { $nin: attemptedQuizIds }
            }).select('title baseDifficulty').limit(3);
        }

        // 3. Recommended Resources (Materials uploaded for their class)
        let recommendedResources = [];
        if (user.academicContext) {
            recommendedResources = await Material.find({ academicContext: user.academicContext._id })
                .sort({ createdAt: -1 })
                .limit(3);
        }

        // Calculate risk percentage conceptually (High = 80-100%, Medium = 40-79%, Low = 0-39%)
        let riskScore = 15;
        let riskLabel = 'LOW';
        if (user.overallRiskLevel === 'HIGH') {
            riskScore = 85;
            riskLabel = 'HIGH';
        } else if (user.overallRiskLevel === 'MEDIUM') {
            riskScore = 54;
            riskLabel = 'MEDIUM';
        }

        const topWeakness = user.weakTopics && user.weakTopics.length > 0
            ? user.weakTopics[0].topicName
            : 'None detected yet';

        const dashboardData = {
            user: {
                name: user.name,
                contextString: user.academicContext
                    ? `${user.academicContext.branch} • Year ${user.academicContext.year} • Sec ${user.academicContext.section}`
                    : 'Unassigned',
                topWeakness
            },
            progressionData,
            availableQuizzes,
            riskMetrics: {
                score: riskScore,
                label: riskLabel
            },
            recommendedResources: recommendedResources.map(res => ({
                id: res._id,
                title: res.title,
                type: res.originalFileName.split('.').pop() || 'File',
                url: res.fileUrl
            })),
            quizHistory
        };

        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
