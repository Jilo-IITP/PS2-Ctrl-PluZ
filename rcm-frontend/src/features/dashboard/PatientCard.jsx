import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

const PatientCard = ({ patient, onSelect }) => {
  return (
    <Card onClick={() => onSelect(patient.id)} className="shadow-sm border border-border cursor-pointer hover:border-foreground transition-colors group rounded-sm">
      <div className="p-5 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="font-bold text-foreground leading-tight tracking-tight text-lg group-hover:underline underline-offset-4">{patient.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-1 w-32 truncate" title={patient.id}>
              ID: <span className="opacity-0 w-0 h-0 inline-block overflow-hidden">{patient.id}</span>{patient.id.substring(0, 8)}...
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center font-bold text-foreground text-xs font-mono border">
            {patient.documents.length}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium border-t pt-4">
          {patient.policy_number ? (
            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]">Policy #{patient.policy_number}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]"><Clock className="w-3 h-3" /> Registered Date</span>
          )}
          <span className="font-bold text-foreground font-mono">
            {patient.policy_number ? "" : (patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "-")}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PatientCard;
