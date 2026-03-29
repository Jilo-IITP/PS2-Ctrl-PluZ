import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const API_BASE = 'http://localhost:8000';

export function useDashboardLogic() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePatientId, setActivePatientId] = useState(null);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const [patientForm, setPatientForm] = useState({
    name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: ""
  });

  const [hospitalForm, setHospitalForm] = useState({
    name: "", location: "", email_id: "", rohini_id: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: cur } }) => {
      setSession(cur);
      if (cur) { fetchProfile(cur); fetchPatients(cur); }
      else { setLoading(false); }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) { fetchProfile(s); fetchPatients(s); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (s) => {
    const res = await fetch(`${API_BASE}/users/me`, { headers: { 'Authorization': `Bearer ${s.access_token}` } });
    if (res.ok) {
      const data = await res.json();
      setUserProfile(data);
      if (!data.hospital_id) setIsOnboardingOpen(true);
    }
  };

  const fetchPatients = async (s) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patients/`, { headers: { 'Authorization': `Bearer ${s.access_token}` } });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      const enhanced = await Promise.all(data.map(async (pat) => {
        const dRes = await fetch(`${API_BASE}/documents/?patient_id=${pat.id}`, { headers: { 'Authorization': `Bearer ${s.access_token}` } });
        let docs = [];
        if (dRes.ok) {
          const raw = await dRes.json();
          docs = raw.map(d => {
            const stage = d.file_name?.includes('__') ? d.file_name.split('__')[0] : 'admitted';
            const name = d.file_name?.includes('__') ? d.file_name.split('__').slice(1).join('__') : (d.file_name || 'Doc.pdf');
            
            return { ...d, name, stage, status: 'pending', url: d.file_url };
          });
        }
        return { ...pat, documents: docs };
      }));
      setPatients(enhanced);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const hRes = await fetch(`${API_BASE}/hospitals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(hospitalForm)
    });
    const h = await hRes.json();
    await fetch(`${API_BASE}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ hospital_id: h.id })
    });
    setIsOnboardingOpen(false);
    fetchProfile(session);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/patients/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...patientForm, age: patientForm.age ? parseInt(patientForm.age) : null })
    });
    const newPat = await res.json();
    setPatients([{ ...newPat, documents: [] }, ...patients]);
    setIsNewPatientOpen(false);
    setPatientForm({ name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: "" });
  };

  const handleFileAttached = async (e, patientId, stage) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(f => ({ id: `t-${Math.random()}`, name: f.name, stage, status: 'pending', url: URL.createObjectURL(f), rawFile: f }));
    setPatients(ps => ps.map(p => p.id === patientId ? { ...p, documents: [...p.documents, ...newDocs] } : p));
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f, `${stage}__${f.name}`);
      const res = await fetch(`${API_BASE}/documents/?patient_id=${patientId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: fd });
      const up = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, documents: p.documents.map(d => d.name === f.name && d.stage === stage ? { ...d, id: up.id, url: up.file_url, rawFile: f } : d) } : p));
    }
  };

  // Map DB step values to frontend stage names
  const dbStepToStage = (step) => {
    if (!step) return 'preAuth';
    const s = step.toLowerCase().trim();
    if (s === 'pre auth' || s === 'pre_auth' || s === 'preauth') return 'preAuth';
    if (s === 'admitted') return 'admitted';
    if (s === 'settled' || s === 'discharged') return 'settled';
    return 'preAuth';
  };

  const processBatch = async (patient, stage) => {
    const sDocs = patient.documents.filter(d => d.stage === stage);
    setLoading(true);
    setProcessingStatus("Aggregating Records...");
    const blobs = await Promise.all(sDocs.map(async d => {
      if (d.rawFile) return d.rawFile;
      const r = await fetch(d.url);
      const b = await r.blob();
      return new File([b], d.name, { type: 'application/pdf' });
    }));

    // Determine the correct pipeline stage based on DB step
    const pipelineStage = dbStepToStage(patient.step);
    setProcessingStatus(`Running ${pipelineStage === 'preAuth' ? 'Pre-Auth' : 'Admitted'} Pipeline...`);

    const payload = {
      document_ids: sDocs.map(d => d.id).filter(id => id && !id.startsWith('t-')),
      patient_id: patient.id,
      tpa_id: session?.user?.id || null
    };

    try {
      let endpoint = '';
      if (pipelineStage === 'preAuth') endpoint = `${API_BASE}/pipeline/preauth`;
      else endpoint = `${API_BASE}/pipeline/admitted`;

      const res = await fetch(endpoint, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errBody.detail || `API returned ${res.status}`);
      }
      const data = await res.json();
      setProcessingStatus("Finalizing Extraction...");
      
      const passResults = data.results || [data];
      const batchRes = data.results ? data.results[0] : data;

      navigate('/process', { state: { batchResult: batchRes, results: passResults, files: blobs, stage: pipelineStage, patient, pipelineData: data } });
    } catch (err) {
      console.error(err);
      alert(`Pipeline failed: ${err.message}`);
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  return {
    patients, loading, activePatientId, setActivePatientId, 
    isNewPatientOpen, setIsNewPatientOpen, userProfile, isOnboardingOpen,
    processingStatus, patientForm, setPatientForm, hospitalForm, setHospitalForm,
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch
  };
}
