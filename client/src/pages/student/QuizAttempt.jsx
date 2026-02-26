import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/common/Card';
import { Clock, CheckCircle, ArrowRight, BrainCircuit, Youtube, HelpCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

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
    const answersRef = useRef(answers);
    answersRef.current = answers;

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await api.get(`/api/quiz/${id}/attempt`);
                setQuizData(res.data);
                const totalTime = res.data.questions ? res.data.questions.length * 120 : 15 * 60;
                setTimeLeft(totalTime);
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
                handleSubmit(true, answersRef.current);
                return 0;
            }
            return prev > 0 ? prev - 1 : 0;
        }), 1000);
        return () => clearInterval(timer);
    }, [loading, result, quizData]);

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
            const totalTimeRaw = quizData.questions ? quizData.questions.length * 120 : 15 * 60;
            const res = await api.post(`/api/quiz/${id}/submit`, {
                timeTakenSeconds: totalTimeRaw - timeLeft,
                answers: finalAnswers
            });

            const evalData = res.data;
            setResult({
                score: evalData.marksAssigned,
                max: quizData.questions.length,
                accuracy: evalData.accuracyPercentage,
                weakNodes: evalData.weakNodesDetected || [],
                timeTaken: totalTimeRaw - timeLeft
            });
        } catch (error) {
            console.error(error);
            alert("Error submitting quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-text-primary">Loading Quiz...</div>;
    if (!quizData) return <div className="h-screen flex items-center justify-center text-danger">Failed to load quiz.</div>;

    if (result) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <Card className="max-w-md w-full text-center space-y-6 p-8">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${result.accuracy >= 60 ? 'bg-success/20' : 'bg-danger/20'}`}>
                        {result.accuracy >= 60 ? <CheckCircle className="text-success w-10 h-10" /> : <HelpCircle className="text-danger w-10 h-10" />}
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-text-primary">Quiz Evaluation Complete</h2>

                    <div className="p-4 bg-surface-alt/50 rounded-xl border border-border-base space-y-3">
                        <div className="flex justify-between items-center text-sm text-text-secondary">
                            <span>Time Taken</span>
                            <span className="font-medium text-text-primary">{formatTime(result.timeTaken)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-text-secondary">
                            <span>Accuracy</span>
                            <span className={`font-medium ${result.accuracy >= 60 ? 'text-success' : 'text-danger'}`}>{Math.round(result.accuracy)}%</span>
                        </div>
                        <div className="h-px bg-border-base w-full" />
                        <div className="flex justify-between items-center font-bold text-lg pt-2">
                            <span className="text-primary">Marks Assigned</span>
                            <span className="text-primary-hover bg-primary/10 px-3 py-1 rounded-lg">{result.score.toFixed(1)} Pts</span>
                        </div>
                    </div>

                    {result.weakNodes && result.weakNodes.length > 0 && (
                        <div className="text-left bg-danger/5 border border-danger/20 p-4 rounded-xl mt-4 space-y-4">
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-danger mb-2">
                                    <BrainCircuit className="w-4 h-4" /> Recommended Revisions
                                </h4>
                                <ul className="text-xs text-text-secondary list-disc pl-4 space-y-1">
                                    {Array.from(new Set(result.weakNodes)).map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>

                            <div className="border-t border-danger/20 pt-4 mt-2">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
                                    <Youtube className="w-4 h-4 text-danger" /> Watch to overcome weakness
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {Array.from(new Set(result.weakNodes)).slice(0, 2).map((w, i) => (
                                        <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent("Learn " + w + " explanation")}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded border border-primary/20 transition-colors flex justify-between items-center">
                                            <span className="truncate pr-2">Learn {w} on Youtube</span>
                                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={() => navigate('/student/dashboard')} className="w-full mt-6 px-6 py-3 bg-primary text-text-inverse rounded-xl font-semibold hover:bg-primary-hover transition-colors">Return to Dashboard</button>
                </Card>
            </div>
        );
    }

    const currentQ = quizData.questions[currentIdx];

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen relative">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-text-primary max-w-xl truncate">{quizData.title}</h1>
                    <p className="text-text-secondary text-sm">Question {currentIdx + 1} of {quizData.questions.length}</p>
                </div>
                <div className="flex items-center gap-2 text-primary font-mono text-xl bg-primary/10 px-4 py-2 rounded-xl backdrop-blur-md border border-primary/20">
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
                <Card className="mb-6 relative overflow-hidden bg-surface-base">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                    <h3 className="text-xl text-text-primary font-medium mb-8 leading-relaxed relative z-10">
                        {currentQ.questionText}
                    </h3>

                    <div className="space-y-4 relative z-10">
                        {currentQ.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedOpt(opt)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${selectedOpt === opt
                                    ? 'border-primary bg-primary/10 text-primary shadow-lg'
                                    : 'border-border-base bg-surface-alt text-text-secondary hover:border-primary/50 hover:bg-surface-hover'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border flex flex-shrink-0 items-center justify-center text-xs font-bold transition-colors ${selectedOpt === opt ? 'border-primary bg-primary text-white' : 'border-border-base text-text-secondary'
                                    }`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span>{opt}</span>
                            </button>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={handleNext}
                        disabled={!selectedOpt || submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-text-inverse rounded-xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
