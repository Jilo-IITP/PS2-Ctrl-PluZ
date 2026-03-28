import React, { useState, useRef } from "react"
import { UploadCloud, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DocumentUpload({ onFileUpload }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const parseFiles = (filesList) => {
    if (!filesList || filesList.length === 0) return
    setError(null)
    
    // Quick validation
    const newFiles = Array.from(filesList).filter((file) => file.type === "application/pdf")
    if (newFiles.length !== filesList.length) {
      setError("Some files were rejected. Only standard PDF documents are allowed.")
    }
    
    // Prevent duplicates by name
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name))
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name))
      return [...prev, ...uniqueNewFiles]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files) parseFiles(e.dataTransfer.files)
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files) parseFiles(e.target.files)
  }

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleProcess = () => {
    if (selectedFiles.length > 0 && onFileUpload) {
      onFileUpload(selectedFiles)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid File Type</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Full-width Drag & Drop Zone */}
      <Card
        className={`relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer overflow-hidden ${
          dragActive 
            ? "border-primary bg-primary/5 " 
            : "border-border bg-card/50 hover:bg-muted/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center p-8 text-center space-y-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />

          <div className={`p-4 rounded-full transition-colors ${dragActive ? "bg-primary/20" : "bg-muted"}`}>
            <UploadCloud className={`w-10 h-10 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              <span className="text-primary hover:underline">Click to browse</span> or drag and drop
            </h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Standard PDF documents only (Max 10MB per file recommend)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic File List Section */}
      {selectedFiles.length > 0 && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
              Staged Documents
              <Badge variant="secondary">{selectedFiles.length} Queue</Badge>
            </h3>
            <Button onClick={handleProcess} size="default" className="hidden md:flex gap-2 font-bold shadow-md shadow-primary/20">
              <CheckCircle className="w-4 h-4" />
              Run AI Pipeline
            </Button>
          </div>

          <ScrollArea className="h-auto max-h-[40vh] w-full rounded-md border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedFiles.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`} 
                  className="flex items-center justify-between p-3 rounded-xl border bg-background hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold truncate pr-4 text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Button onClick={handleProcess} size="lg" className="w-full mt-6 md:hidden gap-2 font-bold">
            <CheckCircle className="w-5 h-5" />
            Run AI Pipeline
          </Button>
        </div>
      )}
    </div>
  )
}