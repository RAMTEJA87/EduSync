import express from 'express';
import AcademicStructure from '../models/AcademicStructure.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import Material from '../models/Material.js';
import { protect, roleGuard } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public', async (req, res) => {
    try {
        const structures = await AcademicStructure.find({})
            .sort({ year: 1, branch: 1, section: 1 })
            .collation({ locale: 'en_US', numericOrdering: true });
        res.json(structures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id/analytics', protect, roleGuard('TEACHER', 'ADMIN'), async (req, res) => {
    try {
        const structureId = req.params.id;
        let students = [];

        if (structureId === 'all') {
            students = await User.find({ role: 'STUDENT' }).select('name email rollNumber overallRiskLevel weakTopics');
        } else {
            const structure = await AcademicStructure.findById(structureId).populate('students', 'name email rollNumber overallRiskLevel weakTopics');
            if (!structure) {
                return res.status(404).json({ message: 'Structure not found' });
            }
            students = structure.students || [];
        }

        const totalStudents = students.length;

        // Calc high risk
        const highRiskStudents = students.filter(s => s.overallRiskLevel === 'HIGH');
        const highRiskCount = highRiskStudents.length;

        // Calc Avg Accuracy
        const studentIds = students.map(s => s._id);
        const quizResults = await QuizResult.find({ studentId: { $in: studentIds } });

        let totalAccuracy = 0;
        let quizzesCount = quizResults.length;

        if (quizzesCount > 0) {
            totalAccuracy = quizResults.reduce((acc, curr) => acc + curr.accuracyPercentage, 0) / quizzesCount;
        }

        let activeQuizzesQuery = {};
        if (structureId !== 'all') {
            // Include global quizzes or quizzes strictly for this structure
            activeQuizzesQuery = { $or: [{ targetAudience: structureId }, { targetAudience: { $exists: false } }] };
        }

        const recentQuizzes = await Quiz.find(activeQuizzesQuery)
            .sort({ createdAt: -1 })
            .limit(6)
            .select('title baseDifficulty createdAt');

        const totalActiveQuizzes = await Quiz.countDocuments(activeQuizzesQuery);

        let activeMaterialsQuery = {};
        if (structureId !== 'all') {
            activeMaterialsQuery = { academicContext: structureId };
        }

        const recentMaterials = await Material.find(activeMaterialsQuery)
            .sort({ createdAt: -1 })
            .limit(6)
            .select('title mimetype fileUrl createdAt');

        // Mastery Radar
        const radarMap = {};
        students.forEach(s => {
            if (s.weakTopics) {
                s.weakTopics.forEach(wt => {
                    radarMap[wt.topicName] = (radarMap[wt.topicName] || 0) + wt.failureCount;
                });
            }
        });

        const defaultSubjects = ['Arrays', 'Trees', 'Sorting', 'Graphs', 'DP', 'HashMaps'];

        let radarData = defaultSubjects.map(sub => {
            const fails = radarMap[sub] || 0;
            const baseScore = 150;
            const penalty = fails * 10 > baseScore ? baseScore - 10 : fails * 10;
            const score = baseScore - penalty;
            return {
                subject: sub,
                A: score,
                fullMark: baseScore
            };
        });

        // Add dynamically discovered subjects
        Object.keys(radarMap).forEach(sub => {
            if (!defaultSubjects.includes(sub)) {
                const fails = radarMap[sub];
                const baseScore = 150;
                const penalty = fails * 10 > baseScore ? baseScore - 10 : fails * 10;
                radarData.push({ subject: sub, A: baseScore - penalty, fullMark: baseScore });
            }
        });

        const allStudentsData = students.map(s => {
            const sResults = quizResults.filter(qr => qr.studentId.toString() === s._id.toString());
            const avgAcc = sResults.length > 0 ? sResults.reduce((acc, curr) => acc + curr.accuracyPercentage, 0) / sResults.length : 0;
            return {
                _id: s._id,
                name: s.name,
                rollNumber: s.rollNumber,
                riskLevel: s.overallRiskLevel || 'LOW',
                avgAccuracy: Math.round(avgAcc),
                weakness: s.weakTopics && s.weakTopics.length > 0 ? s.weakTopics[0].topicName : 'None'
            };
        });

        res.json({
            totalStudents,
            activeQuizzes: totalActiveQuizzes,
            recentQuizzes,
            recentMaterials,
            highRiskCount,
            avgAccuracy: quizzesCount > 0 ? Math.round(totalAccuracy) : 0,
            radarData,
            highRiskStudents: highRiskStudents.map(s => ({
                _id: s._id,
                name: s.name,
                riskVal: 80 + Math.floor(Math.random() * 20), // Conceptual
                failedTopic: s.weakTopics && s.weakTopics.length > 0 ? s.weakTopics[0].topicName : 'N/A'
            })),
            allStudents: allStudentsData
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
