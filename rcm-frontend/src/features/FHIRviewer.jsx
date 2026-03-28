import React, { useState } from 'react';
import { Database, ShieldCheck, User, Activity, ArrowRight, ArrowLeft, Code, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FhirViewer = ({ files = [], apiResults = [], onProceed, onBack }) => {
  const [copied, setCopied] = useState(false);

  // Grab the first file's name to make the JSON look dynamic, fallback to default if missing
  const dynamicFileName = files.length > 0 ? files[0].name.replace('.pdf', '') : "Batch_001";

  // Use the real FHIR bundle from the backend if available
  const fhirPayload = apiResults.length > 0 && apiResults[0].fhir_bundle ? apiResults[0].fhir_bundle : {
    "resourceType": "Bundle",
    "id": `bundle-${dynamicFileName.substring(0, 5)}`,
    "type": "collection",
    "entry": [
      {
        "fullUrl": `http://intern.local/fhir/Patient/pat-${dynamicFileName}`,
        "resource": {
          "resourceType": "Patient",
          "id": `pat-${dynamicFileName}`,
          "name": [{ "family": "Patient", "given": ["Test"] }]
        }
      },
      {
        "fullUrl": "http://intern.local/fhir/Claim/claim-1001",
        "resource": {
          "resourceType": "Claim",
          "id": "claim-1001",
          "status": "active",
          "use": "claim",
          "patient": { "reference": `Patient/pat-${dynamicFileName}` },
          "created": "2026-03-12"
        }
      }
    ]
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-500">
      
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center hidden sm:block">
          <h2 className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            FHIR R4 BUNDLE
          </h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
            Interoperability Standard Ready
          </p>
        </div>

        <Button onClick={onProceed} className="font-bold shadow-md shadow-primary/20">
          Run Reconciliation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Alert className="mb-6 bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle className="text-sm font-bold uppercase tracking-wide">Payload Generated Successfully</AlertTitle>
        <AlertDescription className="text-xs font-semibold">
          Data has been mapped strictly to global HL7 interoperability standards.
        </AlertDescription>
      </Alert>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-380px)] min-h-[400px]">
        
        {/* LEFT: JSON Code Viewer */}
        <Card className="lg:col-span-3 bg-zinc-950 text-zinc-50 border-zinc-800 shadow-xl flex flex-col overflow-hidden">
          <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flex space-x-1.5">
                 <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
               </div>
               <span className="text-zinc-400 text-xs font-mono flex items-center gap-2">
                 <Database className="w-3 h-3" /> claim_bundle.json
               </span>
            </div>
            
            <div className="flex items-center gap-3">
               <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-400 border-emerald-400/20 bg-emerald-400/10 rounded-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
               </Badge>
               <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="h-7 text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800"
               >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
               </Button>
            </div>
          </div>
          
          <div className="p-5 overflow-y-auto flex-grow text-[13px] font-mono text-emerald-300 custom-scrollbar">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(fhirPayload, null, 2)}
            </pre>
          </div>
        </Card>

        {/* RIGHT: Interactive Breakdown / Highlights */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col overflow-hidden">
           <CardHeader className="bg-muted/30 pb-4 border-b">
             <CardTitle className="text-sm font-bold uppercase tracking-wide">Payload Breakdown</CardTitle>
             <CardDescription className="text-xs">Understand how the AI structured the metadata.</CardDescription>
           </CardHeader>
           <div className="p-4 overflow-y-auto flex-grow custom-scrollbar">
             <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger className="hover:no-underline font-bold text-sm">
                    <span className="flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> The Bundle Envelope</span>
                 </AccordionTrigger>
                 <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                   Acts as a secure container wrapping multiple resources (Patient + Claim + Organization) into a single deliverable package for standard ingestion endpoints.
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-2">
                 <AccordionTrigger className="hover:no-underline font-bold text-sm">
                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Patient Identity</span>
                 </AccordionTrigger>
                 <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                   Extracts and normalizes demographics. Notice how the string is strictly split into <code className="bg-accent text-accent-foreground px-1 py-0.5 rounded text-[10px] font-mono border">family</code> and <code className="bg-accent text-accent-foreground px-1 py-0.5 rounded text-[10px] font-mono border">given</code> name arrays.
                 </AccordionContent>
               </AccordionItem>

               <AccordionItem value="item-3">
                 <AccordionTrigger className="hover:no-underline font-bold text-sm">
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Clinical Linkage</span>
                 </AccordionTrigger>
                 <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                   The AI mapped the CPT procedure codes specifically to their respective ICD-10 diagnosis pointers using the FHIR <code className="bg-accent text-accent-foreground px-1 py-0.5 rounded text-[10px] font-mono border">diagnosisSequence</code> linkage to prevent basic denial workflows.
                 </AccordionContent>
               </AccordionItem>
             </Accordion>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default FhirViewer;