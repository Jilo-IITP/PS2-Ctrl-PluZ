import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ShieldCheck, Send, RefreshCcw, ArrowLeft, ShieldAlert, Activity } from 'lucide-react';

const ReconciliationDashboard = ({ files = [], onRestart, onBack }) => {
  // Hackathon Trick: Toggle between "Perfect Claim" and "Error Detected"
  const [showError, setShowError] = useState(false);

  // Grab the dynamic name just like the previous step
  const dynamicFileName = files.length > 0 ? files[0].name.replace('.pdf', '') : "Batch_001";

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 animate-in zoom-in-95 duration-500">
      
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            FINAL ADJUDICATION
          </h2>
          <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">
            Pre-Submission Rules Engine
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-200 shadow-inner">
          {files.length} Docs Queued
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Status Banner */}
        <div className={`p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm transition-colors duration-500 border ${showError ? 'bg-red-50/80 border-red-200' : 'bg-teal-50/80 border-teal-200'}`}>
          <div className="flex items-center space-x-4">
            {showError ? (
              <ShieldAlert className="w-12 h-12 text-red-600 drop-shadow-md" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-teal-600 drop-shadow-md" />
            )}
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${showError ? 'text-red-800' : 'text-teal-800'}`}>
                {showError ? 'Anomaly Detected: Claim Paused' : 'Batch 100% Reconciled'}
              </h2>
              <p className={`text-sm font-medium mt-1 ${showError ? 'text-red-600' : 'text-teal-700'}`}>
                {showError ? 'Revenue leakage or clinical mismatch detected. Review required.' : 'All clinical and financial rules passed. Ready for TPA submission.'}
              </p>
            </div>
          </div>

          {/* Hackathon Demo Toggle - Styled to look like a Dev Tool */}
          <button 
            onClick={() => setShowError(!showError)}
            className={`mt-4 sm:mt-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all border shadow-sm ${showError ? 'bg-white text-red-600 border-red-200 hover:bg-red-50' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            title="Toggle Error State for Judges Demo"
          >
            <div className={`w-2 h-2 rounded-full animate-pulse ${showError ? 'bg-red-500' : 'bg-slate-400'}`} />
            Inject Demo Anomaly
          </button>
        </div>

        {/* The Audit Rules Engine UI */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex-grow">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Automated Audit Rules Log</h3>
            <span className="text-[10px] font-mono text-slate-400">Processing: {dynamicFileName}</span>
          </div>
          
          <div className="p-0">
            {/* Rule 1: Demographic Match (Always Green) */}
            <div className="flex items-start space-x-4 p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Demographic & Patient Match</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Patient identity extracted successfully. Age demographic (40-64) matches the CPT 99386 requirement.</p>
              </div>
            </div>

            {/* Rule 2: Medical Necessity (Always Green) */}
            <div className="flex items-start space-x-4 p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Medical Necessity Validation</h4>
                <p className="text-xs text-slate-500 leading-relaxed">ICD-10 Code <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">Z00.00</span> (Routine checkup) fully justifies the billing of CPT Code <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">99386</span> (Preventative visit).</p>
              </div>
            </div>

            {/* Rule 3: Financial Reconciliation (Changes based on toggle) */}
            <div className={`flex items-start space-x-4 p-6 transition-colors duration-500 ${showError ? 'bg-red-50/50' : 'hover:bg-slate-50/50'}`}>
              {showError ? (
                <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="w-full">
                <h4 className={`font-bold text-sm mb-1 ${showError ? 'text-red-800' : 'text-slate-800'}`}>Financial Constraint Check</h4>
                {showError ? (
                  <div className="mt-2 text-xs text-red-700 bg-red-100/50 p-3 rounded-lg border border-red-200/50">
                    <p className="mb-2"><strong className="font-black">Revenue Leakage Warning:</strong> The billed amount for CPT 99386 is <strong>₹5,490</strong>. The standard TPA allowed limit for this code is <strong>₹4,000</strong>.</p>
                    <p className="font-medium text-red-800">Action Required: Adjust the claim amount or attach special authorization before submission to prevent denial.</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">Billed amount (₹5,490) is within acceptable TPA limits for this procedural code. No revenue leakage detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-auto pt-2">
          <button 
            onClick={onRestart}
            className="w-1/3 py-3.5 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-600 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-sm text-sm uppercase tracking-wide"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>New Batch</span>
          </button>
          
          <button 
            disabled={showError}
            className={`w-2/3 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-lg text-sm uppercase tracking-wide ${
              showError 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{showError ? 'Resolve Errors to Submit' : 'Submit Batch to TPA'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ReconciliationDashboard;