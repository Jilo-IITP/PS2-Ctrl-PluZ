import React from 'react';
import { FileText, CheckCircle2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DocumentStage = ({ 
  patient, 
  targetStage, 
  stageLabel, 
  Icon, 
  onUploadClick, 
  onProcessBatch 
}) => {
  const sectionDocs = patient.documents.filter(d => d.stage === targetStage);

  return (
    <div className="border border-border bg-card overflow-hidden shadow-sm mb-6">
      <div className="p-3 border-b flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{stageLabel}</h4>
          <span className="text-[10px] ml-2 font-mono text-muted-foreground">
            {sectionDocs.length} files
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUploadClick} 
          className="h-6 text-[10px] uppercase font-bold tracking-widest px-2 py-0 border bg-background"
        >
          <UploadCloud className="w-3 h-3 mr-1" /> Add Record
        </Button>
      </div>

      <div className="p-0">
        {sectionDocs.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground bg-background/50 font-medium">
            Awaiting documents for this stage.
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {sectionDocs.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="truncate flex flex-col items-start gap-1">
                      <p className="text-xs font-bold truncate pr-3 text-foreground leading-none">{doc.name}</p>
                      {doc.status === 'processed' && <Badge variant="outline" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Processed</Badge>}
                      {doc.status === 'pending' && <Badge variant="outline" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm bg-muted/50">Stored</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted/30 border-t flex justify-center">
              <Button 
                className="w-full font-black text-[10px] uppercase tracking-[0.2em] h-9 shadow-sm"
                onClick={onProcessBatch}
              >
                Analyze Staged Batch Context
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentStage;
