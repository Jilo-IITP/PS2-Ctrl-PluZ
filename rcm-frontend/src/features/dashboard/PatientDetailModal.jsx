import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowLeft, CheckCircle2 } from 'lucide-react';
import DocumentStage from './DocumentStage';
// import AdmittedStageWorkspace from './AdmittedStageWorkspace'; // Uncomment if used
import { STAGE_ORDER, STAGE_LABELS, STAGE_ICONS } from './constants';

const PatientDetailModal = ({
  patient,
  isOpen,
  onClose,
  onFileAttached,
  onProcessBatch,
  onUpdateStep, // Duplicate removed from here
  onDeleteDocument,
  onProcessSettlement,
  onProcessBillAudit,
  onProcessBillApproval,
}) => {
  if (!patient) return null;

  const [uploadPrefix, setUploadPrefix] = React.useState("");

  const triggerFileAttachment = (targetStage, prefix = "") => {
    setUploadPrefix(prefix || "");
    setTimeout(() => {
      const input = document.getElementById(`file-upload-${patient.id}-${targetStage}`);
      if (input) input.click();
    }, 0);
  };

  // Helper to render sidebar fields
  const renderField = (label, value) => (
    <div className="flex flex-col gap-1 mb-4">
      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{label}</span>
      <span className="text-sm font-bold text-foreground border-b border-border/50 pb-1">{value || '—'}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      {/* FULL-SCREEN OVERRIDE: 
          Uses !important utility classes to ensure the shadcn dialog 
          doesn't center-align or shrink on large screens.
      */}
      <DialogContent className="fixed !left-0 !top-0 !translate-x-0 !translate-y-0 !max-w-none min-w-[100vw] w-screen !h-[100dvh] m-0 p-0 border-none !rounded-none gap-0 flex flex-col bg-background outline-none overflow-hidden [&>button]:hidden shadow-none z-50">

        <DialogHeader className="p-6 border-b bg-muted/5 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full hover:bg-muted/50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col items-start text-left">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none">{patient.name}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-mono mt-2 flex items-center gap-3">
                <Badge variant="outline" className="font-mono px-2 py-0 h-4 border-primary/30">ID: {patient.id}</Badge>
                <span className="text-muted-foreground">Session Secured • {new Date().toLocaleDateString()}</span>
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {patient.medical_claim && (
              <Badge variant="default" className="text-[9px] uppercase font-bold tracking-widest px-3 py-1 bg-primary/20 text-primary border-primary/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Claim Filed
              </Badge>
            )}
            <Button onClick={onClose} variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[9px] px-6 rounded-none border-2 hover:bg-muted/50 transition-colors">
              Exit Workspace
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden w-full relative">
          {/* LEFT PANEL: Patient Registry */}
          <div className="w-80 border-r border-border bg-muted/5 overflow-y-auto custom-scrollbar shrink-0 p-6 h-full">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-muted-foreground flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Patient Registry
            </h4>

            <div className="space-y-0">
              {renderField('Full Name', patient.name)}
              {renderField('DOB', patient.dob)}
              <div className="grid grid-cols-2 gap-2">
                {renderField('Age', patient.age)}
                {renderField('Gender', patient.gender)}
              </div>
              {renderField('Contact', patient.contact)}
              {renderField('Policy Number', patient.policy_number)}
              {renderField('Insurer ID', patient.insurer_id)}
              {renderField('Occupation', patient.occupation)}
              {renderField('Address', patient.address)}
            </div>
          </div>

          {/* MAIN PANEL: Command Pipelines */}
          <div className="flex-1 p-10 overflow-y-auto bg-background custom-scrollbar h-full relative">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b pb-4 absolute py-4 top-0 bg-background/95 backdrop-blur z-10">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Command Pipeline Modules</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary bg-primary/5">Pre-Auth</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">Billing</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-destructive bg-destructive/5">Settlement</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-12 pb-20">
                {STAGE_ORDER.map((stage) => {
                  const status = patient.step?.toLowerCase() || 'pre auth';

                  // Logic to lock the 'Settled' stage until discharge
                  const isSettledStage = stage === 'settled';
                  const isLocked = isSettledStage && !['settled', 'discharge', 'discharged'].includes(status);

                  return (
                    <div key={stage} className={`relative transition-all duration-300 ${isLocked ? 'grayscale opacity-40' : 'opacity-100'}`}>
                      {isLocked && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[1px] pointer-events-none">
                          <Badge variant="outline" className="bg-background text-[10px] font-bold uppercase tracking-widest px-4 py-2 shadow-xl border-2">
                            Unlocks After Discharge Step
                          </Badge>
                        </div>
                      )}

                      <input
                        id={`file-upload-${patient.id}-${stage}`}
                        type="file"
                        accept=".pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => onFileAttached(e, patient.id, stage, uploadPrefix)}
                      />

                      <DocumentStage
                        patient={patient}
                        targetStage={stage}
                        stageLabel={STAGE_LABELS[stage]}
                        Icon={STAGE_ICONS[stage]}
                        onUploadClick={(prefix) => triggerFileAttachment(stage, prefix)}
                        onProcessBatch={() => onProcessBatch(patient, stage)}
                        onDeleteDocument={onDeleteDocument}
                        onUpdateStep={onUpdateStep}
                        onProcessSettlement={onProcessSettlement}
                        onProcessBillAudit={onProcessBillAudit}
                        onProcessBillApproval={onProcessBillApproval}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/5 flex sm:justify-between items-center flex-row shrink-0">
          <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground flex items-center">
            <Activity className="w-3 h-3 mr-2 text-primary" /> RCM WORKSPACE ACTIVE • {patient.name?.toUpperCase()}
          </span>
          <div className="flex gap-4">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-r pr-4">FHIR R4 Schema</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">TLS AES-256</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailModal;