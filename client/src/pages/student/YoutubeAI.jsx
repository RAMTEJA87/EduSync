import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Search, Play, FileText, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../components/common/GlassCard';

const YoutubeAI = () => {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleProcess = async (e) => {
        e.preventDefault();
        if (!url) return;
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ai/youtube', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                alert("Failed to analyze the YouTube video. Check URL.");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to AI service.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen relative">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-outfit font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <Video className="w-8 h-8 text-red-500" /> YouTube AI Summarizer
                </h1>
                <p className="text-slate-400">Paste any educational YouTube link and let AI extract the core concepts.</p>
            </div>

            <GlassCard className="mb-8 border border-red-500/20 max-w-3xl">
                <form onSubmit={handleProcess} className="flex gap-4">
                    <div className="relative flex-1">
                        <input
                            type="url"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 pl-12"
                        />
                        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                    </div>
                    <button type="submit" disabled={isProcessing} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all flex items-center gap-2">
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Play className="w-4 h-4" /> Summarize</>
                        )}
                    </button>
                </form>
            </GlassCard>

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GlassCard className="border border-white/10">
                        <div className="aspect-video bg-black/50 rounded-lg mb-6 flex items-center justify-center border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-red-500/10 group-hover:bg-red-500/20 transition-colors" />
                            <Play className="w-16 h-16 text-white/50 group-hover:text-red-500 transition-colors z-10" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">{result.title}</h2>
                        <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full">Extracted via AI</span>
                    </GlassCard>

                    <GlassCard className="border border-white/10 flex flex-col space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                <FileText className="w-5 h-5 text-slate-400" /> AI Summary
                            </h3>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {result.summary}
                            </p>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-xl p-6 border border-white/5">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Key Takeaways</h4>
                            <ul className="space-y-3">
                                {result.keyPoints.map((point, idx) => (
                                    <li key={idx} className="flex gap-3 items-start">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-200">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default YoutubeAI;
