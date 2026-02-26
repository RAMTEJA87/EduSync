import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../components/common/GlassCard';
import { Clock, CheckCircle, ArrowRight, BrainCircuit, Youtube, HelpCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const QuizAttempt = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // States
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState(null);
    const [answers, setAnswers] = useState([]);

    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins default
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quiz/${id}/attempt`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuizData(data);
                    // Adjust timer based on questions (e.g., 2 mins per question)
                    const totalTime = data.questions ? data.questions.length * 120 : 15 * 60;
                    setTimeLeft(totalTime);
                } else {
                    console.error("Failed to load quiz");
                    navigate('/student/dashboard');
                }
            } catch (error) {
                console.error(error);
                navigate('/student/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id, navigate]);

    useEffect(() => {
        if (loading || result) return;
        const timer = setInterval(() => setTimeLeft((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                handleSubmit(true);
                return 0;
            }
            return prev > 0 ? prev - 1 : 0;
        }), 1000);
        return () => clearInterval(timer);
    }, [loading, result]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        if (!selectedOpt) return;

        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

        const newAnswer = {
            questionId: quizData.questions[currentIdx]._id,
            selectedOptionText: selectedOpt,
            timeSpent
        };

        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);
        setSelectedOpt(null);
        setQuestionStartTime(Date.now());

        if (currentIdx < quizData.questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            handleSubmit(false, updatedAnswers);
        }
    };

    const handleSubmit = async (autoSubmit = false, finalAnswers = answers) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const totalTimeRaw = quizData.questions ? quizData.questions.length * 120 : 15 * 60;
            const res = await fetch(`/api/quiz/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timeTakenSeconds: totalTimeRaw - timeLeft,
                    answers: finalAnswers
                })
            });

            if (res.ok) {
                const evalData = await res.json();
                setResult({
                    score: evalData.marksAssigned,
                    max: quizData.questions.length, // approximate scale base
                    accuracy: evalData.accuracyPercentage,
                    weakNodes: evalData.weakNodesDetected || [],
                    timeTaken: totalTimeRaw - timeLeft
                });
            } else {
                alert("Failed to submit quiz.");
                navigate('/student/dashboard');
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading Quiz...</div>;
    if (!quizData) return <div className="h-screen flex items-center justify-center text-red-500">Failed to load quiz.</div>;

    if (result) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <GlassCard className="max-w-md w-full text-center space-y-6">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${result.accuracy >= 60 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {result.accuracy >= 60 ? <CheckCircle className="text-green-400 w-10 h-10" /> : <HelpCircle className="text-red-400 w-10 h-10" />}
                    </div>
                    <h2 className="text-2xl font-outfit font-bold text-white">Quiz Evaluation Complete</h2>

                    <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-sm text-slate-400">
                            <span>Time Taken</span>
                            <span className="font-medium text-white">{formatTime(result.timeTaken)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-400">
                            <span>Accuracy</span>
                            <span className={`font-medium ${result.accuracy >= 60 ? 'text-green-400' : 'text-red-400'}`}>{Math.round(result.accuracy)}%</span>
                        </div>
                        <div className="h-px bg-white/10 w-full" />
                        <div className="flex justify-between items-center font-bold text-lg pt-2">
                            <span className="text-indigo-300">Marks Assigned</span>
                            <span className="text-white bg-indigo-500/20 px-3 py-1 rounded-lg">{result.score.toFixed(1)} Pts</span>
                        </div>
                    </div>

                    {result.weakNodes && result.weakNodes.length > 0 && (
                        <div className="text-left bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-4 space-y-4">
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-red-400 mb-2">
                                    <BrainCircuit className="w-4 h-4" /> Recommended Revisions
                                </h4>
                                <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                                    {Array.from(new Set(result.weakNodes)).map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>

                            <div className="border-t border-red-500/20 pt-4 mt-2">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                                    <Youtube className="w-4 h-4 text-red-500" /> Watch to overcome weakness
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {Array.from(new Set(result.weakNodes)).slice(0, 2).map((w, i) => (
                                        <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent("Learn " + w + " explanation")}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded border border-indigo-500/20 transition-colors flex justify-between items-center">
                                            <span className="truncate pr-2">Learn {w} on Youtube</span>
                                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={() => navigate('/student/dashboard')} className="cyber-button w-full mt-6">Return to Dashboard</button>
                </GlassCard>
            </div>
        );
    }

    const currentQ = quizData.questions[currentIdx];

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen relative">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h1 className="text-2xl font-outfit font-bold text-white max-w-xl truncate">{quizData.title}</h1>
                    <p className="text-slate-400 text-sm">Question {currentIdx + 1} of {quizData.questions.length}</p>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xl bg-indigo-500/10 px-4 py-2 rounded-xl backdrop-blur-md border border-indigo-500/20">
                    <Clock className="w-5 h-5" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <motion.div
                key={currentIdx}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
            >
                <GlassCard className="mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full" />

                    <h3 className="text-xl text-white font-medium mb-8 leading-relaxed relative z-10">
                        {currentQ.questionText}
                    </h3>

                    <div className="space-y-4 relative z-10">
                        {currentQ.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedOpt(opt)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${selectedOpt === opt
                                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-100 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
                                    : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border flex flex-shrink-0 items-center justify-center text-xs font-bold ${selectedOpt === opt ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-500 text-slate-500'
                                    }`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span>{opt}</span>
                            </button>
                        ))}
                    </div>
                </GlassCard>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={handleNext}
                        disabled={!selectedOpt || submitting}
                        className="cyber-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Evaluating...' : currentIdx === quizData.questions.length - 1 ? 'Submit Assignment' : 'Next Question'}
                        {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default QuizAttempt;
