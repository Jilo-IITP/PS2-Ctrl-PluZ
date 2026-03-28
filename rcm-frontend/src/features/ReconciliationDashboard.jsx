import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ShieldCheck, Send, RefreshCcw, ArrowLeft, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ReconciliationDashboard = ({ files = [], apiResults = [], onRestart, onBack }) => {
  const dynamicFileName = files.length > 0 ? files[0].name.replace('.pdf', '') : "Batch_001";
  
  // Aggregate all anomalies from all files in the batch
  const allIssues = apiResults.flatMap(res => res.validation_report?.issue || []);
  const hasErrors = allIssues.length > 0;

  return (
    <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
      
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center hidden sm:block">
          <h2 className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 text-foreground" />
            FINAL ADJUDICATION
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Pre-Submission Rules Engine
          </p>
        </div>

        <Badge variant="outline" className="px-4 py-1.5 uppercase tracking-widest font-bold">
          {files.length} {files.length === 1 ? 'Doc' : 'Docs'} Queued
        </Badge>
      </div>

      <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Status Banner */}
        <Alert variant={hasErrors ? "destructive" : "default"} className={`flex items-start md:items-center py-5 ${hasErrors ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/20 text-primary'}`}>
           {hasErrors ? <ShieldAlert className="w-6 h-6 mr-4 flex-shrink-0" /> : <ShieldCheck className="w-6 h-6 mr-4 flex-shrink-0" />}
           
           <div className="flex-grow">
              <AlertTitle className="text-xl font-bold tracking-tight mb-1">
                {hasErrors ? 'Anomaly Detected: Claim Auto-Paused' : 'Batch 100% Reconciled Successfully'}
              </AlertTitle>
              <AlertDescription className={`text-xs font-semibold ${hasErrors ? 'text-destructive' : 'text-foreground'}`}>
                {hasErrors ? 'Revenue leakage or clinical mismatch detected. Manual review required to proceed.' : 'All clinical and financial rules passed. The payload is fully compliant and ready for automated TPA submission.'}
              </AlertDescription>
           </div>
        </Alert>

        {/* The Audit Rules Engine UI */}
        <Card className="flex-grow flex flex-col shadow-sm">
          <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
             <CardTitle className="text-sm font-bold uppercase tracking-wide">Automated Audit Rules Log</CardTitle>
             <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">Instance: {dynamicFileName}</span>
          </CardHeader>
          
          <CardContent className="p-0">
             {hasErrors ? (
               <div className="divide-y divide-border">
                 {allIssues.map((issue, idx) => (
                   <div key={idx} className="flex items-start space-x-4 p-5 hover:bg-muted/10 transition-colors">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="w-full">
                        <h4 className="font-bold text-sm mb-2 text-foreground">{issue.details?.text || "Anomaly Detected"}</h4>
                        <div className="mt-2 text-xs text-muted-foreground bg-muted p-3 flex flex-col gap-2 rounded-lg border">
                          <p><strong className="text-foreground">Diagnostics Trace:</strong> {issue.diagnostics || "No deeper trace available"}</p>
                          <p><strong className="text-foreground">Context Block:</strong> {issue.expression?.[0] || "Root level"}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
                   <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-2">
                     <CheckCircle2 className="w-8 h-8 text-primary" />
                   </div>
                   <h4 className="font-bold text-lg text-foreground tracking-tight">All CMS & TPA Rules Passed</h4>
                   <p className="text-sm text-muted-foreground max-w-sm">No unbundling, MUEs, or medical necessity violations were identified during the automated validation sequence.</p>
                </div>
             )}
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/20 flex gap-4 mt-auto">
            <Button 
                variant="outline" 
                onClick={onRestart}
                className="w-1/3 font-bold"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                New Batch
              </Button>
              
              <Button 
                disabled={hasErrors}
                className={`w-2/3 font-bold shadow-md shadow-primary/20 ${hasErrors ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Send className="w-4 h-4 mr-2" />
                {hasErrors ? 'Resolve Errors First' : 'Submit Payload via FHIR API'}
              </Button>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
};

export default ReconciliationDashboard;