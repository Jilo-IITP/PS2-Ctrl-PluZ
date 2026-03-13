import React, { useState } from 'react';
import DocumentUpload from './features/DocumentUpload';4
import ExtractionDashboard from './features/ExtractionDashboard';
import FhirViewer from './features/FHIRviewer';
import ReconciliationDashboard from './features/ReconciliationDashboard';
function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Step 1 -> Step 2
  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setCurrentStep(2); 
  };

  // Step 2 -> Step 3
  const handleExtractionConfirm = () => {
    setCurrentStep(3);
  };

  const handleFhirConfirm = () => {
    setCurrentStep(4); // Move to final Reconciliation step!
  };
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header & Stepper */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RCM Normalization Engine</h1>
            <p className="text-slate-500 text-sm">AI-Powered Claim Adjudication & FHIR Mapping</p>
          </div>
          
          {/* Simple Stepper indicator */}
          <div className="flex space-x-2 text-sm font-medium">
            <span className={`px-3 py-1 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1. Ingestion</span>
            <span className={`px-3 py-1 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2. AI Audit</span>
            <span className={`px-3 py-1 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3. FHIR Bundle</span>
          </div>
        </div>

        {/* The View Engine */}
        {currentStep === 1 && (
          <div className="mt-12">
            <DocumentUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {currentStep === 2 && (
          <ExtractionDashboard file={uploadedFile} onConfirm={handleExtractionConfirm} />
        )}

        
          {currentStep === 3 && (
          <FhirViewer onProceed={handleFhirConfirm} />
        )}

        {currentStep === 4 && (
          <ReconciliationDashboard onRestart={() => setCurrentStep(1)} />
        )}

      </div>
    </div>
  );
}

export default App;