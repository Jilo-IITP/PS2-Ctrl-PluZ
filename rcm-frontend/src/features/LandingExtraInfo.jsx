import React from 'react';
import { Separator } from "@/components/ui/separator";

const LandingExtraInfo = () => {
  return (
    <div className="w-full bg-card border-t border-border mt-auto pt-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION 3: The "Fat Footer" (Smallpdf / Corporate SaaS style) */}
        <div className="pb-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12 text-sm">
            
            {/* Fake Links to look like a massive company */}
            <FooterColumn title="Solutions" links={['RCM Normalization', 'Denial Prevention', 'Prior Auth AI', 'FHIR API Gateway']} />
            <FooterColumn title="AI Tools" links={['PDF to FHIR', 'Text to ICD-10', 'Text to CPT', 'Medical OCR', 'Anomaly Detection']} />
            <FooterColumn title="Interoperability" links={['HL7 v2 to FHIR', 'CCDA Parsing', 'X12 EDI 837 Translation', 'SMART on FHIR']} />
            <FooterColumn title="Company" links={['About Us', 'Hackathon 2026', 'Careers', 'Security (HIPAA)']} />
            
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                  R
                </div>
                <span className="text-xl font-bold text-foreground tracking-tight">NORMALIZE</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">We make healthcare interoperability easy, secure, and instant.</p>
            </div>
          </div>
          
          <Separator className="bg-border/60 mb-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center text-muted-foreground text-xs">
            <p>© 2026 RCM Normalize AG — Built for the Hackathon.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Privacy Notice</a>
              <a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-primary transition-colors">Imprint</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FooterColumn = ({ title, links }) => (
  <div>
    <h4 className="text-foreground font-bold mb-4 tracking-wide">{title}</h4>
    <ul className="space-y-3">
      {links.map((link, idx) => (
        <li key={idx}>
          <a href="#" className="text-muted-foreground hover:text-primary font-medium transition-colors">{link}</a>
        </li>
      ))}
    </ul>
  </div>
);

export default LandingExtraInfo;