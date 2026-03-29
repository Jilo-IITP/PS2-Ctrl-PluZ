import React from 'react';
import { FileText, CheckCircle2, UploadCloud, AlertCircle, FileSearch, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdmittedStageWorkspace from './AdmittedStageWorkspace';

const DocumentStage = ({ 
  patient, 
  targetStage, 
  stageLabel, 
  Icon, 
  onUploadClick, 
  onProcessBatch,
  onDeleteDocument,
  onProcessSettlement,
  onProcessBillAudit,
  onProcessBillApproval
}) => {
  const sectionDocs = patient.documents.filter(d => d.stage === targetStage);
  const isSettledStage = targetStage === 'settled';
  const isAdmittedStage = targetStage === 'admitted';
  
  // If admitted, use the specialized workspace
  if (isAdmittedStage) {
    return (
      <AdmittedStageWorkspace 
        patient={patient}
        onUploadClick={onUploadClick}
        onProcessBillAudit={onProcessBillAudit}
        onProcessBillApproval={onProcessBillApproval}
      />
    );
  }

  // Check if there are any claim-related documents in previous stages
  const hasClaim = patient.documents.some(d => d.stage === 'admitted' || d.stage === 'preAuth');

  return (
    <div className={`border overflow-hidden shadow-sm mb-6 ${isSettledStage ? 'border-destructive/30 ring-1 ring-destructive/10' : 'border-border'}`}>
      <div className={`p-3 border-b flex items-center justify-between ${isSettledStage ? 'bg-destructive/5' : 'bg-muted/20'}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isSettledStage ? 'text-destructive' : 'text-foreground'}`} />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{stageLabel}</h4>
          <span className="text-[10px] ml-2 font-mono text-muted-foreground">
            {sectionDocs.length} files
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onUploadClick(null)} 
          className="h-6 text-[10px] uppercase font-bold tracking-widest px-2 py-0 border bg-background"
        >
          <UploadCloud className="w-3 h-3 mr-1" /> {isSettledStage ? 'Upload Reply' : 'Add Record'}
        </Button>
      </div>

      <div className="p-0">
        {isSettledStage && (
          <div className="px-4 py-2 border-b bg-muted/10 flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center">
              Internal Claim Status:
            </span>
            <Badge variant={hasClaim ? "default" : "outline"} className={`text-[9px] uppercase tracking-[0.2em] font-bold px-2 h-4 ${!hasClaim ? 'opacity-50' : 'bg-green-500/20 text-green-500 border-green-500/30'}`}>
              {hasClaim ? 'Claim File Detected' : 'Claim In-Progress'}
            </Badge>
          </div>
        )}

        {sectionDocs.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground bg-background/50 font-medium">
            {isSettledStage ? 'Awaiting insurance reply (Settlement Letter)...' : 'Awaiting documents for this stage.'}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border text-left">
              {sectionDocs.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors gap-3">
                  <div className="flex items-center gap-3 overflow-hidden text-left">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="truncate flex flex-col items-start gap-1">
                      <p className="text-xs font-bold truncate pr-3 text-foreground leading-none">{doc.name}</p>
                      {doc.status === 'processed' && <Badge variant="outline" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Processed</Badge>}
                      {doc.status === 'pending' && <Badge variant="outline" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm bg-muted/50">Stored</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteDocument(patient.id, doc.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 h-6 w-6 p-0 items-center justify-center rounded-xs transition-colors">
                     <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted/30 border-t flex flex-col gap-2">
              <Button 
                variant={isSettledStage ? "default" : "secondary"}
                className={`w-full font-black text-[10px] uppercase tracking-[0.2em] h-9 shadow-sm ${isSettledStage ? 'shadow-destructive/20 bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                onClick={isSettledStage ? () => onProcessSettlement(patient, sectionDocs[0].rawFile || sectionDocs[0]) : onProcessBatch}
              >
                {isSettledStage ? (
                  <><FileSearch className="w-4 h-4 mr-2" /> Start Settlement Audit</>
                ) : (
                  'Analyze Staged Batch Context'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentStage;
