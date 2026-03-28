import React from 'react';
import PatientCard from './PatientCard';

const RegistryGrid = ({ patients, loading, onSelectPatient }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
      {patients.length === 0 ? (
        <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/20 border border-dashed text-sm font-medium uppercase tracking-widest rounded-sm">
          Registry is empty.
        </div>
      ) : (
        patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} onSelect={onSelectPatient} />
        ))
      )}
    </div>
  );
};

export default RegistryGrid;
