import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Bot, User, Trash2, BookOpen, Lightbulb, ListChecks, AlertTriangle } from 'lucide-react';
import Card from '../../components/common/Card';
import api from '../../api/axios';

const MAX_MESSAGE_LENGTH = 2000;

const AIResponseCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-3 w-full">
      {/* Main Answer */}
      <p className="text-sm leading-relaxed text-text-primary">{data.answer}</p>

      {/* Explanation Steps */}
      {data.explanationSteps?.length > 0 && (
        <div className="bg-surface-alt/50 rounded-lg p-3 border border-border-base">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
            <ListChecks className="w-3 h-3" /> Step-by-Step
          </h4>
          <ol className="space-y-1.5 list-decimal list-inside">
            {data.explanationSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-text-secondary leading-relaxed">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Related Concepts */}
      {data.relatedConcepts?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.relatedConcepts.map((item, idx) => {
            const conceptName = typeof item === 'string' ? item : item.concept;
            const relevance = typeof item === 'object' ? item.relevance : null;
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20"
                title={relevance || ''}
              >
                <BookOpen className="w-3 h-3" /> {conceptName}
              </span>
            );
          })}
        </div>
      )}

      {/* Suggested Practice */}
      {data.suggestedPractice?.length > 0 && (
        <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
          <h4 className="text-xs font-bold uppercase tracking-widest text-warning mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> Practice This
          </h4>
          <ul className="space-y-1">
            {data.suggestedPractice.map((item, idx) => (
              <li key={idx} className="text-xs text-text-secondary">• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AIDoubtSolver = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hello! I'm your AI academic tutor. I analyze your profile to give context-aware answers. Ask me anything about your subjects!",
      data: null,
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setError('');
    const userMsg = { id: Date.now(), type: 'user', text: trimmed, data: null };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/api/ai/doubt', { message: trimmed });
      const aiData = res.data;

      // Validate structured response
      if (aiData && aiData.answer) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: aiData.answer,
          data: aiData,
        }]);
      } else {
        // Fallback for unexpected response shape
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: typeof aiData === 'string' ? aiData : 'I received a response but couldn\'t process it properly.',
          data: null,
        }]);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to get a response. Please try again.';
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: errMsg,
        data: null,
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      type: 'ai',
      text: "Chat cleared. Feel free to ask a new question!",
      data: null,
    }]);
    setError('');
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 min-h-screen flex flex-col">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-text-primary mb-1 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-success" /> AI Doubt Solver
          </h1>
          <p className="text-text-secondary text-sm">Context-aware. Adapts to your weak areas. Available 24/7.</p>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-danger border border-border-base hover:border-danger/30 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      <Card className="flex-1 flex flex-col border border-success/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] h-[600px] p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                msg.type === 'ai'
                  ? msg.isError ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'
                  : 'bg-primary/20 text-primary'
              }`}>
                {msg.type === 'ai' ? (msg.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />) : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                msg.type === 'ai'
                  ? msg.isError
                    ? 'bg-danger/10 text-danger rounded-tl-none border border-danger/20'
                    : 'bg-success/10 text-text-primary rounded-tl-none border border-success/20'
                  : 'bg-primary/10 text-text-primary rounded-tr-none border border-primary/20'
              }`}>
                {msg.data ? <AIResponseCard data={msg.data} /> : msg.text}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-xl bg-success/10 rounded-tl-none border border-success/20 flex gap-1 items-center h-10">
                <span className="w-2 h-2 bg-success rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-success rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-success rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-surface-alt/80 border-t border-border-base backdrop-blur-xl">
          {error && (
            <p className="text-xs text-danger mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {error}
            </p>
          )}
          <form onSubmit={handleSend} className="flex gap-3 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your doubt here..."
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 bg-background border border-border-base rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-success pr-14"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 bg-success hover:bg-success-light disabled:bg-success/50 disabled:cursor-not-allowed text-white flex items-center justify-center rounded-xl transition-all absolute right-1 top-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-text-secondary mt-1 text-right">{input.length}/{MAX_MESSAGE_LENGTH}</p>
        </div>
      </Card>
    </div>
  );
};

export default AIDoubtSolver;
