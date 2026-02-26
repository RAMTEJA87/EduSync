import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizAttempt from './pages/student/QuizAttempt';
import YoutubeAI from './pages/student/YoutubeAI';
import AIDoubtSolver from './pages/student/AIDoubtSolver';
import SmartRevision from './pages/student/SmartRevision';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-obsidian text-slate-200">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/quiz/:id" element={<QuizAttempt />} />
          <Route path="/student/youtube" element={<YoutubeAI />} />
          <Route path="/student/doubt-solver" element={<AIDoubtSolver />} />
          <Route path="/student/smart-revision" element={<SmartRevision />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
