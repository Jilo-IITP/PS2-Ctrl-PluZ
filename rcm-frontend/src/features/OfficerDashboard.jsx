import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useDashboardLogic } from './dashboard/useDashboardLogic';

// Modular Components
import DashboardHeader from './dashboard/DashboardHeader';
import RegistryGrid from './dashboard/RegistryGrid';
import PatientDetailModal from './dashboard/PatientDetailModal';
import NewPatientModal from './dashboard/NewPatientModal';
import OnboardingModal from './dashboard/OnboardingModal';

/**
 * OfficerDashboard
 * Simplified coordinator for the TPA/Hospital Officer view.
 * Logic is abstracted to useDashboardLogic to keep this under 200 lines.
 */
export default function OfficerDashboard() {
  const {
    patients, loading, activePatientId, setActivePatientId,
    isNewPatientOpen, setIsNewPatientOpen, userProfile, isOnboardingOpen,
    processingStatus, patientForm, setPatientForm, hospitalForm, setHospitalForm,
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch,
    isSubmittingPatient, patientError, setPatientError, updatePatientStep,
    handleEditPatient, handleDeletePatient, handleDeleteDocument,
    processSettlement,
    processBillAudit, processBillApproval,
    exportPatientsToCSV
  } = useDashboardLogic();

  const [editingPatientId, setEditingPatientId] = React.useState(null);

  const onEditPatientClick = (patient) => {
    setEditingPatientId(patient.id);
    setPatientForm({
      name: patient.name || "",
      gender: patient.gender || "",
      contact: patient.contact || "",
      dob: patient.dob || "",
      age: patient.age || "",
      policy_number: patient.policy_number || "",
      employee_id: patient.employee_id || "",
      insurer_id: patient.insurer_id || "",
      medical_claim: patient.medical_claim || false,
      occupation: patient.occupation || "",
      address: patient.address || ""
    });
    setIsNewPatientOpen(true);
  };

  const onModalSubmit = (e) => {
    if (editingPatientId) {
      e.preventDefault();
      handleEditPatient(editingPatientId, patientForm);
      setEditingPatientId(null);
    } else {
      handleCreatePatient(e);
    }
  };

  const onModalChange = (isOpen) => {
    setIsNewPatientOpen(isOpen);
    if (!isOpen) {
      setEditingPatientId(null);
      setPatientForm({ name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <DashboardHeader 
        userProfile={userProfile} 
        onLogout={() => supabase.auth.signOut()} 
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase">Master Registry</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">
                {patients.length} Open Workflows
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportPatientsToCSV}
                className="h-7 font-bold text-[10px] uppercase tracking-widest rounded-sm border-2"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <NewPatientModal
                isOpen={isNewPatientOpen}
                onOpenChange={onModalChange}
                formData={patientForm}
                onChange={(e) => setPatientForm({
                  ...patientForm,
                  [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
                })}
                onSubmit={onModalSubmit}
                isEditMode={!!editingPatientId}
              />
            </div>
          </div>

          {loading && processingStatus && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 bg-card p-8 border-2 border-primary shadow-2xl rounded-sm">
                <div className="animate-spin w-12 h-12 rounded-full border-4 border-primary border-t-transparent"></div>
                <div className="text-center">
                  <h3 className="text-lg font-bold uppercase tracking-widest">{processingStatus}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium mt-1">
                    Synchronizing Contextual Inference...
                  </p>
                </div>
              </div>
            </div>
          )}

          <RegistryGrid 
            patients={patients} 
            loading={loading && !processingStatus} 
            onSelectPatient={setActivePatientId} 
            onEditPatient={onEditPatientClick}
            onDeletePatient={handleDeletePatient}
          />
        </div>
      </main>

      <PatientDetailModal 
        patient={patients.find(p => p.id === activePatientId)} 
        isOpen={!!activePatientId} 
        onClose={() => setActivePatientId(null)} 
        onFileAttached={handleFileAttached} 
        onProcessBatch={(patient, stage) => {
          setActivePatientId(null);
          processBatch(patient, stage);
        }}
        onUpdateStep={updatePatientStep}
        onDeleteDocument={handleDeleteDocument}
        onProcessSettlement={processSettlement}
        onProcessBillAudit={processBillAudit}
        onProcessBillApproval={processBillApproval}
        onUpdateStep={() => {}} 
      />

      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        formData={hospitalForm} 
        onChange={(e) => setHospitalForm({ ...hospitalForm, [e.target.id]: e.target.value })} 
        onSubmit={handleOnboardingSubmit} 
      />
    </div>
  );
}

