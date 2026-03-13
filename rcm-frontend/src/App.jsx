import React, { useState } from 'react';
import DocumentUpload from './features/DocumentUpload';
import ExtractionDashboard from './features/ExtractionDashboard';
import FhirViewer from './features/FHIRviewer';
import ReconciliationDashboard from './features/ReconciliationDashboard';
import LandingExtraInfo from './features/LandingExtraInfo';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const steps = [
    { id: 1, label: 'Ingestion' },
    { id: 2, label: 'AI Audit' },
    { id: 3, label: 'FHIR Bundle' },
    { id: 4, label: 'Reconciliation' }
  ];

  // This function takes the final array from DocumentUpload and moves to step 2
  const handleFilesSubmit = (files) => {
    setUploadedFiles(files);
    setCurrentStep(2); 
  };

  return (
    <div className="min-h-screen bg-[#f7f3f0] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 relative overflow-hidden">
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-100/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-amber-100/50 rounded-full blur-[100px] -z-10" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        <header className="mb-8 bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl shadow-sm">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                <div className="w-6 h-6 border-2 border-white rounded-md rotate-45 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">
                  RCM <span className="text-teal-600">Normalize</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-teal-700/60 uppercase tracking-[0.2em]">Batch Processing Engine</span>
                  {uploadedFiles.length > 0 && (
                    <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {uploadedFiles.length} DOCUMENTS LOADED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex items-center">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                      ${currentStep >= step.id 
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' 
                        : 'bg-white/50 text-slate-400 border border-slate-200/50'}
                    `}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest mt-2 font-black ${currentStep >= step.id ? 'text-teal-800' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx !== steps.length - 1 && (
                    <div className="px-2 sm:px-4">
                       <div className={`w-8 sm:w-16 h-[2px] rounded-full transition-colors duration-500 ${currentStep > step.id ? 'bg-teal-600' : 'bg-slate-200/50'}`} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </header>

        <main className="transition-all duration-500">
          <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] min-h-[550px] overflow-hidden p-2">
            <div className="bg-white/80 rounded-[2.2rem] h-full min-h-[530px] border border-white/40 shadow-inner relative">
              
              {currentStep === 1 && (
                <div className="p-10 animate-in fade-in zoom-in-95 duration-700">
                  <div className="max-w-xl mx-auto text-center mb-10">
                    <div className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-bold mb-4 border border-teal-100 uppercase tracking-wider">
                      Step 01: Multi-Doc Ingestion
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-3 italic">Upload Medical Batch</h2>
                    <p className="text-slate-500 text-base leading-relaxed">
                      Drop multiple PDFs (EOBs, Discharge Summaries, Claims). 
                      The engine will parse and normalize each into a unified <span className="text-teal-600 font-semibold">FHIR R4</span> stream.
                    </p>
                  </div>
                  
                  {/* CRITICAL FIX: The prop is onFileUpload to match your DocumentUpload.js code */}
                  <DocumentUpload onFileUpload={handleFilesSubmit} />
                </div>
              )}

              {currentStep === 2 && (
                <ExtractionDashboard 
                  files={uploadedFiles} 
                  onConfirm={() => setCurrentStep(3)} 
                  onBack={() => setCurrentStep(1)} // <-- ADD THIS
                />
              )}

              {currentStep === 3 && (
                <FhirViewer 
                  files={uploadedFiles}
                  onProceed={() => setCurrentStep(4)} 
                  onBack={() => setCurrentStep(2)} // <-- ADD THIS
                />
              )}

              {currentStep === 4 && (
                <ReconciliationDashboard 
                  files={uploadedFiles}
                  onRestart={() => {
                    setUploadedFiles([]);
                    setCurrentStep(1);
                  }} 
                  onBack={() => setCurrentStep(3)} // <-- ADD THIS
                />
              )}
            </div>
          </div>
        </main>
{/* 
        <footer className="mt-10 flex items-center justify-between px-6 text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          <p>Secure Multi-Tenant Batch Processing</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              System Ready
            </span>
            <span className="text-teal-600/60 font-black">JIO HACKATHON 2026</span>
          </div>
        </footer> */}

                
      </div>
      <LandingExtraInfo />
    </div>
  );
}

export default App;