import { getStudentDashboard } from '../services/studentService.js';

export const getStudentDashboardData = async (req, res) => {
    try {
        const dashboardData = await getStudentDashboard(req.user._id);
        res.json(dashboardData);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
