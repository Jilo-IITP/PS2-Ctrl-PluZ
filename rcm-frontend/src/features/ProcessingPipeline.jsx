import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentUpload from './DocumentUpload';
import ExtractionDashboard from './ExtractionDashboard';
import FhirViewer from './FHIRviewer';
import ReconciliationDashboard from './ReconciliationDashboard';
import axios from 'axios';
import { Loader2, CheckCircle2, ArrowLeft, Upload, FileSearch, Code, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
// hi

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
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    if (hasAutoTriggered) return;

    // SCENARIO 1: Coming from Dashboard with multiple DOCUMENT RESULTS
    if (location.state?.results && location.state?.files) {
      setHasAutoTriggered(true);
      setUploadedFiles(location.state.files);
      setApiResults(location.state.results);
      if (location.state.patient) setPatient(location.state.patient);
      setCurrentStep(2);
      return;
    }

    // SCENARIO 2: Coming from Dashboard with a single PRELOADED DOCUMENT
    if (preloadedDocument) {
      setHasAutoTriggered(true);
      if (preloadedDocument.status === 'processed') {
        setUploadedFiles([preloadedDocument.rawFile || { name: preloadedDocument.name }]);
        setCurrentStep(2);
      } else if (preloadedDocument.rawFile) {
        setUploadedFiles([preloadedDocument.rawFile]);
        handleFilesSubmit([preloadedDocument.rawFile]);
      } else {
        setCurrentStep(1);
      }
      return;
    }
  }, [location.state, preloadedDocument, hasAutoTriggered]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);



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
      const response = await axios.post('http://localhost:8000/pipeline/process-pdfs', formData, {
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-7 w-7">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Button>
            <div>
              <h1 className="text-xs font-bold tracking-widest leading-none uppercase">Ctrl PluZ</h1>
              <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest mt-px">Pipeline Processing</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 mx-8 items-center justify-center">
            {currentStep === 1 && (
              <div className="text-center">
                <h2 className="text-sm font-bold tracking-tight flex items-center justify-center gap-1.5 uppercase">
                  <Upload className="w-4 h-4 text-foreground" /> INGESTION
                </h2>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Secure Document Upload</p>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center">
                <h2 className="text-sm font-bold tracking-tight flex items-center justify-center gap-1.5 uppercase">
                  <Activity className="w-4 h-4 text-foreground" /> EXTRACTION DASHBOARD
                </h2>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">AI Concept Mapping</p>
              </div>
            )}
            {currentStep === 3 && (
              <div className="text-center">
                <h2 className="text-sm font-bold tracking-tight flex items-center justify-center gap-1.5 uppercase">
                  <Code className="w-4 h-4 text-foreground" /> FHIR R4 BUNDLE
                </h2>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Interoperability Standard Ready</p>
              </div>
            )}
            {currentStep === 4 && (
              <div className="text-center">
                <h2 className="text-sm font-bold tracking-tight flex items-center justify-center gap-1.5 uppercase">
                  <Activity className="w-4 h-4 text-foreground" /> FINAL ADJUDICATION
                </h2>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Pre-Submission Rules Engine</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Minimal right-aligned timeline */}
            <div className="hidden md:flex items-center opacity-80 gap-1.5">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step.id}</div>
                  {idx !== steps.length - 1 && <div className={`w-3 h-px ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />}
                </React.Fragment>
              ))}
            </div>

            {uploadedFiles.length > 0 && (
              <Badge variant="secondary" className="hidden sm:flex text-[10px] py-0.5 px-2">
                {uploadedFiles.length} Docs
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Mobile Step Progress */}
      <div className="md:hidden w-full border-b bg-card px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{steps[currentStep - 1].label}</span>
          <span className="text-[9px] font-bold text-muted-foreground">Step {currentStep} of 4</span>
        </div>
        <Progress value={(currentStep / 4) * 100} className="h-1" />
      </div>

      {/* Main Application Workspace */}
      <main className="flex-1 container mx-auto px-4 py-2">
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            {location.state?.files && !hasAutoTriggered && (
              <Badge variant="outline" className="mb-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 py-1">
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Synchronizing Ingestion Context...
              </Badge>
            )}
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
            stage={location.state?.stage || 'preAuth'}
            patient={location.state?.patient}
            onConfirm={() => setCurrentStep(3)}
            onAction={async (action) => {
              try {
                const { supabase } = await import('@/lib/supabase');
                let newStep;
                if (action === 'admit') newStep = 'admitted';
                else if (action === 'discharge') newStep = 'settled';
                else newStep = action;

                const { error } = await supabase
                  .from('patients')
                  .update({ step: newStep })
                  .eq('id', location.state?.patient?.id);

                if (error) throw error;

                const label = action === 'admit' ? 'Admitted' : 'Discharged';
                alert(`Patient ${label} successfully!`);
                navigate('/dashboard');
              } catch (err) {
                console.error('Status update failed:', err);
                alert(`Failed to update patient status: ${err.message || 'Unknown error'}`);
              }
            }}
            onBack={() => {
              setUploadedFiles([]);
              setApiResults([]);
              setCurrentStep(1);
              navigate('/dashboard');
            }}
          />
        )}

        {currentStep === 3 && (
          <FhirViewer
            files={uploadedFiles}
            apiResults={apiResults}
            stage={location.state?.stage || 'admitted'}
            patient={location.state?.patient}
            onProceed={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <ReconciliationDashboard
            files={uploadedFiles}
            apiResults={apiResults}
            patient={patient}
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
