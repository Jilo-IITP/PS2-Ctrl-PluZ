import React from 'react';
import { FolderOpen, Info, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/themetoggle';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const DashboardHeader = ({ userProfile, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-background font-bold shadow-sm">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest leading-none uppercase">Ctrl PluZ</h1>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest mt-0.5">
              Officer Profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted border shadow-sm bg-background">
                <Info className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><Info className="w-4 h-4" /> Application Workflow</DialogTitle>
                <DialogDescription className="text-xs">
                  Instructions for strict minimal workflow completion.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 text-xs">
                <p className="text-muted-foreground">Click on any patient card to open their active file tab. You will only see the clinical stages they have progressed to. Upload required documents into the corresponding stage bucket.</p>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col items-end">
            <p className="text-[9px] font-bold uppercase tracking-widest text-foreground">{userProfile?.hospital_name || 'Medical Center'}</p>
          </div>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onLogout} className="h-7 text-[9px] px-2 uppercase tracking-widest font-bold hidden sm:flex">
            <LogOut className="w-3 h-3 mr-1.5" /> End Session
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
