import React, { useState } from 'react';
import { MathResponse, TabOption } from '../types';

interface ResponseCardProps {
  response: MathResponse;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ response }) => {
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.PROOF);

  const getTabClass = (tab: TabOption) => {
    const base = "px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none";
    return activeTab === tab
      ? `${base} text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/50`
      : `${base} text-slate-400 hover:text-slate-200 hover:bg-slate-800/30`;
  };

  const steps = response.machine_readable_json.steps || [];

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl mt-6">
      {/* Header / Tabs */}
      <div className="flex flex-wrap items-center justify-between bg-slate-950 border-b border-slate-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab(TabOption.PROOF)}
            className={getTabClass(TabOption.PROOF)}
          >
            Proof
          </button>
          <button
            onClick={() => setActiveTab(TabOption.JSON)}
            className={getTabClass(TabOption.JSON)}
          >
            Logic (JSON)
          </button>
          <button
            onClick={() => setActiveTab(TabOption.PYTHON)}
            className={getTabClass(TabOption.PYTHON)}
          >
            Verify (Python)
          </button>
        </div>
        <div className="px-4 py-2 flex items-center gap-3">
          {response.parsed_problem?.difficulty_estimate && (
             <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {response.parsed_problem.difficulty_estimate}
             </span>
          )}
          <span className={`text-xs font-bold px-2 py-1 rounded ${response.certainty === 'CERTAIN' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
            {response.certainty}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 bg-slate-900 min-h-[300px]">
        
        {/* Human Readable Proof */}
        {activeTab === TabOption.PROOF && (
          <div className="space-y-6">
            {/* Parsed Problem Summary */}
            {response.parsed_problem && (
                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 text-sm">
                    <h4 className="text-indigo-400 font-semibold mb-2">Problem Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wider">Given</span>
                            <ul className="list-disc list-inside text-slate-300 mt-1">
                                {response.parsed_problem.given.map((g, i) => <li key={i}>{g}</li>)}
                            </ul>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wider">To Prove</span>
                            <p className="text-slate-300 mt-1">{response.parsed_problem.to_prove}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="prose prose-invert prose-slate max-w-none">
                <div className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                  {response.human_readable_proof}
                </div>
                {response.uncertainty_reason && (
                   <div className="mt-4 p-4 border border-yellow-700/50 bg-yellow-900/20 rounded text-yellow-200 text-sm">
                     <strong>Note:</strong> {response.uncertainty_reason}
                   </div>
                )}
            </div>
          </div>
        )}

        {/* Machine Readable JSON */}
        {activeTab === TabOption.JSON && (
          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-2 flex justify-between">
                <span>Step-by-Step Logic</span>
                <span className="text-xs normal-case font-normal text-slate-600">ID: {response.machine_readable_json.proof_id}</span>
            </h3>
            
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.step_no} className="flex gap-4 p-4 bg-slate-950 rounded border border-slate-800 relative group">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-900/30 text-indigo-300 text-sm font-bold border border-indigo-700/30">
                        {step.step_no}
                      </div>
                      <div className="mt-2 text-center">
                         <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            parseFloat(step.confidence) > 0.8 ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'
                         }`}>
                           {step.confidence}
                         </span>
                      </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    {/* Statement */}
                    <div className="font-mono text-indigo-100 mb-2 text-sm">{step.statement}</div>
                    
                    {/* Justification */}
                    <div className="text-xs text-slate-400 mb-2 flex items-start gap-2">
                        <span className="uppercase tracking-wide text-slate-600 font-semibold text-[10px] mt-0.5">Justification</span>
                        <span className="italic">{step.justification}</span>
                    </div>

                    {/* Checkable Assertions */}
                    {step.checkable_assertions && step.checkable_assertions.length > 0 && (
                        <div className="bg-slate-900/80 rounded p-2 border border-slate-800/50 mt-2">
                            <span className="text-[10px] uppercase text-slate-600 font-bold block mb-1">Assertions</span>
                            {step.checkable_assertions.map((assertion, i) => (
                                <code key={i} className="block text-xs text-emerald-400/80 font-mono truncate">{assertion}</code>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-800 rounded">
              <span className="text-emerald-500 text-xs font-bold uppercase tracking-wide">Final Answer</span>
              <div className="text-emerald-200 font-mono text-lg mt-1">
                {String(response.machine_readable_json.final_answer)}
              </div>
            </div>

            {/* Raw JSON Details */}
            <div className="mt-4">
                <details>
                    <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-400">View Raw JSON</summary>
                    <pre className="mt-2 text-xs text-slate-500 overflow-auto bg-black p-2 rounded max-h-60">
                        {JSON.stringify(response.machine_readable_json, null, 2)}
                    </pre>
                </details>
            </div>
          </div>
        )}

        {/* Python Verification */}
        {activeTab === TabOption.PYTHON && (
          <div>
             <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">SymPy / Python Expression</span>
                <span className="text-xs text-slate-600">Generated for verification</span>
             </div>
             <pre className="bg-black text-blue-300 p-4 rounded-lg border border-slate-800 font-mono text-sm overflow-x-auto">
               <code>{response.python_verification}</code>
             </pre>
             <div className="mt-6">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Machine Checks</h4>
                 {response.machine_readable_json.machine_checks && response.machine_readable_json.machine_checks.length > 0 ? (
                    <ul className="space-y-1">
                        {response.machine_readable_json.machine_checks.map((check, idx) => (
                            <li key={idx} className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                {check}
                            </li>
                        ))}
                    </ul>
                 ) : (
                    <p className="text-xs text-slate-600 italic">No specific machine checks provided.</p>
                 )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseCard;
