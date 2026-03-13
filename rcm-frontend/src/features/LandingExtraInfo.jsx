import React from 'react';
import { Shield, Zap, FileJson, Cloud, CheckCircle, HelpCircle, FileText, Activity } from 'lucide-react';

const LandingExtraInfo = () => {
  return (
    <div className="w-full bg-white border-t border-slate-200 mt-20 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION 1: Features Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Convert Clinical PDFs to FHIR R4 Effortlessly</h2>
            <p className="mt-4 text-slate-500">Join top-tier hospitals and TPAs who trust our AI-driven engine to normalize unstructured medical data into compliant interoperability standards.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-teal-600" />}
              title="Fast & Easy AI Extraction"
              desc="Drag and drop EOBs, lab reports, or discharge summaries. Our Gemini-powered RAG engine instantly maps unstructured text to precise ICD-10 and CPT codes."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-teal-600" />}
              title="HIPAA-Grade Security"
              desc="We are serious about PHI security. TLS 1.3 encryption safeguards your batch processing. All documents are purged from our RAM instantly after FHIR generation."
            />
            <FeatureCard 
              icon={<Cloud className="w-6 h-6 text-teal-600" />}
              title="Cloud-Native Architecture"
              desc="Our normalization engine runs entirely in the cloud. Process batches of up to 10,000 PDFs without burning your local CPU or requiring software installation."
            />
            <FeatureCard 
              icon={<FileJson className="w-6 h-6 text-teal-600" />}
              title="100% FHIR R4 Compliant"
              desc="We don't just extract text; we structure it. Output perfectly nested Patient, Encounter, and Claim resources ready for immediate TPA ingestion."
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-teal-600" />}
              title="Automated Reconciliation"
              desc="Stop claim denials before they happen. Our built-in rules engine checks financial limits and medical necessity (CPT to ICD-10 linkage) in real-time."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-teal-600" />}
              title="Any Medical Format"
              desc="While optimized for scanned PDFs, our EasyOCR pipeline can handle TIFFs, JPEGs, and raw text blobs, converting them seamlessly into structured JSON."
            />
          </div>
        </div>

        <hr className="border-slate-200 mb-20" />

        {/* SECTION 2: FAQs */}
        <div className="mb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FaqItem 
              q="What medical document formats can I normalize to FHIR?"
              a="Our engine supports a wide array of unstructured formats including scanned PDF Discharge Summaries, Explanation of Benefits (EOB), Itemized Hospital Bills, and digital Clinical Notes. The AI handles messy tables and OCR artifacts flawlessly."
            />
            <FaqItem 
              q="How does the AI ensure accurate ICD-10 and CPT coding?"
              a="We utilize a Retrieval-Augmented Generation (RAG) pipeline powered by Gemini 2.5 Flash. It contextualizes the physician's raw notes against standard medical ontologies to suggest the highest-confidence procedural and diagnostic codes."
            />
            <FaqItem 
              q="Is my patient data (PHI) secure during conversion?"
              a="Absolutely. We operate a zero-retention policy for the hackathon environment. Documents are processed in ephemeral memory, converted to FHIR, and the source PDFs are immediately destroyed. We are fully compliant with SOC2 and HIPAA guidelines."
            />
            <FaqItem 
              q="Can I process a batch of claims at once?"
              a="Yes! Simply drag and drop multiple PDFs into the ingestion zone. The batch processing engine will queue them up and output a unified FHIR Bundle containing all respective Patient and Claim resources."
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: The "Fat Footer" (Smallpdf style) */}
      <div className="bg-slate-900 pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 text-sm">
            
            {/* Fake Links to look like a massive company */}
            <FooterColumn title="Solutions" links={['RCM Normalization', 'Denial Prevention', 'Prior Auth AI', 'FHIR API Gateway']} />
            <FooterColumn title="AI Tools" links={['PDF to FHIR', 'Text to ICD-10', 'Text to CPT', 'Medical OCR', 'Anomaly Detection']} />
            <FooterColumn title="Interoperability" links={['HL7 v2 to FHIR', 'CCDA Parsing', 'X12 EDI 837 Translation', 'SMART on FHIR']} />
            <FooterColumn title="Company" links={['About Us', 'Jio Hackathon 2026', 'Careers', 'Security (HIPAA)']} />
            
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                   <div className="w-4 h-4 border-2 border-slate-900 rounded-sm rotate-45" />
                </div>
                <span className="text-xl font-black text-white tracking-tight">NORMALIZE</span>
              </div>
              <p className="text-slate-400 text-xs mb-4">We make healthcare interoperability easy, secure, and instant.</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800 text-slate-500 text-xs">
            <p>© 2026 RCM Normalize AG — Built for the Jio Hackathon.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-teal-400">Privacy Notice</a>
              <a href="#" className="hover:text-teal-400">Terms & Conditions</a>
              <a href="#" className="hover:text-teal-400">Imprint</a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// --- Mini Components for cleaner code ---

const FeatureCard = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 mt-1">{icon}</div>
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const FaqItem = ({ q, a }) => (
  <div className="border-b border-slate-200 pb-4">
    <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
      <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
      {q}
    </h4>
    <p className="text-slate-600 text-sm leading-relaxed pl-7">{a}</p>
  </div>
);

const FooterColumn = ({ title, links }) => (
  <div>
    <h4 className="text-white font-bold mb-4">{title}</h4>
    <ul className="space-y-2">
      {links.map((link, idx) => (
        <li key={idx}><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">{link}</a></li>
      ))}
    </ul>
  </div>
);

export default LandingExtraInfo;