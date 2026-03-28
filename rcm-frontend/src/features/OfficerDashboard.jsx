import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/themetoggle';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, LogOut, FileText, CheckCircle2, Play, Info, Plus, UploadCloud, AlertCircle, Clock, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import LandingExtraInfo from './LandingExtraInfo';

const STAGE_ORDER = ['preAuth', 'admitted', 'settled'];
const STAGE_LABELS = {
  preAuth: 'Pre-Authorization',
  admitted: 'Admitted / Running',
  settled: 'Finalized / Settled'
};
const STAGE_ICONS = {
  preAuth: ShieldCheck,
  admitted: Activity,
  settled: CheckCircle2
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [activePatientId, setActivePatientId] = useState(null);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientDate, setNewPatientDate] = useState("");
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchPatients(session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchPatients = async (currentSession) => {
    setLoading(true);
    setTimeout(() => {
      setPatients([
        {
          id: 'p-1',
          name: 'Jane Doe',
          admission_date: '2026-03-25',
          documents: [
            { id: 'd-101', name: 'Auth_Form_JD.pdf', stage: 'preAuth', status: 'processed', url: 'mock' },
            { id: 'd-102', name: 'Clinical_Daily_Notes.pdf', stage: 'admitted', status: 'pending', url: 'mock' },
            { id: 'd-105', name: 'Lab_Results.pdf', stage: 'admitted', status: 'flag', url: 'mock' } // Mocking a flagged document inside a normal stage
          ]
        },
        {
          id: 'p-2',
          name: 'John Smith',
          admission_date: '2026-03-20',
          documents: [
            { id: 'd-103', name: 'EOB_Statement_JS.pdf', stage: 'settled', status: 'pending', url: 'mock' }
          ]
        },
        {
          id: 'p-3',
          name: 'Alice Cooper',
          admission_date: '2026-03-28',
          documents: []
        }
      ]);
      setLoading(false);
    }, 800);
  };

  const processDocument = (doc) => navigate('/process', { state: { document: doc } });

  const handleCreatePatient = (e) => {
    e.preventDefault();
    if (!newPatientName || !newPatientDate) return;
    setPatients([{
      id: `p-${Date.now()}`,
      name: newPatientName,
      admission_date: newPatientDate,
      documents: []
    }, ...patients]);
    setIsNewPatientOpen(false);
    setNewPatientName("");
    setNewPatientDate("");
  };

  const triggerFileAttachment = (e, patientId, targetStage) => {
    e.stopPropagation();
    const input = document.getElementById(`file-upload-${patientId}-${targetStage}`);
    if (input) input.click();
  };

  const handleFileAttached = (e, patientId, targetStage) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
           return {
             ...p,
             documents: [...p.documents, {
               id: `d-${Date.now()}`,
               name: file.name,
               stage: targetStage,
               status: 'pending',
               url: URL.createObjectURL(file),
               rawFile: file
             }]
           };
        }
        return p;
      }));
    }
  };

  // Compute what stages a patient is active in
  const getVisibleStages = (patient) => {
    const activeIndex = STAGE_ORDER.findIndex(stage => {
      // If a stage has no documents, or its documents are all pending/flagged, we consider this the "current Frontier"
      // Alternatively, we just find the HIGHEST stage that has documents, and show up to +1 from there.
      return false; 
    });
    
    // Simpler algorithm: Find highest index stage that has a document.
    let highestDocIndex = -1;
    patient.documents.forEach(doc => {
      const idx = STAGE_ORDER.indexOf(doc.stage);
      if (idx > highestDocIndex) highestDocIndex = idx;
    });

    // You only see up to the next actionable stage
    const maxVisibleIndex = Math.min(STAGE_ORDER.length - 1, highestDocIndex + 1);
    
    // Return array of stages up to maxVisibleIndex
    return STAGE_ORDER.slice(0, maxVisibleIndex + 1);
  };

  const DocumentSection = ({ patient, targetStage }) => {
    const sectionDocs = patient.documents.filter(d => d.stage === targetStage);
    const IconComponent = STAGE_ICONS[targetStage];
    
    return (
      <div className="border border-border bg-card overflow-hidden shadow-sm mb-6">
        <input 
            id={`file-upload-${patient.id}-${targetStage}`}
            type="file" 
            accept=".pdf" 
            className="hidden" 
            onChange={(e) => handleFileAttached(e, patient.id, targetStage)}
        />
        <div className="p-3 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
             <IconComponent className="w-4 h-4 text-foreground" />
             <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{STAGE_LABELS[targetStage]}</h4>
             <span className="text-[10px] ml-2 font-mono text-muted-foreground">
               {sectionDocs.length} files
             </span>
          </div>
          <Button variant="outline" size="sm" onClick={(e) => triggerFileAttachment(e, patient.id, targetStage)} className="h-6 text-[10px] uppercase font-bold tracking-widest px-2 py-0 border">
            <UploadCloud className="w-3 h-3 mr-1" /> Upload
          </Button>
        </div>
        
        <div className="p-0">
          {sectionDocs.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground bg-background/50 font-medium">
               Awaiting documents for this stage.
            </div>
          ) : (
             <div className="divide-y divide-border">
                {sectionDocs.map(doc => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                       <div className="truncate flex flex-col items-start gap-1">
                         <p className="text-xs font-bold truncate pr-3 text-foreground leading-none">{doc.name}</p>
                         
                         {doc.status === 'processed' && <Badge variant="outline" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Processed</Badge>}
                         {doc.status === 'pending' && <Badge variant="outline" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm bg-muted/50">Pending AI</Badge>}
                         {doc.status === 'flag' && <Badge variant="default" className="text-[9px] uppercase tracking-widest leading-none h-4 rounded-sm"><AlertCircle className="w-2.5 h-2.5 mr-1" />Validation Failed</Badge>}
                       </div>
                    </div>
                    
                    <Button 
                       size="sm" 
                       variant={doc.status === 'processed' ? 'outline' : 'default'}
                       onClick={() => processDocument(doc)}
                       className={`w-full sm:w-auto h-7 font-bold text-[10px] uppercase tracking-wider shrink-0 rounded-sm ${doc.status === 'flag' ? 'border-destructive text-destructive hover:bg-destructive hover:text-white' : ''}`}
                     >
                       {doc.status === 'processed' ? 'View Details' : doc.status === 'flag' ? 'Resolve Error' : 'Extract Data'}
                    </Button>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>
    );
  };

  const activePatient = patients.find(p => p.id === activePatientId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-background font-bold shadow-sm">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest leading-none uppercase">RCM Normalize</h1>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest mt-0.5">
                Officer Profile
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* INSTRUCTIONS MODAL TRIGGER */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted border shadow-sm bg-background">
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><Info className="w-4 h-4" /> Application Workflow</DialogTitle>
                  <DialogDescription className="text-xs">
                    Instructions for strict minimal workflow completion.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-xs">
                   <p className="text-muted-foreground">Click on any patient card to open their active file tab. You will only see the clinical stages they have progressed to. Upload required documents into the corresponding stage bucket.</p>
                   <p className="text-muted-foreground">If an AI model detects unbundled codes or errors, the document will trigger a Validation Failed flag natively within its stage. Click "Resolve Error" to adjudicate it manually.</p>
                </div>
              </DialogContent>
            </Dialog>

            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="text-[10px] uppercase tracking-widest font-bold hidden sm:flex">
               <LogOut className="w-3 h-3 mr-2" /> End Session
            </Button>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID VIEW */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          
          <div className="flex items-center justify-between border-b pb-4">
             <div className="flex items-center gap-3">
               <div>
                  <h2 className="text-xl font-bold tracking-tight uppercase">Master Registry</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">{patients.length} Open Workflows</p>
               </div>
             </div>
             
             {/* ADD NEW PATIENT */}
             <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
               <DialogTrigger asChild>
                 <Button className="font-bold text-xs uppercase tracking-widest rounded-sm">
                   <Plus className="w-4 h-4 mr-2" /> Registry Entry
                 </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle className="uppercase tracking-widest text-sm font-bold">New Registry Entry</DialogTitle>
                 </DialogHeader>
                 <form onSubmit={handleCreatePatient}>
                   <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                       <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Full Legal Name</Label>
                       <Input id="name" value={newPatientName} onChange={(e)=>setNewPatientName(e.target.value)} required className="rounded-sm" />
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Admission Date</Label>
                       <Input id="date" type="date" value={newPatientDate} onChange={(e)=>setNewPatientDate(e.target.value)} required className="rounded-sm" />
                     </div>
                   </div>
                   <DialogFooter>
                     <Button type="submit" className="w-full font-bold uppercase tracking-widest rounded-sm">Initialize File</Button>
                   </DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>
          </div>

          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 rounded-full border-4 border-foreground border-t-transparent"></div></div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
               {patients.length === 0 ? (
                 <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/20 border border-dashed text-sm font-medium uppercase tracking-widest rounded-sm">Registry is empty.</div>
               ) : (
                 patients.map(patient => (
                   <Card key={patient.id} onClick={() => setActivePatientId(patient.id)} className="shadow-sm border border-border cursor-pointer hover:border-foreground transition-colors group rounded-sm">
                      <div className="p-5 flex flex-col gap-5">
                         <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                               <h3 className="font-bold text-foreground leading-tight tracking-tight text-lg group-hover:underline underline-offset-4">{patient.name}</h3>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-1">ID: {patient.id}</p>
                            </div>
                            <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center font-bold text-foreground text-xs font-mono border">
                              {patient.documents.length}
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between text-xs font-medium border-t pt-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]"><Clock className="w-3 h-3" /> Admitted</span>
                            <span className="font-bold text-foreground font-mono">{patient.admission_date}</span>
                         </div>
                      </div>
                   </Card>
                 ))
               )}
             </div>
          )}
        </div>
      </main>

      {/* THE PATIENT ISOLATED TAB POPOVER */}
      <Dialog open={!!activePatientId} onOpenChange={(val) => !val && setActivePatientId(null)}>
        <DialogContent className="sm:max-w-2xl bg-background border-border p-0 gap-0 overflow-hidden shadow-2xl">
           {activePatient && (
             <>
               <DialogHeader className="p-6 border-b bg-muted/10">
                 <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight">{activePatient.name}</DialogTitle>
                      <DialogDescription className="text-xs uppercase tracking-widest font-mono mt-1 flex items-center gap-4">
                        <span>ID: {activePatient.id}</span>
                        <span>Adm: {activePatient.admission_date}</span>
                      </DialogDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-background">Active File</Badge>
                 </div>
               </DialogHeader>
               
               <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-muted/5">
                 {getVisibleStages(activePatient).map((stage, idx, arr) => (
                   <div key={stage} className="relative">
                      {/* Visual Line connector if not last item */}
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-6 top-10 bottom-0 w-px bg-border -mb-10 z-0"></div>
                      )}
                      
                      <div className="relative z-10 pl-1">
                        <DocumentSection patient={activePatient} targetStage={stage} />
                      </div>
                   </div>
                 ))}
               </div>
               
               <DialogFooter className="p-4 border-t bg-muted/20 sm:justify-between items-center flex-row">
                 <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center"><Activity className="w-3 h-3 mr-1" /> Session Secured</span>
                 <Button onClick={() => setActivePatientId(null)} variant="default" size="sm" className="font-bold uppercase tracking-widest text-[10px] px-6 rounded-sm">Close Tab</Button>
               </DialogFooter>
             </>
           )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
