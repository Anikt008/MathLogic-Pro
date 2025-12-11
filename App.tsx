import React, { useState, useRef, useEffect } from 'react';
import { solveMathProblem } from './services/geminiService';
import ResponseCard from './components/ResponseCard';
import { MathResponse } from './types';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<MathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await solveMathProblem(query);
      setResponse(result);
    } catch (err) {
      setError("Failed to process the mathematical query. Please check your connection or try a clearer prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-20 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <line x1="8" y1="12" x2="16" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            MathLogic <span className="text-indigo-400">Pro</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 flex flex-col">
        
        {/* Intro / Empty State */}
        {!response && !loading && !error && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-12 opacity-80">
            <div className="bg-slate-900 p-4 rounded-full mb-6 ring-1 ring-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-200 mb-2">Mathematical Reasoning Assistant</h2>
            <p className="text-slate-500 max-w-md">
              Enter a problem to get a formal proof, structured logical steps (JSON), and Python verification code.
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="w-full relative group z-10">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <form onSubmit={handleSubmit} className="relative bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="E.g., Prove that the square root of 2 is irrational..."
                    className="w-full bg-transparent text-slate-200 placeholder-slate-600 px-6 py-5 focus:outline-none resize-none min-h-[80px] text-lg leading-relaxed"
                    rows={1}
                />
                <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 border-t border-slate-800">
                    <div className="text-xs text-slate-600">
                        Supports LaTeX and natural language
                    </div>
                    <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                            ${!query.trim() || loading 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'}
                        `}
                    >
                        {loading ? (
                           <>
                             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Reasoning...
                           </>
                        ) : (
                            <>
                             Solve <span className="text-xs opacity-70">↵</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3 text-red-300 animate-in fade-in slide-in-from-bottom-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p>{error}</p>
          </div>
        )}

        {/* Result */}
        {response && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <ResponseCard response={response} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-sm border-t border-slate-900">
        <p>Powered by Gemini 2.5 Flash / 3 Pro Reasoning</p>
      </footer>

    </div>
  );
}

export default App;