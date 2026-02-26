import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Upload, Users, ShieldAlert, Zap, LogOut, ChevronDown, X, FileText, BrainCircuit, Trash2, TrendingUp } from 'lucide-react';
import api from '../../api/axios';

const defaultRadarData = [
    { subject: 'Arrays', A: 150, fullMark: 150 },
    { subject: 'Trees', A: 150, fullMark: 150 },
    { subject: 'Sorting', A: 150, fullMark: 150 },
    { subject: 'Graphs', A: 150, fullMark: 150 },
    { subject: 'DP', A: 150, fullMark: 150 },
    { subject: 'HashMaps', A: 150, fullMark: 150 },
];

const TeacherDashboard = () => {
    const navigate = useNavigate();

    const [structures, setStructures] = useState([]);
    const [selectedContextId, setSelectedContextId] = useState('');
    const [analytics, setAnalytics] = useState({
        totalStudents: 0,
        activeQuizzes: 0,
        highRiskCount: 0,
        avgAccuracy: 0,
        radarData: defaultRadarData,
        highRiskStudents: [],
        recentQuizzes: [],
        recentMaterials: [],
        allStudents: []
    });

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadContextId, setUploadContextId] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [quizForm, setQuizForm] = useState({
        targetAudienceId: '',
        topic: '',
        difficulty: 'MEDIUM',
        numQuestions: 5,
        contextText: '',
        document: null
    });
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    useEffect(() => {
        // Fetch public academic structures
        api.get('/api/academic/public')
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setStructures([{ _id: 'all', year: 'All', branch: 'Sections', section: '(Global)' }, ...res.data]);
                    setSelectedContextId('all');
                }
            })
            .catch((err) => console.error("Failed fetching structures:", err));
    }, []);

    useEffect(() => {
        if (!selectedContextId) return;

        api.get(`/api/academic/${selectedContextId}/analytics`)
            .then((res) => {
                if (res.data && !res.data.message) {
                    setAnalytics(res.data);
                }
            })
            .catch((err) => console.error("Failed fetching analytics:", err));
    }, [selectedContextId]);

    const handleContextChange = (e) => {
        setSelectedContextId(e.target.value);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFile) return alert("Please select a file to upload.");
        if (!uploadContextId) return alert("Please select a target section.");

        setIsUploading(true);
        const formData = new FormData();
        formData.append('document', uploadFile);
        formData.append('title', uploadTitle);
        formData.append('academicContextId', uploadContextId);

        try {
            await api.post('/api/materials/upload', formData);
            alert("Notes uploaded successfully!");
            setIsUploadModalOpen(false);
            setUploadTitle('');
            setUploadFile(null);
            setUploadContextId('');

            if (selectedContextId) {
                const refreshRes = await api.get(`/api/academic/${selectedContextId}/analytics`);
                if (refreshRes.data) {
                    setAnalytics(refreshRes.data);
                }
            }
        } catch (error) {
            console.error(error);
            alert(error?.response?.data?.message || "Error uploading file.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this AI Quiz and all associated student results?')) return;
        try {
            await api.delete(`/api/quiz/${quizId}`);
            setAnalytics(prev => ({ ...prev, recentQuizzes: prev.recentQuizzes.filter(q => q._id !== quizId) }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete these class notes? Students will lose access immediately.')) return;
        try {
            await api.delete(`/api/materials/${materialId}`);
            setAnalytics(prev => ({ ...prev, recentMaterials: prev.recentMaterials.filter(m => m._id !== materialId) }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        if (!quizForm.targetAudienceId) return alert("Select a target class section.");
        if (!quizForm.topic) return alert("Enter a topic name.");

        setIsGeneratingQuiz(true);
        const formData = new FormData();
        formData.append('targetAudienceId', quizForm.targetAudienceId);
        formData.append('topic', quizForm.topic);
        formData.append('difficulty', quizForm.difficulty);
        formData.append('numQuestions', quizForm.numQuestions);
        formData.append('contextText', quizForm.contextText);
        if (quizForm.document) {
            formData.append('document', quizForm.document);
        }

        try {
            await api.post('/api/quiz/generate', formData);
            alert("AI Quiz Generated successfully!");
            setIsQuizModalOpen(false);
            setQuizForm({ targetAudienceId: '', topic: '', difficulty: 'MEDIUM', numQuestions: 5, contextText: '', document: null });
            // Refresh analytics to show the newly added quiz natively!
            if (selectedContextId) {
                const refreshRes = await api.get(`/api/academic/${selectedContextId}/analytics`);
                if (refreshRes.data) {
                    setAnalytics(refreshRes.data);
                }
            }

        } catch (error) {
            console.error(error);
            alert(error?.response?.data?.message || "Error generating quiz.");
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight text-text-primary mb-2">Command Center</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <p className="text-text-secondary">Class AI Insights & Content Management</p>

                        {/* Selected Structure Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedContextId}
                                onChange={handleContextChange}
                                className="appearance-none bg-primary-light/10 border border-primary/20 text-primary font-semibold rounded-[var(--radius-sm)] pl-3 pr-8 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer text-sm"
                            >
                                {structures.length === 0 && <option value="" disabled>No Data Available</option>}
                                {structures.map(s => (
                                    <option key={s._id} value={s._id} className="bg-surface text-text-primary">
                                        Year {s.year} • {s.branch} • Sec {s.section}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-primary absolute right-2 top-2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={() => setIsQuizModalOpen(true)} className="flex items-center gap-2 text-sm !border-primary/30 text-primary hover:text-primary-light hover:bg-primary/5">
                        <BrainCircuit className="w-4 h-4" />
                        Generate AI Quiz
                    </Button>
                    <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 text-sm">
                        <Upload className="w-4 h-4" />
                        Upload Notes
                    </Button>
                    <Button variant="danger" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="flex items-center gap-2 text-sm">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { title: 'Total Students', value: analytics.totalStudents, icon: <Users />, color: 'var(--color-primary-base)', bgClass: 'bg-primary-light/10' },
                    { title: 'Active Quizzes', value: analytics.activeQuizzes, icon: <Zap />, color: 'var(--color-warning-base)', bgClass: 'bg-warning/10' },
                    { title: 'High Risk Alert', value: analytics.highRiskCount, icon: <ShieldAlert />, color: 'var(--color-danger-base)', bgClass: 'bg-danger/10', alert: analytics.highRiskCount > 0 },
                    { title: 'Avg. Accuracy', value: `${analytics.avgAccuracy}%`, icon: <TrendingUp />, color: 'var(--color-success-base)', bgClass: 'bg-success/10' },
                ].map((stat, i) => (
                    <Card key={i} className={`p-6 flex flex-col justify-between group hover:shadow-level2 transition-all ${stat.alert ? 'border-danger flex-row items-center justify-start gap-4' : 'h-32'}`}>
                        {stat.alert ? (
                            <>
                                <div className={`p-3 rounded-xl ${stat.bgClass} text-danger shrink-0`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <h3 className="text-text-secondary text-sm font-medium">{stat.title}</h3>
                                    <div className="text-3xl font-heading font-bold text-danger mt-1">{stat.value}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-start w-full">
                                    <h3 className="text-text-secondary text-sm font-medium">{stat.title}</h3>
                                    <div className={`p-2 rounded-lg ${stat.bgClass}`} style={{ color: stat.color }}>
                                        {React.cloneElement(stat.icon, { className: 'w-4 h-4' })}
                                    </div>
                                </div>
                                <div className="text-3xl font-heading font-bold text-text-primary mt-2">{stat.value}</div>
                            </>
                        )}
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Column: Radar */}
                <Card className="p-6 h-96 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-xl font-heading font-bold text-text-primary">Class Mastery Radar</h3>
                        <p className="text-sm text-text-secondary">Identify structural weak spots across the selected section</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={analytics.radarData || defaultRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                <PolarGrid stroke="var(--color-border-subtle)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="Class Avg" dataKey="A" stroke="var(--color-primary-base)" fill="var(--color-primary-base)" fillOpacity={0.4} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-surface-base)', borderColor: 'var(--color-border-base)', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ color: 'var(--color-primary-base)', fontWeight: 'bold' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Right Column: High Risk Students + Recent Content */}
                <div className="space-y-6">
                    <Card className="p-6 h-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldAlert className="w-5 h-5 text-danger" />
                            <h3 className="text-lg font-heading font-bold text-text-primary">High Risk Students</h3>
                        </div>
                        {!analytics.highRiskStudents || analytics.highRiskStudents.length === 0 ? (
                            <div className="p-4 bg-surface-alt border border-border-subtle rounded-[var(--radius-sm)] flex items-center justify-center">
                                <p className="text-sm text-success font-medium">No high-risk students detected.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {analytics.highRiskStudents.slice(0, 4).map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-border-base bg-surface hover:border-danger hover:shadow-level1 transition-all">
                                        <span className="text-sm font-semibold text-text-primary">{s.name}</span>
                                        <Badge color="danger">Risk: {s.riskVal}%</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 h-auto flex flex-col">
                            <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Recent Quizzes</h3>
                            <div className="flex-1 flex flex-col justify-start">
                                {!analytics.recentQuizzes || analytics.recentQuizzes.length === 0 ? (
                                    <p className="text-sm text-text-secondary bg-surface-alt p-3 rounded-[var(--radius-sm)] border border-border-subtle">No quizzes yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {analytics.recentQuizzes.slice(0, 3).map((q) => (
                                            <div key={q._id} className="flex items-start justify-between bg-surface-alt border border-border-base rounded-[var(--radius-md)] p-3 group hover:border-border-hover transition-colors">
                                                <div className="pr-2">
                                                    <p className="text-sm text-text-primary font-semibold line-clamp-1">{q.topic}</p>
                                                    <p className="text-xs text-text-secondary mt-1">{q.difficulty} • {q.questions?.length || 0} Qs</p>
                                                </div>
                                                <button onClick={() => handleDeleteQuiz(q._id)} className="text-text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="p-6 h-auto flex flex-col">
                            <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Recent Materials</h3>
                            <div className="flex-1 flex flex-col justify-start">
                                {!analytics.recentMaterials || analytics.recentMaterials.length === 0 ? (
                                    <p className="text-sm text-text-secondary bg-surface-alt p-3 rounded-[var(--radius-sm)] border border-border-subtle">No materials uploaded.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {analytics.recentMaterials.slice(0, 3).map((m) => (
                                            <div key={m._id} className="flex items-start justify-between bg-surface-alt border border-border-base rounded-[var(--radius-md)] p-3 group hover:border-border-hover transition-colors">
                                                <div className="pr-2">
                                                    <p className="text-sm text-text-primary font-semibold line-clamp-1">{m.title}</p>
                                                    <p className="text-xs text-text-secondary mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => handleDeleteMaterial(m._id)} className="text-text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Comprehensive Student Analytics Table */}
            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-border-base flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-light/10 text-primary">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-heading font-bold text-text-primary">Comprehensive Student Analytics</h3>
                        <p className="text-sm text-text-secondary">Detailed individual performance metrics for this section</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface-alt border-b border-border-base">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Roll No.</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Student Name</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-center">Avg Quiz Accuracy</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Top Weakness</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-center">Risk Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle bg-surface">
                            {!analytics.allStudents || analytics.allStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-text-secondary italic">No students found for this section.</td>
                                </tr>
                            ) : (
                                analytics.allStudents.map((student, i) => (
                                    <tr key={student._id || i} className="hover:bg-surface-alt/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-text-secondary">{student.rollNumber || `N/A`}</td>
                                        <td className="px-6 py-4 font-medium text-text-primary">{student.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge color={student.avgAccuracy >= 80 ? 'success' : student.avgAccuracy >= 50 ? 'warning' : 'danger'}>
                                                {student.avgAccuracy}%
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-primary font-medium">
                                            {student.weakness}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge color={student.riskLevel === 'HIGH' ? 'danger' : student.riskLevel === 'MEDIUM' ? 'warning' : 'success'} className="px-3">
                                                {student.riskLevel}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Upload Notes Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-base/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-md">
                        <Card className="p-6 border-primary/30 shadow-level3">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-heading text-text-primary flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" /> Upload Class Notes
                                </h3>
                                <button onClick={() => setIsUploadModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUploadSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Section</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={uploadContextId}
                                            onChange={e => setUploadContextId(e.target.value)}
                                            className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                                        >
                                            <option value="" disabled>Select a Section</option>
                                            {structures.filter(s => s._id !== 'all').map(s => (
                                                <option key={s._id} value={s._id}>
                                                    Year {s.year} • {s.branch} • Sec {s.section}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-primary absolute right-4 top-3.5 pointer-events-none" />
                                    </div>
                                    <p className="text-xs text-text-muted mt-1.5">Only students mapped to this section can access these notes.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Document Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={uploadTitle}
                                        onChange={e => setUploadTitle(e.target.value)}
                                        placeholder="e.g. Chapter 4: Dynamic Programming"
                                        className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Upload File (PDF, DOC, IMG)</label>
                                    <input
                                        type="file"
                                        required
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        onChange={e => setUploadFile(e.target.files[0])}
                                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-sm)] file:border-0 file:text-sm file:font-bold file:bg-primary-light/10 file:text-primary hover:file:bg-primary-light/20 transition-all cursor-pointer"
                                    />
                                </div>
                                <div className="pt-2">
                                    <Button disabled={isUploading} type="submit" variant="primary" className="w-full flex items-center justify-center gap-2">
                                        <Upload className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Publish to Class'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            )}

            {/* Groq AI Quiz Generator Modal */}
            {isQuizModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-base/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <Card className="p-6 border-primary/50 shadow-level3">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-heading text-text-primary flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-primary" /> AI Quiz Generator
                                </h3>
                                <button onClick={() => setIsQuizModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleQuizSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Section</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={quizForm.targetAudienceId}
                                            onChange={e => setQuizForm({ ...quizForm, targetAudienceId: e.target.value })}
                                            className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                                        >
                                            <option value="" disabled>Select Target Class</option>
                                            {structures.filter(s => s._id !== 'all').map(s => (
                                                <option key={s._id} value={s._id}>
                                                    Year {s.year} • {s.branch} • Sec {s.section}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-primary absolute right-4 top-3.5 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Topic Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={quizForm.topic}
                                            onChange={e => setQuizForm({ ...quizForm, topic: e.target.value })}
                                            placeholder="e.g. Heaps & Priorities"
                                            className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Difficulty</label>
                                        <div className="relative">
                                            <select
                                                value={quizForm.difficulty}
                                                onChange={e => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                                                className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                                            >
                                                <option value="EASY">Easy</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HARD">Hard</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-primary absolute right-4 top-3.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Number of Questions</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={quizForm.numQuestions}
                                        onChange={e => setQuizForm({ ...quizForm, numQuestions: e.target.value })}
                                        className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Optional Source Context (Text)</label>
                                    <textarea
                                        rows="3"
                                        value={quizForm.contextText}
                                        onChange={e => setQuizForm({ ...quizForm, contextText: e.target.value })}
                                        placeholder="Paste specific paragraphs, notes, or code to restrict the AIs knowledge base."
                                        className="w-full bg-surface-alt border border-border-base rounded-[var(--radius-md)] px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">... OR Upload Source Material (PDF, DOC)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={e => setQuizForm({ ...quizForm, document: e.target.files[0] })}
                                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-sm)] file:border-0 file:text-sm file:font-semibold file:bg-primary-light/10 file:text-primary hover:file:bg-primary-light/20 transition-all cursor-pointer"
                                    />
                                </div>
                                <div className="pt-4 border-t border-border-subtle mt-2">
                                    <Button disabled={isGeneratingQuiz} type="submit" variant="primary" className="w-full py-3 flex items-center justify-center gap-2">
                                        <BrainCircuit className="w-5 h-5" /> {isGeneratingQuiz ? 'AI is processing...' : 'Generate Target Quiz'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

export default TeacherDashboard;
