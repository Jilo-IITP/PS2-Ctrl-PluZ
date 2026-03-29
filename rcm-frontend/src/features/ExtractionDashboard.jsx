import React, { useState } from 'react';
import { FileText, ArrowRight, ArrowLeft, Activity, ShieldCheck, CheckCircle2, Stethoscope, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ExtractionDashboard = ({ files = [], apiResults = [], isBatch = false, onConfirm, onAction, onBack, stage, patient }) => {
  const [activeFileId, setActiveFileId] = useState(`file-0`);

  const handleExportMediAssist = async () => {
    try {
      const activeData = isBatch ? (apiResults[0] || {}) : (apiResults[parseInt(activeFileId.split('-')[1])] || {});
      const preauthForm = activeData?.preauth_form_json;

      if (!preauthForm) {
        alert("Pre-Auth form data is not available for export.");
        return;
      }

      const resp = await fetch('http://localhost:8000/pipeline/export-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preauthForm)
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MediAssist_Export.html`;
        a.click();
      } else {
        alert('Export failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Export failed. Check backend console.');
    }
  };

  // Helper: render a key-value grid from a flat object
  const renderKVGrid = (obj, title) => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false && !Array.isArray(v) && typeof v !== 'object');
    if (entries.length === 0) return null;
    return (
      <div className="mb-3">
        {title && <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">{title}</h4>}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
              <span className="text-xs font-semibold text-foreground truncate" title={String(val)}>{String(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">

      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between py-1 px-4 bg-muted/30 shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground font-bold h-7 px-2 text-xs">
          <ArrowLeft className="w-3.5 h-2 mr-1.5" />
          Back
        </Button>

        <div className="flex gap-2 items-center">
          {stage === 'preAuth' && (
            <Button variant="outline" size="sm" onClick={handleExportMediAssist} className="font-bold border-muted-foreground text-[10px] uppercase tracking-widest hidden sm:flex">
              Export MediAssist JSON
            </Button>
          )}

          {stage === 'preAuth' ? (
            <>
              <Button size="sm" onClick={() => onAction('admit')} className="font-semibold cursor-pointer text-white bg-black shadow-md shadow-green-900/20">
                Admit Patient
              </Button>
              <Button size="sm" onClick={() => onAction('discharge')} variant="destructive" className="font-bold shadow-md">
                Discharge
              </Button>
              <Button size="sm" onClick={onConfirm} variant="outline" className="font-bold shadow-sm">
                View FHIR Bundle
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </>
          ) : stage === 'admitted' ? (
            <>
              <Button size="sm" onClick={onConfirm} variant="outline" className="font-bold shadow-sm">
                View FHIR Bundle
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
              <Button size="sm" onClick={() => onAction('discharge')} variant="destructive" className="font-bold shadow-md">
                Discharge Patient
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onConfirm} className="font-bold shadow-md shadow-foreground/10">
              Approve Batch ({files.length})
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeFileId} onValueChange={setActiveFileId} className="w-full grow flex flex-col">
        {files.length > 1 && (
          <TabsList className="mb-4 h-auto flex flex-wrap justify-start items-center p-1 bg-muted/50 w-full overflow-x-auto">
            {files.map((file, idx) => (
              <TabsTrigger
                key={idx}
                value={`file-${idx}`}
                className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px] text-xs font-semibold">{file.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {files.map((currentFile, idx) => {
          const currentAiData = isBatch ? (apiResults[0] || {}) : (apiResults[idx] || {});
          const pdfUrl = currentFile ? (currentFile.url || URL.createObjectURL(currentFile)) : null;
          const confidenceScore = currentAiData?.confidence_score || 0;
          const diagnoses = currentAiData?.patient?.diagnoses || [];
          const services = currentAiData?.patient?.services || [];
          const preauthForm = currentAiData?.preauth_form_json;

          return (
            <TabsContent key={idx} value={`file-${idx}`} className="mt-0 h-full">
              {/* MAIN SPLIT VIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px]">

                {/* LEFT PANEL: Document Preview */}
                <Card className="lg:col-span-5 flex flex-col overflow-hidden shadow-sm h-full">
                  <div className="bg-muted p-3 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-background border rounded-md flex items-center justify-center text-foreground">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">Source Document</h3>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{currentFile?.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      Read-only
                    </Badge>
                  </div>
                  <CardContent className="grow p-0 relative">
                    {pdfUrl ? (
                      <iframe src={pdfUrl} className="w-full h-full absolute inset-0 bg-white" title="PDF Preview" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm font-medium">
                        No document available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RIGHT PANEL: AI Extracted Data */}
                <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar h-full pb-8">

                  {/* Top Metric Card */}


                  {/* Header Info */}
                  {/* <Card className="shadow-sm border-l-4 border-l-foreground">
                    <CardHeader className="p-5 pb-0">
                      <CardTitle className="text-xs font-bold uppercase tracking-wide border-b pb-2">Claim Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-4">
                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Hospital / Provider</p>
                          <p className="font-bold text-foreground">{currentAiData?.hospital_name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Invoice Date</p>
                          <p className="font-bold text-foreground">{currentAiData?.invoice_date || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Patient Name</p>
                          <p className="font-bold text-foreground">{currentAiData?.patient?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Invoice #</p>
                          <p className="font-bold text-foreground">{currentAiData?.invoice_number || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card> */}

                  {/* Diagnoses Card */}
                  {/* {diagnoses.length > 0 && (
                    <Card className="shadow-sm border-l-4 border-l-amber-500">
                      <CardHeader className="p-5 flex flex-row items-center justify-between pb-2 border-b">
                        <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" /> Diagnoses
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                          {diagnoses.length} Found
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-xs font-bold w-[60%]">Condition</TableHead>
                              <TableHead className="text-xs font-bold">ICD-10 Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {diagnoses.map((d, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium text-xs">{d.condition || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-amber-600 bg-amber-500/10 border-amber-500/30">
                                    {d.icd_10_code || '—'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )} */}

                  {/* Services & Coding Table */}
                  <Card className="shadow-sm shrink-0 border-l-4 border-l-blue-500">
                    <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 border-b">
                      <CardTitle className="text-xs font-bold uppercase tracking-wide">Coded Services</CardTitle>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" /> RAG ACTIVE
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[40%] text-xs font-bold">Description</TableHead>
                            <TableHead className="text-xs font-bold">Amt (₹)</TableHead>
                            <TableHead className="text-xs font-bold">CPT</TableHead>
                            <TableHead className="text-xs font-bold">ICD-10</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {services.length > 0 ? (
                            services.map((svc, sIdx) => (
                              <TableRow key={sIdx}>
                                <TableCell className="font-medium text-xs">{svc.description}</TableCell>
                                <TableCell className="font-bold text-xs">{svc.amount}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-primary bg-primary/5 font-mono">{svc.cpt_code || '—'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-amber-600 bg-amber-500/10 border-amber-500/30">{svc.icd_10 || '—'}</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No services extracted.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Pre-Auth Form Data (only for preAuth) — rendered as structured cards */}
                  {stage === 'preAuth' && preauthForm && (
                    <Card className="shadow-sm border-l-4 border-l-blue-500 shrink-0">
                      <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 border-b">
                        <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" /> Pre-Auth Form Data (Medi Assist)
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                          <CheckCircle2 className="w-3 h-3 mr-1.5" /> FORM MAPPED
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                        {renderKVGrid(preauthForm.patient, "Patient Details")}
                        {renderKVGrid(preauthForm.doctor, "Doctor / Treatment")}
                        {renderKVGrid(preauthForm.admission, "Admission Details")}
                        {renderKVGrid(preauthForm.costs, "Cost Estimates")}
                        {renderKVGrid(preauthForm.hospital, "Hospital Info")}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ExtractionDashboard;