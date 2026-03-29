import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Fingerprint } from 'lucide-react';

const NewPatientModal = ({ isOpen, onOpenChange, formData, onChange, onSubmit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold text-xs uppercase tracking-widest rounded-sm border-2">
          <Plus className="w-4 h-4 mr-2" /> Registry Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b bg-muted/10 shrink-0">
          <DialogTitle className="uppercase tracking-widest text-sm font-bold">New Registry Entry</DialogTitle>
          <DialogDescription className="text-xs">
            Enter the patient's Aadhar number. The system will automatically associate them with your TPA.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-background">
          <form id="registry-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="aadhar_no" className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                <Fingerprint className="w-3 h-3" /> Aadhar Number *
              </Label>
              <Input 
                id="aadhar_no" 
                name="aadhar_no"
                value={formData.aadhar_no || ''} 
                onChange={onChange} 
                required 
                placeholder="0000 0000 0000"
                className="rounded-sm bg-muted/10 border-foreground/20 h-12 text-lg tracking-widest text-center" 
              />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                Note: This unique identifier is used to synchronize patient records across the network.
              </p>
            </div>
          </form>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
          <Button form="registry-form" type="submit" className="w-full font-bold uppercase tracking-widest rounded-sm">
            Synchronize Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPatientModal;
