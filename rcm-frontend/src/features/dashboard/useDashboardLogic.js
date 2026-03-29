import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { usePatients } from '../../context/PatientContext';

const API_BASE = 'http://localhost:8000';

export function useDashboardLogic() {
  const { patients, setPatients, isFetched, setIsFetched, userProfile, setUserProfile } = usePatients();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(!isFetched);
  const [activePatientId, setActivePatientId] = useState(null);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);
  const [patientError, setPatientError] = useState("");

  const [patientForm, setPatientForm] = useState({
    aadhar_no: ""
  });

  const [hospitalForm, setHospitalForm] = useState({
    name: "", location: "", email_id: "", rohini_id: ""
  });

  useEffect(() => {
    const cachedPatients = sessionStorage.getItem('cachedPatients');
    let loadedFromCache = false;

    if (cachedPatients && cachedPatients !== '[]') {
      try {
        setPatients(JSON.parse(cachedPatients));
        setLoading(false);
        loadedFromCache = true;
      } catch (e) {
        console.error("Cache parsing error", e);
      }
    }

    supabase.auth.getSession().then(({ data: { session: cur } }) => {
      setSession(cur);
      if (cur) {
        if (!userProfile) fetchProfile(cur);
        if (!isFetched) fetchPatients(cur);
        else setLoading(false);
      }
      else { setLoading(false); }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) {
        if (!userProfile) fetchProfile(s);
        if (!isFetched) fetchPatients(s);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [isFetched]);

  useEffect(() => {
    sessionStorage.setItem('cachedPatients', JSON.stringify(patients));
  }, [patients]);

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
      setIsFetched(true);
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

  /**
   * handleCreatePatient
   * Updated to only send aadhar_no. Backend handles lookup and TPA association.
   */
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!session) { setPatientError("Session expired. Please log in again."); return; }
    setIsSubmittingPatient(true);
    setPatientError("");
    try {
      setLoading(true);
      setProcessingStatus("Synchronizing Patient Registry...");
      
      const res = await fetch(`${API_BASE}/patients/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ 
          aadhar_no: patientForm.aadhar_no 
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create/update patient");
      }
      
      const newPat = await res.json();
      
      // Update local state: Replace if already exists in list, otherwise add to top
      setPatients(prev => {
        const exists = prev.findIndex(p => p.aadhar_no === newPat.aadhar_no);
        if (exists !== -1) {
          const updated = [...prev];
          updated[exists] = { ...newPat, documents: prev[exists].documents || [] };
          return updated;
        }
        return [{ ...newPat, documents: [] }, ...prev];
      });
      
      setIsNewPatientOpen(false);
      setPatientForm({ aadhar_no: "" });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  const updatePatientStep = async (patientId, newStep) => {
    if (!session) return;
    try {
      // Optimistic update
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, step: newStep } : p));

      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ step: newStep })
      });

      if (!res.ok) {
        // Revert on error
        fetchPatients(session);
        throw new Error("Failed to update patient step");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Check connection.");
    }
  };

  const handleEditPatient = async (patientId, data) => {
    if (!session) return;
    setIsSubmittingPatient(true);
    setPatientError("");
    try {
      const payload = { ...data, age: data.age ? parseInt(data.age) : null };
      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
      const updatedPat = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { ...updatedPat, documents: p.documents } : p));
      setIsNewPatientOpen(false);
    } catch (err) {
      console.error(err);
      setPatientError(err.message || "Failed to edit patient details.");
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!session) return;
    if (!window.confirm("Are you sure you want to permanently delete this patient context?")) return;
    try {
      setPatients(ps => ps.filter(p => p.id !== patientId)); // Optimistic delete
      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        fetchPatients(session); // Revert on failure
        throw new Error("Failed to delete patient");
      }
      if (activePatientId === patientId) setActivePatientId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete patient context.");
    }
  }; // Fixed closing brace

  const handleDeleteDocument = async (patientId, docId) => {
    if (!session) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      // Optimistic delete
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, documents: p.documents.filter(d => d.id !== docId) } : p));

      const res = await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        fetchPatients(session); // Revert on failure
        throw new Error("Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    } // Fixed closing brace
  };

  const handleFileAttached = async (e, patientId, stage, prefix = "") => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(f => ({ 
      id: `t-${Math.random()}`, 
      name: prefix ? `${prefix}${f.name}` : f.name, 
      stage, 
      status: 'pending', 
      url: URL.createObjectURL(f), 
      rawFile: f 
    }));
    setPatients(ps => ps.map(p => p.id === patientId ? { ...p, documents: [...p.documents, ...newDocs] } : p));
    for (const f of files) {
      const fd = new FormData();
      const fileName = prefix ? `${prefix}${f.name}` : f.name;
      fd.append("file", f, `${stage}__${fileName}`);
      const res = await fetch(`${API_BASE}/documents/?patient_id=${patientId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: fd });
      const up = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { 
        ...p, 
        documents: p.documents.map(d => (d.name === fileName || d.name === f.name) && d.stage === stage ? { ...d, id: up.id, url: up.file_url, rawFile: f } : d) 
      } : p));
    }
  };

  const addPatientAmount = async (patientId, description, amount) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/amount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ description, amount: Number(amount) })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errBody.detail || `API returned ${res.status}`);
      }
      const updatedPatient = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, amount: updatedPatient.amount } : p));
      return updatedPatient;
    } catch (err) {
      console.error('addPatientAmount failed:', err);
      alert(`Failed to add amount: ${err.message}`);
    }
  };

  const deletePatientAmount = async (patientId, description) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/amount/${encodeURIComponent(description)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errBody.detail || `API returned ${res.status}`);
      }
      const updatedPatient = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, amount: updatedPatient.amount } : p));
      return updatedPatient;
    } catch (err) {
      console.error('deletePatientAmount failed:', err);
      alert(`Failed to delete amount: ${err.message}`);
    }
  };

  const refreshPatientData = async (patientId) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (!res.ok) return;
      const freshPatient = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, ...freshPatient } : p));
    } catch (err) {
      console.error('refreshPatientData failed:', err);
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
    if (!session) { alert("Session expired. Please log in again."); return; }
    const sDocs = patient.documents.filter(d => d.stage === stage);
    setLoading(true);
    setProcessingStatus("Aggregating Records...");
    
    try {
      const pipelineStage = dbStepToStage(patient.step);
      setProcessingStatus(`Running ${pipelineStage === 'preAuth' ? 'Pre-Auth' : 'Admitted'} Pipeline...`);

      const payload = {
        document_ids: sDocs.map(d => d.id).filter(id => id && !id.startsWith('t-')),
        patient_id: patient.id,
        tpa_id: session?.user?.id || null
      };

      let endpoint = pipelineStage === 'preAuth' 
        ? `${API_BASE}/pipeline/preauth` 
        : `${API_BASE}/pipeline/admitted`;

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

      // Single navigation call with all necessary data
      navigate('/process', { 
        state: { 
          batchResult: data.results ? data.results[0] : data, 
          results: data.results || [data], 
          files: sDocs.map(d => ({ name: d.name, url: d.url })), 
          stage: pipelineStage, 
          patient, 
          pipelineData: data 
        } 
      });

    } catch (err) {
      console.error(err);
      alert(`Pipeline failed: ${err.message}`);
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  // ... inside useDashboardLogic() before the return statement ...

  const exportPatientsToCSV = () => {
    // We filter out patients with 'settled' step just like your return statement does
    const activePatients = patients.filter(p => !['setteled', 'settled'].includes(p.step?.toLowerCase()));

    if (!activePatients || activePatients.length === 0) {
      alert("No patient data available to export.");
      return;
    }

    // Define the exact columns we want to export based on your JSON
    const headers = [
      "id", "tpa_id", "name", "gender", "contact", "dob", "age",
      "policy_number", "employee_id", "insurer_id", "medical_claim",
      "occupation", "address", "step", "aadhar_no", "created_at"
    ];

    // Create the CSV header row
    let csvContent = headers.join(",") + "\n";

    // Map through patients and create CSV rows
    activePatients.forEach(patient => {
      const row = headers.map(header => {
        let val = patient[header];

        // Handle nulls/undefined
        if (val === null || val === undefined) val = "";

        // Convert to string and escape existing double quotes
        val = String(val).replace(/"/g, '""');

        // Wrap in quotes if the value contains a comma, newline, or quotes
        if (val.includes(",") || val.includes("\n") || val.includes("\"")) {
          val = `"${val}"`;
        }

        return val;
      });
      csvContent += row.join(",") + "\n";
    });

    // Create a Blob and trigger the download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Add today's date to the filename
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Patient_Registry_Export_${date}.csv`);

    // Trigger download mechanism
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    patients: patients.filter(p => !['setteled', 'settled'].includes(p.step?.toLowerCase())),
    loading, activePatientId, setActivePatientId,
    isNewPatientOpen, setIsNewPatientOpen, userProfile, isOnboardingOpen,
    processingStatus, patientForm, setPatientForm, hospitalForm, setHospitalForm,
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch,
    isSubmittingPatient, patientError, setPatientError, updatePatientStep,
    handleEditPatient, handleDeletePatient, handleDeleteDocument,
    exportPatientsToCSV,
    addPatientAmount, deletePatientAmount, refreshPatientData
  };
}