import React from 'react';
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
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch
  } = useDashboardLogic();

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
            <NewPatientModal 
              isOpen={isNewPatientOpen} 
              onOpenChange={setIsNewPatientOpen} 
              formData={patientForm} 
              onChange={(e) => setPatientForm({ 
                ...patientForm, 
                [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value 
              })} 
              onSubmit={handleCreatePatient} 
            />
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
          />
        </div>
      </main>

      <PatientDetailModal 
        patient={patients.find(p => p.id === activePatientId)} 
        isOpen={!!activePatientId} 
        onClose={() => setActivePatientId(null)} 
        onFileAttached={handleFileAttached} 
        onProcessBatch={processBatch} 
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

