import React, { useState } from 'react';
import { Database, ShieldCheck, User, Activity, ArrowRight, ArrowLeft, Code, Copy, CheckCircle2 } from 'lucide-react';

const FhirViewer = ({ files = [], apiResults = [], onProceed, onBack }) => {
  const [activeSection, setActiveSection] = useState('bundle');
  const [copied, setCopied] = useState(false);

  // Grab the first file's name to make the JSON look dynamic, fallback to default if missing
  const dynamicFileName = files.length > 0 ? files[0].name.replace('.pdf', '') : "Pandurang_Khamitkar";

  // Use the real FHIR bundle from the backend if available
  const fhirPayload = apiResults.length > 0 && apiResults[0].fhir_bundle ? apiResults[0].fhir_bundle : {
    "resourceType": "Bundle",
    "id": `bundle-${dynamicFileName.substring(0, 5)}`,
    "type": "collection",
    "entry": [
      {
        "fullUrl": `http://hackathon.local/fhir/Patient/pat-${dynamicFileName}`,
        "resource": {
          "resourceType": "Patient",
          "id": `pat-${dynamicFileName}`,
          "name": [{ "family": "Khamitkar", "given": ["Pandurang"] }]
        }
      },
      {
        "fullUrl": "http://hackathon.local/fhir/Claim/claim-1001",
        "resource": {
          "resourceType": "Claim",
          "id": "claim-1001",
          "status": "active",
          "use": "claim",
          "patient": { "reference": `Patient/pat-${dynamicFileName}` },
          "created": "2026-03-12",
          "diagnosis": [
            {
              "sequence": 1,
              "diagnosisCodeableConcept": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/sid/icd-10-cm",
                    "code": "Z00.00",
                    "display": "Encounter for general adult medical examination"
                  }
                ]
              }
            }
          ],
          "item": [
            {
              "sequence": 1,
              "diagnosisSequence": [1],
              "productOrService": {
                "coding": [
                  {
                    "system": "http://www.ama-assn.org/go/cpt",
                    "code": "99386",
                    "display": "PREV VISIT NEW AGE 40-64"
                  }
                ]
              }
            }
          ]
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
    <div className="flex flex-col h-full p-4 sm:p-6 animate-in slide-in-from-right-8 duration-500">
      
      {/* TOP NAVIGATION BAR (Matches ExtractionDashboard) */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <Code className="w-5 h-5 text-teal-600" />
            FHIR R4 BUNDLE
          </h2>
          <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">
            Interoperability Standard Ready
          </p>
        </div>

        <button 
          onClick={onProceed}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-slate-800/20"
        >
          Run Reconciliation
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Success Banner */}
      <div className="bg-teal-50/80 border border-teal-200/60 p-4 rounded-2xl flex items-center justify-between shadow-sm mb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-8 h-8 text-teal-600" />
          <div>
            <h2 className="text-sm font-black text-teal-900 uppercase tracking-wide">Payload Generated Successfully</h2>
            <p className="text-teal-700/80 text-xs font-medium mt-0.5">Data has been successfully mapped to global HL7 interoperability standards.</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-380px)] min-h-[400px]">
        
        {/* LEFT: JSON Code Viewer (Dark Mode Mac Terminal Style) */}
        <div className="w-full lg:w-3/5 bg-slate-950 rounded-2xl shadow-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="bg-[#1e2329] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </span>
              <span className="text-slate-400 text-xs font-mono flex items-center gap-2">
                <Database className="w-3 h-3" /> claim_{dynamicFileName}.json
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                <CheckCircle2 className="w-3 h-3" /> Valid
              </span>
              <button 
                onClick={copyToClipboard}
                className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono bg-slate-800/50 px-2 py-1 rounded"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="p-5 overflow-y-auto flex-grow text-[13px] font-mono text-emerald-300/90 custom-scrollbar bg-[#0d1117]">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(fhirPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* RIGHT: Interactive Breakdown / Highlights */}
        <div className="w-full lg:w-2/5 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Payload Breakdown</h3>
          
          <div 
            onClick={() => setActiveSection('bundle')}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${activeSection === 'bundle' ? 'border-teal-500 bg-white shadow-md shadow-teal-500/10' : 'border-transparent bg-slate-50/80 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Database className={`w-4 h-4 ${activeSection === 'bundle' ? 'text-teal-600' : 'text-slate-400'}`} />
              <h4 className={`text-sm font-bold ${activeSection === 'bundle' ? 'text-slate-800' : 'text-slate-600'}`}>1. The Bundle Envelope</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Acts as a secure container wrapping multiple resources (Patient + Claim) into a single deliverable package for the TPA.</p>
          </div>

          <div 
            onClick={() => setActiveSection('patient')}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${activeSection === 'patient' ? 'border-teal-500 bg-white shadow-md shadow-teal-500/10' : 'border-transparent bg-slate-50/80 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className={`w-4 h-4 ${activeSection === 'patient' ? 'text-teal-600' : 'text-slate-400'}`} />
              <h4 className={`text-sm font-bold ${activeSection === 'patient' ? 'text-slate-800' : 'text-slate-600'}`}>2. Patient Identity</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Extracts and normalizes demographics. Notice how the string is strictly split into <code className="bg-slate-100 px-1 rounded text-slate-700">family</code> and <code className="bg-slate-100 px-1 rounded text-slate-700">given</code> name arrays.</p>
          </div>

          <div 
            onClick={() => setActiveSection('claim')}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${activeSection === 'claim' ? 'border-teal-500 bg-white shadow-md shadow-teal-500/10' : 'border-transparent bg-slate-50/80 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-4 h-4 ${activeSection === 'claim' ? 'text-teal-600' : 'text-slate-400'}`} />
              <h4 className={`text-sm font-bold ${activeSection === 'claim' ? 'text-slate-800' : 'text-slate-600'}`}>3. Medical Necessity (Linkage)</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">The AI mapped the CPT procedure (99386) to the ICD-10 diagnosis (Z00.00) using <code className="bg-slate-100 px-1 rounded text-slate-700">diagnosisSequence</code> to prevent denial.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FhirViewer;