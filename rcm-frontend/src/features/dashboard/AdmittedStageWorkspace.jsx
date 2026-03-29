import React from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  FileSearch, 
  ShieldCheck, 
  Calculator, 
  CirclePlus, 
  ClipboardList 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const AdmittedStageWorkspace = ({ 
  patient, 
  onUploadClick, 
  onProcessBillAudit, 
  onProcessBillApproval 
}) => {
  const docs = patient.documents || [];
  
  const categories = [
    { id: 'bill', label: 'Hospital Bill', Icon: Calculator, prefix: 'admit_bill__' },
    { id: 'approved', label: 'Review Approval', Icon: ShieldCheck, prefix: 'admit_approved__' },
    { id: 'enhancement', label: 'Enhancement', Icon: CirclePlus, prefix: 'admit_enhancement__' },
    { id: 'report', label: 'Clinical Reports', Icon: ClipboardList, prefix: 'admit_report__' },
  ];

  const getDocsForCategory = (prefix) => {
      // In our system, stage is 'admitted', but name might have the prefix
      return docs.filter(d => d.stage === 'admitted' && d.name.includes(prefix));
  };

  return (
    <Card className="border-blue-500/30 ring-1 ring-blue-500/10 overflow-hidden shadow-xl mb-6 bg-card">
      <div className="p-4 border-b flex items-center justify-between bg-blue-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground leading-none">Billing & Admission Workspace</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Independent Multi-Pipeline Module</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 py-1 uppercase font-bold tracking-widest">
          Admission Active
        </Badge>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const { Icon, label, id, prefix } = cat;
          const catDocs = getDocsForCategory(prefix);
          return (
            <div key={id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center">
                  <Icon className="w-3.5 h-3.5 mr-2" /> {label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground opacity-50">{catDocs.length}</span>
              </div>
              
              <div 
                onClick={() => onUploadClick(cat.prefix)}
                className="border-2 border-dashed border-muted rounded-lg p-4 flex flex-col items-center justify-center hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group h-32"
              >
                {catDocs.length === 0 ? (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                    <span className="text-[9px] uppercase font-bold text-muted-foreground group-hover:text-primary">Upload PDF</span>
                  </>
                ) : (
                  <div className="w-full space-y-2">
                    {catDocs.slice(0, 2).map(d => (
                      <div key={d.id} className="flex items-center gap-2 bg-background border rounded p-1">
                        <FileText className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[9px] font-bold truncate max-w-[80px]">{d.name.replace(cat.prefix, '')}</span>
                      </div>
                    ))}
                    {catDocs.length > 2 && <span className="text-[8px] text-muted-foreground ml-1">+{catDocs.length - 2} more</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-muted/20 border-t flex flex-wrap gap-4">
         <Button 
           size="sm"
           className="flex-1 font-black text-[10px] uppercase tracking-[0.2em] h-10 shadow-lg shadow-blue-500/10 gap-2"
           onClick={onProcessBillAudit}
         >
           <FileSearch className="w-4 h-4" /> Process Bill Audit
         </Button>
         <Button 
           size="sm"
           variant="outline"
           className="flex-1 font-black text-[10px] uppercase tracking-[0.2em] h-10 border-2 gap-2"
           onClick={onProcessBillApproval}
         >
           <ShieldCheck className="w-4 h-4" /> Check Bill Approval
         </Button>
      </div>

      <div className="px-6 py-2 bg-muted/5 border-t">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
          Note: This module checks if the hospital bill aligns with clinical authorization.
        </p>
      </div>
    </Card>
  );
};

export default AdmittedStageWorkspace;
