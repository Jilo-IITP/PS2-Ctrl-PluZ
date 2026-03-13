import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react';

const DocumentUpload = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // Changed to an array
  const inputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter for PDFs only and convert FileList to Array
      const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
      
      if (newFiles.length !== e.dataTransfer.files.length) {
         alert("Bhai, some files were ignored. PDF only!");
      }
      
      // Append new files to the existing array
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle manual file selection
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      
      if (newFiles.length !== e.target.files.length) {
        alert("Bhai, some files were ignored. PDF only!");
      }
      
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    inputRef.current.click();
  };

  // Remove specific file by index
  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Submit to parent (or backend)
  const handleProcess = () => {
    if (selectedFiles.length > 0) {
      onFileUpload(selectedFiles); // Passing the array to App.js
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-stone-200">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-stone-800">Upload Medical Batch</h2>
        <p className="text-stone-500 text-sm mt-1">
          Securely import multiple discharge summaries, bills, or lab reports (PDF only) for AI extraction.
        </p>
      </div>

      {/* Drag & Drop Zone - ALWAYS visible so users can keep adding files */}
      <div
        className={`relative flex flex-col items-center justify-center w-full h-48 mb-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out ${
          dragActive ? 'border-teal-500 bg-teal-50' : 'border-stone-300 bg-stone-50 hover:bg-stone-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple // Enables selecting multiple files in the system dialog
          accept=".pdf" 
          onChange={handleChange} // Fixed typo here
          className="hidden" 
          id="file-upload"
        />

        <UploadCloud className={`w-12 h-12 mb-4 ${dragActive ? 'text-teal-500' : 'text-stone-400'}`} />
        <p className="mb-2 text-sm text-stone-600">
          <span className="font-semibold text-teal-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-stone-500">Add multiple PDF documents (Max 10MB each)</p>
      </div>

      {/* Dynamic File List Preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-col space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-lg">
              <div className="flex items-center space-x-3 text-teal-700 overflow-hidden">
                <FileText className="w-6 h-6 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs opacity-80">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => removeFile(index)}
                className="p-1.5 text-teal-700 hover:bg-teal-200 hover:text-red-500 rounded-full transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Process Button - Only shows if there are files */}
      {selectedFiles.length > 0 && (
        <button
          onClick={handleProcess}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-md"
        >
          <CheckCircle className="w-5 h-5" />
          <span>Process {selectedFiles.length} {selectedFiles.length === 1 ? 'Document' : 'Documents'} with AI Engine</span>
        </button>
      )}
    </div>
  );
};

export default DocumentUpload;