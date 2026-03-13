import React, { useState, useMemo } from 'react';
import { CheckCircle, FileText, ArrowRight, ArrowLeft, Activity, ShieldCheck } from 'lucide-react';

const ExtractionDashboard = ({ files = [], onConfirm, onBack }) => {
  // State to track which file in the batch we are currently viewing
  const [activeIndex, setActiveIndex] = useState(0);

  // Generate mock AI data for EACH file so it looks like a real batch process
  const mockAiDataList = useMemo(() => {
    return files.map((file, idx) => ({
      fileName: file.name,
      invoice_number: `INV-2026-${1000 + idx}`,
      invoice_date: "2026-03-12",
      hospital_name: idx % 2 === 0 ? "Expedient Healthcare Pvt Ltd" : "Apollo City Hospital",
      confidence_score: 98 - (idx * 2), // Slightly varying confidence scores
      patient: {
        name: "Pandurang Khamitkar",
        services: [
          {
            description: "Full Body Checkup With Vitamin Screening",
            amount: 5490.00 + (idx * 150),
            cpt_code: "99386",
            icd_10: "Z00.00",
            match_confidence: "98%"
          },
          // Add a second service for some files to make it look dynamic
          ...(idx % 2 !== 0 ? [{
            description: "Lipid Panel Blood Test",
            amount: 1200.00,
            cpt_code: "80061",
            icd_10: "E78.5",
            match_confidence: "95%"
          }] : [])
        ]
      }
    }));
  }, [files]);

  const currentFile = files[activeIndex];
  const currentAiData = mockAiDataList[activeIndex];
  
  // Safe object URL for PDF preview
  const pdfUrl = currentFile ? URL.createObjectURL(currentFile) : null;

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-500">
      
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
            AI AUDIT DASHBOARD
          </h2>
          <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">
            NLP Extraction & Coding
          </p>
        </div>

        <button 
          onClick={onConfirm}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-slate-800/20"
        >
          Approve Batch ({files.length})
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* BATCH NAVIGATOR (Only show if multiple files) */}
      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {files.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap border ${
                activeIndex === idx 
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Doc {idx + 1}: <span className="truncate max-w-[100px] font-normal opacity-90">{file.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* MAIN SPLIT VIEW */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-320px)] min-h-[450px]">
        
        {/* LEFT PANEL: Document Preview */}
        <div className="w-full lg:w-1/2 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-inner">
          <div className="bg-white/80 backdrop-blur border-b border-slate-200 p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Source Document</h3>
                <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{currentFile?.name}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
              Read-only
            </span>
          </div>
          <div className="flex-grow p-2">
            {pdfUrl ? (
              <iframe src={pdfUrl} className="w-full h-full rounded-xl border border-slate-200/60 bg-white" title="PDF Preview" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm font-medium">
                No document available
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI Extracted Data */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Top Metric Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
             <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Extraction Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-lg font-black text-slate-800">Verified by AI</span>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Confidence Score</p>
                <p className="text-2xl font-black text-teal-600">{currentAiData?.confidence_score}%</p>
             </div>
          </div>

          {/* Header Info */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-teal-500">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">Claim Metadata</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">Hospital/Provider</p>
                <p className="font-bold text-slate-800">{currentAiData?.hospital_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">Invoice Date</p>
                <p className="font-bold text-slate-800">{currentAiData?.invoice_date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">Patient Name</p>
                <p className="font-bold text-slate-800">{currentAiData?.patient?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">Invoice #</p>
                <p className="font-bold text-slate-800">{currentAiData?.invoice_number}</p>
              </div>
            </div>
          </div>

          {/* Services & Coding Table */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Coded Services</h3>
              <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                <CheckCircle className="w-3 h-3 mr-1.5" /> RAG Engine Active
              </span>
            </div>
            
            <div className="space-y-3">
              {currentAiData?.patient?.services.map((svc, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-bold text-slate-800 mb-3">{svc.description}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Amount</p>
                      <p className="font-black text-slate-700">₹{svc.amount}</p>
                    </div>
                    <div className="bg-teal-50 p-2.5 border border-teal-200 rounded-lg shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold mb-1">CPT Code</p>
                      <p className="font-black text-teal-900">{svc.cpt_code}</p>
                    </div>
                    <div className="bg-amber-50 p-2.5 border border-amber-200 rounded-lg shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-1">ICD-10 (Diag)</p>
                      <p className="font-black text-amber-900">{svc.icd_10}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExtractionDashboard;