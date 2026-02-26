import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Zap, Brain, CheckCircle } from 'lucide-react';
import GlassCard from '../../components/common/GlassCard';

const mockRevisionNotes = [
    { title: "Big-O Notation Recap", content: "O(1) is constant, O(log N) is standard for trees/search, O(N) is linear, and O(N^2) is typical for nested loops (like bubble sort). Always aim for O(N log N) or better in array processing." },
    { title: "Binary Search Tree Properties", content: "Left sub-tree contains only nodes with values strictly less than the parent node. Right sub-tree contains only nodes strictly greater. No duplicates allowed in a standard BST." },
    { title: "Dynamic Programming Memoization", content: "Memoization implies top-down. You cache the function return values based on specific input parameters to avoid re-calculating subproblems. It's just recursion + a hash map!" }
];

const SmartRevision = () => {
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(true);
    const [revisionNotes, setRevisionNotes] = useState([]);

    const generateNotes = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ai/revision', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRevisionNotes(data);
            } else {
                alert("Failed to generate revision notes.");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to AI service.");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        generateNotes();
    }, []);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen relative">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-outfit font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <Cpu className="w-8 h-8 text-purple-400" /> Smart Revision Engine
                </h1>
                <p className="text-slate-400">Targeted AI flash-notes built from your recent weak areas.</p>
            </div>

            {isGenerating ? (
                <GlassCard className="h-64 flex flex-col items-center justify-center border border-purple-500/20">
                    <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 border-4 border-t-transparent border-r-transparent border-b-indigo-500 border-l-indigo-500 rounded-full animate-spin [animation-direction:reverse] opacity-70" />
                        <Brain className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Synthesizing Revision Profile...</h2>
                    <p className="text-sm text-slate-400">Analyzing your recent quiz errors against the global class syllabus.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {revisionNotes.map((note, idx) => (
                        <GlassCard key={idx} delay={idx * 0.1} className="flex flex-col h-72 border border-purple-500/20 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                            <div className="mb-4 flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                </div>
                                <h3 className="font-bold text-white leading-tight">{note.title}</h3>
                            </div>
                            <div className="flex-1 text-sm text-slate-300 leading-relaxed overflow-y-auto custom-scrollbar pr-2">
                                {note.content}
                            </div>
                            <button onClick={() => setRevisionNotes(prev => prev.filter((_, i) => i !== idx))} className="mt-4 w-full py-2 bg-purple-500/10 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 font-bold tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-colors">
                                <CheckCircle className="w-4 h-4" /> Got it
                            </button>
                        </GlassCard>
                    ))}
                    <div className="col-span-1 md:col-span-3 mt-4 flex justify-center">
                        <button onClick={generateNotes} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                            Generate Next Batch
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartRevision;
