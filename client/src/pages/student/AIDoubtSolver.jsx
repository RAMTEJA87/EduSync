import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Bot, User } from 'lucide-react';
import GlassCard from '../../components/common/GlassCard';

const AIDoubtSolver = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I analyze your academic profile to provide context-aware answers. How can I assist you with your studies today?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMsg.text })
            });

            if (res.ok) {
                const data = await res.json();
                const aiMsg = { id: Date.now() + 1, text: data.reply, sender: 'ai' };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting right now.", sender: 'ai' }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Error connecting to AI service.", sender: 'ai' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 min-h-screen relative flex flex-col">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="mb-4">
                <h1 className="text-3xl font-outfit font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-emerald-400" /> AI Contextual Doubt Solver
                </h1>
                <p className="text-slate-400">Available 24/7. Trained perfectly to match your current class curriculum.</p>
            </div>

            <GlassCard className="flex-1 flex flex-col border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] h-[600px] p-0 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                {msg.sender === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <div className={`max-w-[75%] p-4 rounded-xl text-sm leading-relaxed ${msg.sender === 'ai' ? 'bg-emerald-500/10 text-slate-200 rounded-tl-none border border-emerald-500/20' : 'bg-indigo-500/20 text-white rounded-tr-none border border-indigo-500/30'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-500/10 rounded-tl-none border border-emerald-500/20 flex gap-1 items-center h-12">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-xl">
                    <form onSubmit={handleSend} className="flex gap-3 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your doubt here..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 pr-12"
                        />
                        <button type="submit" disabled={!input.trim() || isTyping} className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black flex items-center justify-center rounded-xl transition-all absolute right-1 top-0.5">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </GlassCard>
        </div>
    );
};

export default AIDoubtSolver;
