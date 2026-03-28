import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentUpload from './DocumentUpload';
import ExtractionDashboard from './ExtractionDashboard';
import FhirViewer from './FHIRviewer';
import ReconciliationDashboard from './ReconciliationDashboard';
import axios from 'axios';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function ProcessingPipeline() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // If the user came from Dashboard by clicking process on a document, it will be in routing state
  const preloadedDocument = location.state?.document;

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [apiResults, setApiResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    if (preloadedDocument && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      if (preloadedDocument.status === 'processed') {
        // If it was already processed, jump straight to extraction results (requires stored results, but mock it for now)
        setCurrentStep(2);
        setUploadedFiles([preloadedDocument.rawFile || { name: preloadedDocument.name }]);
        // To accurately view processed docs, you'd need the real JSON. We're mocking an empty hit right now.
      } else if (preloadedDocument.rawFile) {
        // If it's a new upload, hit the API automatically!
        handleFilesSubmit([preloadedDocument.rawFile]);
      } else {
        // Fallback
        setCurrentStep(1);
      }
    }
  }, [preloadedDocument, hasAutoTriggered]);

  // If a preloaded document was supplied, we might need to trigger the process automatically 
  // or mock the process if we don't have the actual file blob ready to send to Python backend.
  // For this hackathon scope, if we have a preloaded network document, we'll simulate the backend hit 
  // or assume we already have results to view. Let's start the user at step 2.

  const steps = [
    { id: 1, label: 'Ingestion' },
    { id: 2, label: 'Extraction' },
    { id: 3, label: 'FHIR Bundle' },
    { id: 4, label: 'Reconciliation' }
  ];

  const handleFilesSubmit = async (files) => {
    setIsProcessing(true);
    
    const formData = new FormData();
    files.forEach((file) => formData.append('pdf_files', file));

    try {
      const response = await axios.post('http://localhost:8000/process-pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFiles(files); 
      setApiResults(response.data.results || []);
      setIsProcessing(false);
      setCurrentStep(2); 
    } catch (error) {
      console.error("Backend connection failed", error);
      alert("Error connecting to backend API. Is FastAPI running?");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col font-sans flex-1">
      {/* Modern Enterprise Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
             </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none uppercase">RCM Normalize</h1>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest mt-0.5">Pipeline Processing</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 mx-12 items-center justify-center max-w-xl">
             <div className="flex items-center w-full justify-between">
               {steps.map((step, idx) => (
                 <React.Fragment key={step.id}>
                   <div className="flex flex-col items-center group">
                     <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all
                       ${currentStep > step.id ? 'bg-primary border-primary text-primary-foreground' : 
                        currentStep === step.id ? 'border-primary text-primary bg-background shadow-sm' : 
                        'border-muted bg-muted text-muted-foreground'}
                     `}>
                       {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                     </div>
                     <span className={`text-[10px] mt-1.5 uppercase font-bold tracking-wider ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                       {step.label}
                     </span>
                   </div>
                   {idx !== steps.length - 1 && (
                     <div className={`flex-1 h-[2px] mx-2 rounded-full transition-all ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                   )}
                 </React.Fragment>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-4">
            {uploadedFiles.length > 0 && (
              <Badge variant="secondary" className="hidden sm:flex">
                {uploadedFiles.length} Docs in Pipeline
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Mobile Step Progress */}
      <div className="md:hidden w-full border-b bg-card p-3">
         <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-bold text-muted-foreground uppercase">{steps[currentStep-1].label}</span>
           <span className="text-xs font-bold text-muted-foreground">Step {currentStep} of 4</span>
         </div>
         <Progress value={(currentStep / 4) * 100} className="h-2" />
      </div>

      {/* Main Application Workspace */}
      <main className="flex-1 container mx-auto px-4 py-8">
          {currentStep === 1 && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 fade-in-0">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Batch Document Ingestion</h2>
                <p className="text-muted-foreground">
                  Securely upload non-structured clinical documents. Our AI engine scales formats automatically into standard FHIR R4 JSON.
                </p>
              </div>
              
              {isProcessing ? (
                <Card className="border-border shadow-sm p-12 text-center animate-pulse">
                   <CardContent className="flex flex-col items-center justify-center p-0">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                      <h2 className="text-xl font-bold text-foreground">Running RAG Extractor...</h2>
                      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                         Applying LLM models to identify structured features, link diagnosis codes and map data definitions securely.
                      </p>
                   </CardContent>
                </Card>
              ) : (
                <DocumentUpload onFileUpload={handleFilesSubmit} />
              )}
            </div>
          )}

          {currentStep === 2 && (
            <ExtractionDashboard 
              files={uploadedFiles} 
              apiResults={apiResults}
              onConfirm={() => setCurrentStep(3)} 
              onBack={() => setCurrentStep(1)} 
            />
          )}

          {currentStep === 3 && (
            <FhirViewer 
              files={uploadedFiles}
              apiResults={apiResults}
              onProceed={() => setCurrentStep(4)} 
              onBack={() => setCurrentStep(2)} 
            />
          )}

          {currentStep === 4 && (
            <ReconciliationDashboard 
              files={uploadedFiles}
              apiResults={apiResults}
              onRestart={() => {
                setUploadedFiles([]);
                setApiResults([]);
                setCurrentStep(1);
                navigate('/dashboard'); // Go back to dashboard on complete restart
              }} 
              onBack={() => setCurrentStep(3)} 
            />
          )}
      </main>
    </div>
  );
}
