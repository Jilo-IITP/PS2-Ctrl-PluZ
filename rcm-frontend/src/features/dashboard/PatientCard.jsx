import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ShieldCheck, Activity, CheckCircle2, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const STEP_CONFIG = {
  'pre auth': { label: 'Pre-Auth', icon: ShieldCheck, color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  'admitted': { label: 'Admitted', icon: Activity, color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  'settled':  { label: 'Settled',  icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
};
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';


const PatientCard = ({ patient, onSelect, onEdit, onDelete }) => {
  const step = patient.step || 'pre auth';
  const stepCfg = STEP_CONFIG[step] || STEP_CONFIG['pre auth'];
  const StepIcon = stepCfg.icon;

  return (
    <Card onClick={() => onSelect(patient.id)} className="shadow-sm border border-border cursor-pointer hover:border-foreground/50 hover:shadow-md transition-all duration-200 group rounded-sm overflow-hidden relative overflow-hidden">
      {/* Step indicator bar along top */}
      <div className={`h-1 w-full ${step === 'admitted' ? 'bg-blue-500' : step === 'settled' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div onClick={(e) => e.stopPropagation()} className="p-1 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="w-4 h-4 cursor-pointer" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-popover text-popover-foreground shadow-xl rounded-sm">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="text-xs font-bold cursor-pointer">
              <Edit2 className="mr-2 w-3.5 h-3.5" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }} className="text-xs font-bold cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 w-3.5 h-3.5" /> Delete Context
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-5 flex flex-col gap-4 mt-4">
        {/* Row 1: Name + Step Badge */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 border">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground leading-tight tracking-tight text-base group-hover:underline underline-offset-4 truncate">{patient.name}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-0.5 truncate" title={patient.id}>
                ID: {patient.id.substring(0, 8)}…
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 shrink-0 ${stepCfg.color}`}>
            <StepIcon className="w-3 h-3 mr-1" />
            {stepCfg.label}
          </Badge>
        </div>

        {/* Row 2: Key patient metadata */}
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div>
            <span className="text-muted-foreground uppercase tracking-widest block mb-0.5">Gender</span>
            <span className="font-bold text-foreground">{patient.gender || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-widest block mb-0.5">Age</span>
            <span className="font-bold text-foreground">{patient.age ? `${patient.age} yrs` : '—'}</span>
          </div>
          <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center font-bold text-foreground text-xs font-mono border">
            {patient.documents.length}
          </div>
        </div>

        {/* Row 3: Policy / Date footer */}
        <div className="flex items-center justify-between text-xs font-medium border-t pt-3">
          {patient.policy_number ? (
            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]">Policy #{patient.policy_number}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]"><Clock className="w-3 h-3" /> Registered</span>
          )}
          <span className="font-bold text-foreground font-mono text-[10px]">
            {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "-"}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PatientCard;
