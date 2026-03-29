import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './features/Auth';
import OfficerDashboard from './features/OfficerDashboard';
import ProcessingPipeline from './features/ProcessingPipeline';
import SettlementDashboard from './features/SettlementDashboard';
import { ThemeProvider } from '@/components/ui/theme_provider';
import { PatientProvider } from './context/PatientContext';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rcm-ui-theme">
      <PatientProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<OfficerDashboard />} />
            <Route path="/process" element={<ProcessingPipeline />} />
            <Route path="/settlement" element={<SettlementDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PatientProvider>
    </ThemeProvider>
  );
}

export default App;