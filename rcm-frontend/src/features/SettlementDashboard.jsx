import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronLeft, 
  TrendingUp, 
  FileText, 
  ShieldAlert,
  ArrowRight,
  Calculator,
  Gavel
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function SettlementDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settlementResult, patient } = location.state || {};

  if (!settlementResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-bold uppercase tracking-widest">No Settlement Data Found</h2>
        <Button onClick={() => navigate('/dashboard')} variant="outline">Return to Registry</Button>
      </div>
    );
  }

  const { is_audit_passed, total_deduction_amount, deductions, patient_name } = settlementResult;
  const passed = is_audit_passed;

  const parseProbability = (prob) => {
    if (!prob) return 0;
    return parseInt(prob.replace('%', '')) || 0;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans animate-in fade-in zoom-in-95 duration-700">
      {/* HEADER */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ChevronLeft className="w-5 h-5" />
             </Button>
             <div>
               <h1 className="text-lg font-bold tracking-tight uppercase leading-none">Settlement Audit</h1>
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mt-1">
                 Final Adjudication Sync
               </p>
             </div>
          </div>
          <Badge variant="outline" className="px-4 py-1 font-bold uppercase tracking-widest bg-muted/20">
             Process ID: AUD-{Math.floor(Math.random() * 90000 + 10000)}
          </Badge>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* TOP STATUS CARD */}
          <Card className={`overflow-hidden border-2 transition-all duration-500 shadow-xl ${
            passed ? 'border-primary shadow-primary/10' : 'border-destructive shadow-destructive/5'
          }`}>
             <div className={`h-1.5 w-full ${passed ? 'bg-primary' : 'bg-destructive'}`} />
             <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 bg-muted/5">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                  passed ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                }`}>
                   {passed ? <CheckCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                </div>
                
                <div className="flex-grow text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight uppercase">{patient_name}</h2>
                    <Badge variant={passed ? "default" : "destructive"} className="uppercase font-bold tracking-tighter px-3">
                      {passed ? 'Clean Pass' : 'Deduction Found'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {passed 
                      ? 'The insurance settlement file matches the clinical records perfectly. No financial leakages detected. The claim is considered fully reconciled with 100% recovery.' 
                      : `A shortfall of ₹${total_deduction_amount.toLocaleString()} was identified in the settlement letter. Our AI has cross-analyzed the clinical records to determine the optimal recovery path.`}
                  </p>
                </div>

                {!passed && (
                  <div className="shrink-0 bg-background border px-6 py-4 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Deduction</span>
                    <span className="text-2xl font-black text-destructive tracking-tighter">₹{total_deduction_amount.toLocaleString()}</span>
                  </div>
                )}
             </CardContent>
          </Card>

          {/* DEDUCTION BREAKDOWN */}
          {!passed && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Detailed Anomaly Report</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {deductions.map((deduction, idx) => {
                  const prob = parseProbability(deduction.pass_probability);
                  const isLow = prob < 15;

                  return (
                    <Card key={idx} className="group overflow-hidden border-border/40 hover:border-primary/40 transition-all">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                        {/* Summary Column */}
                        <div className="lg:col-span-4 p-6 bg-muted/10 border-r border-border/30 flex flex-col justify-between">
                           <div>
                             <div className="flex flex-wrap items-center gap-2 mb-3">
                               <Badge variant="outline" className="font-mono text-[9px] uppercase font-bold tracking-widest">Item {idx + 1}</Badge>
                               <span className="text-xs font-bold text-destructive flex items-center">
                                 <Calculator className="w-3 h-3 mr-1" /> ₹{deduction.amount.toLocaleString()}
                               </span>
                             </div>
                             <h4 className="text-lg font-bold tracking-tight leading-snug">{deduction.reason_given || "Underpayment / Deduction"}</h4>
                           </div>
                           
                           <div className="mt-6">
                             <span className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">AI Appeal Confidence</span>
                             <div className="flex items-end gap-3">
                               <span className={`text-4xl font-black tracking-tighter ${isLow ? 'text-muted-foreground' : 'text-primary'}`}>
                                 {deduction.pass_probability}
                               </span>
                               <Progress value={prob} className={`h-1.5 w-24 mb-3 ${isLow ? 'bg-muted opacity-40' : 'bg-primary/20'}`} />
                             </div>
                           </div>
                        </div>

                        {/* Recommendation Column */}
                        <div className="lg:col-span-8 p-6 flex flex-col justify-between relative bg-background">
                           <div className="space-y-4">
                             <div className="flex items-start gap-3">
                               <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                               <div>
                                 <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Clinical Recommendation</span>
                                 <p className="text-sm font-medium leading-relaxed">
                                   {deduction.recommendation}
                                 </p>
                               </div>
                             </div>

                             {isLow && (
                               <div className="bg-destructive/5 border border-destructive/10 p-4 rounded-lg flex items-start gap-3">
                                 <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                 <div>
                                   <p className="text-xs font-bold text-destructive uppercase tracking-widest">Case 3: Unrecoverable Deduction</p>
                                   <p className="text-[11px] text-destructive/70 font-medium mt-1 leading-normal">
                                     The AI analysis indicates this deduction is justified per standard policy. Re-appealing is likely to result in redundant administrative costs with &lt;15% success rate.
                                   </p>
                                 </div>
                               </div>
                             )}
                           </div>
                           
                           <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/20">
                             {!isLow ? (
                               <Button className="font-bold uppercase tracking-widest text-[10px] h-9 gap-2 shadow-lg shadow-primary/20">
                                 <TrendingUp className="w-3 h-3" />
                                 Generate Appeal Letter
                                 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                               </Button>
                             ) : (
                               <Button variant="outline" disabled className="font-bold uppercase tracking-widest text-[10px] h-9 gap-2 opacity-50 grayscale">
                                 <Gavel className="w-3 h-3" />
                                 Deduction Final / Closed
                               </Button>
                             )}
                           </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* EMPTY STATE: ALL PASSED */}
          {passed && (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
               <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-bounce duration-[2000ms]">
                 <CheckCircle className="w-12 h-12 text-primary" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-bold tracking-tight uppercase">Perfect Settlement Correlation</h3>
                 <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                   All financial figures in the settlement letter align with the claimed amounts and clinical ground truth in FHIR records.
                 </p>
               </div>
               <Button onClick={() => navigate('/dashboard')} variant="default" className="shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px] px-8">
                 Back to Registry
               </Button>
            </div>
          )}

        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="p-8 border-t bg-muted/10 text-center">
         <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.3em]">
           Automated Auditing System • Powered by Gemini Flash
         </p>
      </footer>
    </div>
  );
}
