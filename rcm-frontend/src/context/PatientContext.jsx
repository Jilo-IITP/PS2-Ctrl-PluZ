import React, { createContext, useContext, useState, useEffect } from 'react';

const PatientContext = createContext();

export const usePatients = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatients must be used within a PatientProvider');
    }
    return context;
};

export const PatientProvider = ({ children }) => {
    const [patients, setPatients] = useState(() => {
        const saved = sessionStorage.getItem('patient_data');
        return saved ? JSON.parse(saved) : [];
    });
    const [isFetched, setIsFetched] = useState(false);
    const [userProfile, setUserProfile] = useState(() => {
        const saved = sessionStorage.getItem('user_profile');
        return saved ? JSON.parse(saved) : null;
    });

    // Sync metadata to sessionStorage when patients or profile changes
    useEffect(() => {
        // Strip out Blobs/Files for sessionStorage
        const metadataOnly = patients.map(p => ({
            ...p,
            documents: p.documents?.map(d => {
                const { rawFile, ...rest } = d;
                return rest;
            })
        }));
        sessionStorage.setItem('patient_data', JSON.stringify(metadataOnly));
    }, [patients]);

    useEffect(() => {
        if (userProfile) {
            sessionStorage.setItem('user_profile', JSON.stringify(userProfile));
        }
    }, [userProfile]);

    const value = {
        patients,
        setPatients,
        isFetched,
        setIsFetched,
        userProfile,
        setUserProfile
    };

    return (
        <PatientContext.Provider value={value}>
            {children}
        </PatientContext.Provider>
    );
};
