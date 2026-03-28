import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import DocumentStage from './DocumentStage';
import { STAGE_ORDER, STAGE_LABELS, STAGE_ICONS } from './constants';

const PatientDetailModal = ({ 
  patient, 
  isOpen, 
  onClose, 
  onFileAttached, 
  onProcessBatch 
}) => {
  if (!patient) return null;

  const triggerFileAttachment = (targetStage) => {
    const input = document.getElementById(`file-upload-${patient.id}-${targetStage}`);
    if (input) input.click();
  };

  const getVisibleStages = () => {
    let highestDocIndex = -1;
    patient.documents.forEach(doc => {
      const idx = STAGE_ORDER.indexOf(doc.stage);
      if (idx > highestDocIndex) highestDocIndex = idx;
    });
    const maxVisibleIndex = Math.min(STAGE_ORDER.length - 1, highestDocIndex + 1);
    return STAGE_ORDER.slice(0, maxVisibleIndex + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-background border-border p-0 gap-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 border-b bg-muted/10">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">{patient.name}</DialogTitle>
              <DialogDescription className="text-xs uppercase tracking-widest font-mono mt-1 flex flex-wrap items-center gap-4">
                <span title={patient.id}>ID: {patient.id.substring(0, 6)}...</span>
                {patient.dob && <span>DOB: {patient.dob}</span>}
                {patient.age && <span>AGE: {patient.age}</span>}
              </DialogDescription>
            </div>
            {patient.medical_claim && (
              <Badge variant="default" className="text-[9px] uppercase font-bold tracking-widest px-3 py-1 ml-2">
                Claim Filed
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-muted/5">
          {getVisibleStages().map((stage, idx, arr) => (
            <div key={stage} className="relative">
              {idx !== arr.length - 1 && (
                <div className="absolute left-6 top-10 bottom-0 w-px bg-border -mb-10 z-0"></div>
              )}

              <div className="relative z-10 pl-1">
                <input
                  id={`file-upload-${patient.id}-${stage}`}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => onFileAttached(e, patient.id, stage)}
                />
                <DocumentStage 
                  patient={patient}
                  targetStage={stage}
                  stageLabel={STAGE_LABELS[stage]}
                  Icon={STAGE_ICONS[stage]}
                  onUploadClick={() => triggerFileAttachment(stage)}
                  onProcessBatch={() => onProcessBatch(patient, stage)}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 sm:justify-between items-center flex-row">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center">
            <Activity className="w-3 h-3 mr-1" /> Session Secured
          </span>
          <Button onClick={onClose} variant="default" size="sm" className="font-bold uppercase tracking-widest text-[10px] px-6 rounded-sm">
            Close Tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailModal;
